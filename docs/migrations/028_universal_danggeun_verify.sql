-- ============================================================
-- Migration 028: 전 경품 당근 단골 확인 의무화 + 계산대 QR/대기번호
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 변경 요약:
--  - 금액 기준 분기 폐기. 모든 쿠폰/리워드는 발급 즉시 pending_verify
--  - [확인함] 후 used가 아니라 pending_apply → [할인 적용 완료]에서 used
--  - auto_confirm_threshold 필드는 만들지 않음
--  - qr_checkout_enabled, checkout_queue 추가
-- ============================================================

-- ── 1. requires_verification: 기본값 true, 기존 데이터 통일 ──
ALTER TABLE prize_tiers
  ALTER COLUMN requires_verification SET DEFAULT true;
UPDATE prize_tiers SET requires_verification = true;

ALTER TABLE coupons
  ALTER COLUMN requires_verification SET DEFAULT true;
UPDATE coupons SET requires_verification = true;

ALTER TABLE reward_catalog
  ALTER COLUMN requires_verification SET DEFAULT true;
UPDATE reward_catalog SET requires_verification = true;

-- ── 2. 쿠폰 상태: pending_apply 추가, 미사용 issued → pending_verify ──
ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_status_check;
ALTER TABLE coupons ADD CONSTRAINT coupons_status_check
  CHECK (status IN ('issued', 'pending_verify', 'pending_apply', 'used', 'expired', 'unverified'));

UPDATE coupons SET status = 'pending_verify'
  WHERE status = 'issued';

ALTER TABLE coupons ALTER COLUMN status SET DEFAULT 'pending_verify';

-- ── 3. 리워드 상태: pending_verify / pending_apply / unverified 추가 ──
ALTER TABLE rewards_issued DROP CONSTRAINT IF EXISTS rewards_issued_status_check;
ALTER TABLE rewards_issued ADD CONSTRAINT rewards_issued_status_check
  CHECK (status IN ('issued', 'pending_verify', 'pending_apply', 'used', 'expired', 'unverified'));

UPDATE rewards_issued SET status = 'pending_verify'
  WHERE status = 'issued';

ALTER TABLE rewards_issued ALTER COLUMN status SET DEFAULT 'pending_verify';

-- ── 4. 매장 QR 계산대 스위치 ──
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS qr_checkout_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN store_settings.qr_checkout_enabled IS
  'true면 손님 QR 스캔으로 본인 대기 경품 자동 조회. false면 코드 입력만.';

-- ── 5. 계산대 대기번호 ──
CREATE TABLE IF NOT EXISTS checkout_queue (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id       text        NOT NULL,
  queue_date     date        NOT NULL,          -- KST 날짜
  seq            integer     NOT NULL,
  display_code   text        NOT NULL,          -- A1, A2, ...
  kakao_user_id  text,
  item_type      text        NOT NULL CHECK (item_type IN ('coupon', 'reward')),
  item_id        uuid        NOT NULL,
  label          text,
  amount         integer     NOT NULL DEFAULT 0,
  status         text        NOT NULL DEFAULT 'waiting'
                   CHECK (status IN ('waiting', 'confirmed', 'applied', 'cancelled')),
  created_at     timestamptz DEFAULT now(),
  UNIQUE (store_id, queue_date, seq),
  UNIQUE (store_id, queue_date, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_checkout_queue_store_date
  ON checkout_queue (store_id, queue_date, status);

ALTER TABLE checkout_queue DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON checkout_queue TO service_role;

-- 대기번호 발급 (같은 경품은 당일 번호 재사용)
CREATE OR REPLACE FUNCTION assign_checkout_queue(
  p_store_id      text,
  p_kakao_user_id text,
  p_item_type     text,
  p_item_id       uuid,
  p_label         text,
  p_amount        integer
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
    p_kakao_user_id, p_item_type, p_item_id, p_label, p_amount, 'waiting'
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

GRANT EXECUTE ON FUNCTION assign_checkout_queue TO service_role;

-- ── 6. 리워드 교환 RPC: 발급 상태를 pending_verify로 ──
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

  INSERT INTO rewards_issued (reward_catalog_id, store_id, kakao_user_id, status)
  VALUES (p_reward_id, p_store_id, p_kakao_user_id, 'pending_verify')
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

-- ── 7. 미션 쿠폰 발급: 금액 분기 제거, 항상 pending_verify ──
CREATE OR REPLACE FUNCTION process_mission_progress(
  p_store_id     text,
  p_kakao_user_id text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mission     record;
  v_new_value   integer;
  v_updated     integer;
BEGIN
  FOR v_mission IN
    SELECT id, target_value, reward_type, reward_value, end_at
    FROM missions
    WHERE store_id    = p_store_id
      AND mission_type = 'visit_count'
      AND active       = true
      AND (start_at IS NULL OR start_at <= now())
      AND (end_at   IS NULL OR end_at   >  now())
  LOOP
    IF EXISTS (
      SELECT 1 FROM mission_progress
      WHERE mission_id    = v_mission.id
        AND store_id      = p_store_id
        AND kakao_user_id = p_kakao_user_id
        AND completed_at IS NOT NULL
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO mission_progress (mission_id, store_id, kakao_user_id, current_value, updated_at)
    VALUES (v_mission.id, p_store_id, p_kakao_user_id, 1, now())
    ON CONFLICT (mission_id, store_id, kakao_user_id)
    DO UPDATE
      SET current_value = mission_progress.current_value + 1,
          updated_at    = now()
    RETURNING current_value INTO v_new_value;

    IF v_new_value >= v_mission.target_value THEN
      UPDATE mission_progress
         SET completed_at = now()
       WHERE mission_id    = v_mission.id
         AND store_id      = p_store_id
         AND kakao_user_id = p_kakao_user_id
         AND completed_at IS NULL;

      GET DIAGNOSTICS v_updated = ROW_COUNT;

      IF v_updated > 0 THEN
        IF v_mission.reward_type = 'point' THEN
          INSERT INTO point_ledger (store_id, kakao_user_id, type, amount)
          VALUES (p_store_id, p_kakao_user_id, 'earn', v_mission.reward_value);

          INSERT INTO customer_loyalty (store_id, kakao_user_id, point_balance, visit_count, last_visit_at)
          VALUES (p_store_id, p_kakao_user_id, v_mission.reward_value, 0, now())
          ON CONFLICT (store_id, kakao_user_id)
          DO UPDATE SET point_balance = customer_loyalty.point_balance + v_mission.reward_value;

        ELSIF v_mission.reward_type = 'coupon' THEN
          INSERT INTO coupons (
            store_id, kakao_user_id, event_id, amount, source_type,
            requires_verification, status, issued_at, valid_until
          ) VALUES (
            p_store_id, p_kakao_user_id, NULL, v_mission.reward_value, 'mission_reward',
            true, 'pending_verify', now(),
            COALESCE(v_mission.end_at, now() + interval '30 days')
          );
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$;
