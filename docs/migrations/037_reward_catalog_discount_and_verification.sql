-- ============================================================
-- Migration 037: 리워드 카탈로그 — 할인금액 컬럼 + 본인확인 토글 실동작화
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경:
--  1) reward_catalog.requires_verification 컬럼은 있었지만 등록 폼에
--     입력 필드가 없어 항상 true로 고정 저장되고 있었다. 폼에 체크박스를
--     추가해도, 리워드 교환 RPC(redeem_points_atomic)가 이 값을 무시하고
--     무조건 'pending_verify'(계산대 확인 대기) 상태로만 발급하고 있어서
--     체크를 꺼도 계산대 흐름이 바뀌지 않는 문제가 있었다. 이번 마이그레이션은
--     RPC가 requires_verification 값에 따라 초기 상태를 분기하도록 고친다
--     (false면 확인 단계 없이 곧바로 'pending_apply'로 발급).
--  2) assign_checkout_queue도 초기 대기열 상태를 항상 'waiting'으로 고정
--     저장하고 있어서, (1)에서 처음부터 'pending_apply'로 발급된 리워드를
--     QR로 스캔하면 대기열엔 '단골 확인 대기'로 잘못 표시되는 불일치가
--     생긴다. 초기 상태를 인자로 받아 반영하도록 확장한다 (기본값은 기존과
--     동일한 'waiting'이라 기존 호출부는 수정 없이도 그대로 동작한다).
--  3) 할인쿠폰(discount) 유형의 실제 할인 금액을 저장할 컬럼이 없었다.
-- ============================================================

-- ── 1. 할인 금액 컬럼 추가 ───────────────────────────────────
ALTER TABLE reward_catalog
  ADD COLUMN IF NOT EXISTS discount_amount integer;

COMMENT ON COLUMN reward_catalog.discount_amount IS
  '리워드 유형이 할인쿠폰(discount)일 때 결제 시 적용할 할인 금액(원). 다른 유형은 NULL.';

-- ── 2. redeem_points_atomic: requires_verification=false면 확인 단계 생략 ──
CREATE OR REPLACE FUNCTION redeem_points_atomic(
  p_kakao_user_id   text,
  p_store_id        text,
  p_reward_id       uuid,
  p_point_cost      integer,
  p_usage_threshold integer
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_balance integer;
  v_reward          record;
  v_issued_id       uuid;
  v_ledger_id       uuid;
  v_initial_status  text;
BEGIN
  SELECT point_balance INTO v_current_balance
  FROM customer_loyalty
  WHERE store_id = p_store_id AND kakao_user_id = p_kakao_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', '포인트 정보를 찾을 수 없습니다');
  END IF;

  IF v_current_balance < p_usage_threshold THEN
    RETURN jsonb_build_object('ok', false, 'error', '사용 임계값 미달입니다');
  END IF;

  IF v_current_balance < p_point_cost THEN
    RETURN jsonb_build_object('ok', false, 'error', '포인트가 부족합니다');
  END IF;

  SELECT * INTO v_reward FROM reward_catalog
  WHERE id = p_reward_id AND store_id = p_store_id AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', '유효하지 않은 리워드입니다');
  END IF;

  IF v_reward.stock IS NOT NULL AND v_reward.stock <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', '재고가 소진되었습니다');
  END IF;

  UPDATE customer_loyalty
  SET point_balance = point_balance - p_point_cost
  WHERE store_id = p_store_id AND kakao_user_id = p_kakao_user_id;

  IF v_reward.stock IS NOT NULL THEN
    UPDATE reward_catalog SET stock = stock - 1 WHERE id = p_reward_id;
  END IF;

  -- 본인확인이 필요 없는 리워드는 계산대 [확인함] 단계를 건너뛰고
  -- 곧바로 "할인 적용 대기" 상태로 발급한다.
  v_initial_status := CASE WHEN v_reward.requires_verification THEN 'pending_verify' ELSE 'pending_apply' END;

  INSERT INTO rewards_issued (reward_catalog_id, store_id, kakao_user_id, status)
  VALUES (p_reward_id, p_store_id, p_kakao_user_id, v_initial_status)
  RETURNING id INTO v_issued_id;

  INSERT INTO point_ledger (store_id, kakao_user_id, type, amount, related_reward_id)
  VALUES (p_store_id, p_kakao_user_id, 'redeem', p_point_cost, v_issued_id)
  RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object(
    'ok', true,
    'issued_id', v_issued_id,
    'new_balance', v_current_balance - p_point_cost
  );
END;
$$;

-- ── 3. assign_checkout_queue: 초기 대기열 상태를 인자로 받도록 확장 ──
CREATE OR REPLACE FUNCTION assign_checkout_queue(
  p_store_id       text,
  p_kakao_user_id  text,
  p_item_type      text,
  p_item_id        uuid,
  p_label          text,
  p_amount         integer,
  p_initial_status text DEFAULT 'waiting'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_date date := (now() AT TIME ZONE 'Asia/Seoul')::date;
  v_row  checkout_queue%ROWTYPE;
  v_seq  integer;
BEGIN
  SELECT * INTO v_row
  FROM checkout_queue
  WHERE store_id = p_store_id
    AND queue_date = v_date
    AND item_type = p_item_type
    AND item_id = p_item_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'id', v_row.id,
      'display_code', v_row.display_code,
      'seq', v_row.seq,
      'status', v_row.status,
      'reused', true
    );
  END IF;

  SELECT COALESCE(MAX(seq), 0) + 1 INTO v_seq
  FROM checkout_queue
  WHERE store_id = p_store_id AND queue_date = v_date;

  INSERT INTO checkout_queue (
    store_id, queue_date, seq, display_code,
    kakao_user_id, item_type, item_id, label, amount, status
  ) VALUES (
    p_store_id, v_date, v_seq, 'A' || v_seq,
    p_kakao_user_id, p_item_type, p_item_id, p_label, p_amount, p_initial_status
  )
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'display_code', v_row.display_code,
    'seq', v_row.seq,
    'status', v_row.status,
    'reused', false
  );
END;
$$;
