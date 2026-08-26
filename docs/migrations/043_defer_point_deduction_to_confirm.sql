-- ============================================================
-- Migration 043: 포인트/재고 차감 시점을 "교환하기"→"사장님 확인"으로 이동
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 날짜: 2026-08-26
--
-- 배경:
--   지금까지는 손님이 "교환하기"를 누르는 순간 redeem_points_atomic이 포인트와
--   재고를 즉시 차감했다. 그런데 실제 정책은 "사장님 확인"(매장 직원이 실제로
--   쿠폰을 확인/적용하는 순간)에 비로소 포인트와 재고가 차감되어야 한다 —
--   "교환하기"는 쿠폰 코드 화면을 보여주는 것뿐, 실제 지급/차감은 매장에서
--   확정되는 순간 일어나야 한다. 게임 당첨 쿠폰이 당첨된다고 포인트가 깎이지
--   않듯, 리워드 교환도 "예약(코드 발급)"과 "실제 사용(확정)"을 분리해야 한다.
--   지금 방식대로면 손님이 "교환하기"만 누르고 매장에 가지 않아도(=사장님 확인
--   전) 포인트/재고가 이미 사라져서, 손님 입장에서는 "누르지도 않았는데 사용
--   처리된 것처럼 포인트가 깎이고 다른 교환하기 버튼까지 비활성화된다"는
--   문제로 보였다.
--
-- 변경 사항:
--   1. coupons.point_cost 컬럼 추가 — reward_redemption 쿠폰이 "사장님 확인"
--      시점에 얼마를 차감해야 하는지 교환 시점 가격으로 고정해서 들고 있는다
--      (나중에 reward_catalog.point_cost가 바뀌어도 이미 발급된 쿠폰은 영향 없음).
--   2. redeem_points_atomic: 포인트/재고 차감과 point_ledger 기록을 모두 제거.
--      잔액/재고는 "지금 교환 가능한지" 확인용으로만 조회하고, coupons row만
--      생성한다(point_cost 값은 나중을 위해 함께 저장). 포인트도 재고도 이 시점엔
--      건드리지 않는다.
--   3. confirm_coupon_used_atomic 신규 RPC: 쿠폰 상태를 'used'로 바꾸는 "실제
--      사용 확정" 시점에 이 함수를 호출한다. source_type = 'reward_redemption'인
--      쿠폰이면 이 시점에 비로소 point_cost만큼 포인트를 차감하고 point_ledger에
--      기록하며, reward_catalog.stock도 이때 1 차감한다. game_win 등 다른 쿠폰은
--      포인트/재고와 무관하므로 상태만 바뀐다.
--      호출부: /api/me/coupons/[couponId]/confirm-use, /api/checkout/[storeId]/approve
-- ============================================================

-- ── 1. coupons.point_cost — reward_redemption 쿠폰의 "확정 시 차감할 포인트" ──
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS point_cost integer;

COMMENT ON COLUMN coupons.point_cost IS
  'source_type = reward_redemption일 때만 값 있음 — 사장님 확인(사용 확정) 시점에 차감할 포인트(교환 당시 가격으로 고정)';

-- ── 2. redeem_points_atomic: 포인트 차감 제거, 재고 차감 + 쿠폰 발급만 ──
CREATE OR REPLACE FUNCTION redeem_points_atomic(
  p_kakao_user_id   text,
  p_store_id        text,
  p_reward_id       uuid,
  p_point_cost      integer,
  p_usage_threshold integer  -- 더 이상 사용하지 않음(호출부 시그니처 호환을 위해서만 유지)
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_balance integer;
  v_reward          record;
  v_coupon_id       uuid;
  v_initial_status  text;
  v_amount          integer;
BEGIN
  SELECT point_balance INTO v_current_balance
  FROM customer_loyalty
  WHERE store_id = p_store_id AND kakao_user_id = p_kakao_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', '포인트 정보를 찾을 수 없습니다');
  END IF;

  -- 교환 가능 여부는 여전히 point_cost로 판단한다(포인트가 없는데 예약만
  -- 계속 쌓이는 걸 막기 위함) — 다만 실제 차감은 사장님 확인 시점에 한다.
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

  -- "교환하기"는 쿠폰 코드 화면을 보여주는 것뿐 — 재고/포인트는 사장님 확인
  -- 전까지 건드리지 않는다(둘 다 confirm_coupon_used_atomic에서 처리).

  v_initial_status := CASE WHEN v_reward.requires_verification THEN 'pending_verify' ELSE 'pending_apply' END;
  v_amount := CASE WHEN v_reward.reward_type = 'discount' THEN COALESCE(v_reward.discount_amount, 0) ELSE 0 END;

  INSERT INTO coupons (
    store_id, kakao_user_id, event_id, amount, label, source_type,
    reward_catalog_id, point_cost, requires_verification, status, issued_at, valid_until
  ) VALUES (
    p_store_id, p_kakao_user_id, NULL, v_amount, v_reward.name, 'reward_redemption',
    p_reward_id, p_point_cost, v_reward.requires_verification, v_initial_status, now(), now() + interval '14 days'
  )
  RETURNING id INTO v_coupon_id;

  -- point_ledger 기록 없음, customer_loyalty.point_balance/reward_catalog.stock 변경 없음
  -- → confirm_coupon_used_atomic(사장님 확인)에서 처리한다.

  RETURN jsonb_build_object(
    'ok', true,
    'coupon_id', v_coupon_id,
    'new_balance', v_current_balance
  );
END;
$$;

GRANT EXECUTE ON FUNCTION redeem_points_atomic TO service_role;

-- ── 3. confirm_coupon_used_atomic: "사장님 확인" 시점에 상태 확정 + 포인트 차감 ──
-- p_expected_status가 NULL이 아니면 그 상태일 때만 처리한다(계산대 2단계 플로우의
-- apply 액션은 pending_apply에서만 허용). NULL이면(손님 쿠폰함 셀프 확인 화면)
-- used/expired가 아닌 모든 상태에서 허용한다.
CREATE OR REPLACE FUNCTION confirm_coupon_used_atomic(
  p_coupon_id       uuid,
  p_expected_status text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_coupon  record;
  v_now     timestamptz := now();
  v_deducted integer := 0;
BEGIN
  SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', '쿠폰을 찾을 수 없습니다');
  END IF;

  IF v_coupon.status = 'used' THEN
    RETURN jsonb_build_object('ok', false, 'error', '이미 사용된 쿠폰입니다');
  END IF;

  IF v_coupon.status = 'expired' OR v_coupon.valid_until < v_now THEN
    RETURN jsonb_build_object('ok', false, 'error', '사용기간이 지난 쿠폰입니다');
  END IF;

  IF p_expected_status IS NOT NULL AND v_coupon.status != p_expected_status THEN
    RETURN jsonb_build_object('ok', false, 'error', format('현재 상태(%s)에서는 확정할 수 없습니다', v_coupon.status));
  END IF;

  UPDATE coupons SET status = 'used', used_at = v_now WHERE id = p_coupon_id;

  -- 리워드 교환 쿠폰만 이 시점에 비로소 포인트/재고를 차감한다.
  IF v_coupon.source_type = 'reward_redemption' THEN
    IF COALESCE(v_coupon.point_cost, 0) > 0 THEN
      v_deducted := v_coupon.point_cost;
      UPDATE customer_loyalty
      SET point_balance = GREATEST(0, point_balance - v_deducted)
      WHERE store_id = v_coupon.store_id AND kakao_user_id = v_coupon.kakao_user_id;

      INSERT INTO point_ledger (store_id, kakao_user_id, type, amount, related_coupon_id)
      VALUES (v_coupon.store_id, v_coupon.kakao_user_id, 'redeem', v_deducted, p_coupon_id);
    END IF;

    IF v_coupon.reward_catalog_id IS NOT NULL THEN
      UPDATE reward_catalog
      SET stock = GREATEST(0, stock - 1)
      WHERE id = v_coupon.reward_catalog_id AND stock IS NOT NULL;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'status', 'used',
    'used_at', v_now,
    'points_deducted', v_deducted
  );
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_coupon_used_atomic TO service_role;
