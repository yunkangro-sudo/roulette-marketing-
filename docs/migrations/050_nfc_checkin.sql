-- ============================================================
-- Migration 050: NFC 방문 적립 (포인트/스탬프 선택형)
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경: 매장에 NFC 태그를 놓고 손님이 폰을 태그하면 자동으로 방문 적립
--       (포인트 또는 스탬프)이 되는 기능. 게임/경품 시스템과는 완전히
--       분리된 별도 적립 경로 — 기존 리워드 교환(포인트 차감) 로직은
--       손대지 않는다. 손님 식별은 이 프로젝트 전체 규칙과 동일하게
--       kakao_user_id를 사용한다(전화번호 기준 아님).
-- ============================================================

-- ── 1. store_settings: NFC 체크인 설정 ──────────────────────
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS nfc_checkin_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nfc_checkin_mode    text    NOT NULL DEFAULT 'points',
  ADD COLUMN IF NOT EXISTS nfc_checkin_points  integer NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS stamp_goal_count    integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS stamp_reward_id     uuid    REFERENCES reward_catalog(id) ON DELETE SET NULL;

ALTER TABLE store_settings
  DROP CONSTRAINT IF EXISTS store_settings_nfc_checkin_mode_check;
ALTER TABLE store_settings
  ADD CONSTRAINT store_settings_nfc_checkin_mode_check
  CHECK (nfc_checkin_mode IN ('points', 'stamp'));

COMMENT ON COLUMN store_settings.nfc_checkin_enabled IS 'NFC 태그 방문 적립 기능 사용 여부 (기본 꺼짐)';
COMMENT ON COLUMN store_settings.nfc_checkin_mode    IS 'points=방문마다 포인트 적립, stamp=목표 횟수 채우면 리워드 발급';
COMMENT ON COLUMN store_settings.nfc_checkin_points  IS 'nfc_checkin_mode=points일 때, 1회 체크인당 적립 포인트';
COMMENT ON COLUMN store_settings.stamp_goal_count    IS 'nfc_checkin_mode=stamp일 때, 목표 방문(스탬프) 횟수';
COMMENT ON COLUMN store_settings.stamp_reward_id     IS 'nfc_checkin_mode=stamp일 때, 목표 달성 시 지급할 reward_catalog 항목';

-- ── 2. nfc_checkin_log: 체크인 기록 (하루 1회 제한의 핵심) ──────
-- checkin_date는 KST 기준 날짜를 호출부(TypeScript, toKstDateLabel)에서 계산해
-- 저장한다 — daily_participation_log와 동일한 패턴. timestamptz에 DATE()를 걸면
-- UTC 기준으로 끊겨 자정 근처에 타임존 버그가 생기므로 반드시 이 방식을 따른다.
CREATE TABLE IF NOT EXISTS nfc_checkin_log (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id       text        NOT NULL,
  kakao_user_id  text        NOT NULL,
  checked_in_at  timestamptz NOT NULL DEFAULT now(),
  checkin_date   date        NOT NULL,
  UNIQUE (store_id, kakao_user_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_nfc_checkin_log_store_user
  ON nfc_checkin_log(store_id, kakao_user_id);

-- ── 3. nfc_stamp_progress: 스탬프 진행 카운트 (stamp 모드 전용) ──
CREATE TABLE IF NOT EXISTS nfc_stamp_progress (
  store_id       text        NOT NULL,
  kakao_user_id  text        NOT NULL,
  current_count  integer     NOT NULL DEFAULT 0,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, kakao_user_id)
);

-- ── 4. coupons.source_type에 'stamp_reward' 추가 ──────────────
ALTER TABLE coupons
  DROP CONSTRAINT IF EXISTS coupons_source_type_check;
ALTER TABLE coupons
  ADD CONSTRAINT coupons_source_type_check
  CHECK (source_type IN ('game_win', 'manual', 'mission_reward', 'reward_redemption', 'stamp_reward'));

-- ── 5. RLS 활성화 (정책 없음 = service_role만 접근, 039번과 동일 패턴) ──
ALTER TABLE nfc_checkin_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_stamp_progress  ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON nfc_checkin_log    TO service_role;
GRANT SELECT, INSERT, UPDATE ON nfc_stamp_progress TO service_role;

-- ============================================================
-- RPC: process_nfc_checkin — 체크인 전체 흐름을 원자적으로 처리
--   1) NFC 사용 여부 확인
--   2) 하루 1회 제한 (오늘자 로그 있으면 중단)
--   3) 모드별 분기:
--      - points: customer_loyalty 포인트 적립 + point_ledger 기록
--        (upsert_customer_loyalty와 동일한 로직을 인라인으로 수행)
--      - stamp : nfc_stamp_progress +1 (원자적 upsert) →
--                목표 도달 시 reward_catalog 리워드로 coupon 발급
--                (source_type='stamp_reward') 후 카운트 0으로 리셋.
--                동시에 두 번 태그해도 이중 발급되지 않도록 진행카운트
--                증가와 목표판정·리셋을 한 함수 안에서 처리한다
--                (missions.process_mission_progress와 동일한 원자성 전략).
-- ============================================================
CREATE OR REPLACE FUNCTION process_nfc_checkin(
  p_store_id      text,
  p_kakao_user_id text,
  p_checkin_date  date
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_enabled      boolean;
  v_mode         text;
  v_points       integer;
  v_goal         integer;
  v_reward_id    uuid;
  v_new_count    integer;
  v_reward_found boolean := false;
  v_reward_name  text;
  v_reward_type  text;
  v_reward_stock integer;
  v_reward_discount integer;
  v_reward_requires_verification boolean;
  v_amount       integer := 0;
  v_status       text;
  v_coupon_id    uuid;
BEGIN
  SELECT nfc_checkin_enabled, nfc_checkin_mode, nfc_checkin_points, stamp_goal_count, stamp_reward_id
  INTO v_enabled, v_mode, v_points, v_goal, v_reward_id
  FROM store_settings
  WHERE store_id = p_store_id;

  IF NOT FOUND OR v_enabled IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'disabled');
  END IF;

  -- 하루 1회 제한: 유니크 제약을 이용해 원자적으로 판정
  BEGIN
    INSERT INTO nfc_checkin_log (store_id, kakao_user_id, checkin_date)
    VALUES (p_store_id, p_kakao_user_id, p_checkin_date);
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_checked_in');
  END;

  IF v_mode = 'stamp' THEN
    INSERT INTO nfc_stamp_progress (store_id, kakao_user_id, current_count, updated_at)
    VALUES (p_store_id, p_kakao_user_id, 1, now())
    ON CONFLICT (store_id, kakao_user_id)
    DO UPDATE SET current_count = nfc_stamp_progress.current_count + 1, updated_at = now()
    RETURNING current_count INTO v_new_count;

    IF v_new_count >= v_goal THEN
      IF v_reward_id IS NOT NULL THEN
        SELECT true, name, reward_type, stock, discount_amount, requires_verification
        INTO v_reward_found, v_reward_name, v_reward_type, v_reward_stock, v_reward_discount, v_reward_requires_verification
        FROM reward_catalog
        WHERE id = v_reward_id AND store_id = p_store_id AND active = true;
      END IF;

      IF v_reward_found THEN
        v_amount := CASE WHEN v_reward_type = 'discount' THEN COALESCE(v_reward_discount, 0) ELSE 0 END;
        v_status := CASE WHEN v_reward_requires_verification THEN 'pending_verify' ELSE 'pending_apply' END;

        INSERT INTO coupons (
          store_id, kakao_user_id, event_id, amount, label, source_type,
          reward_catalog_id, requires_verification, status, issued_at, valid_until
        ) VALUES (
          p_store_id, p_kakao_user_id, NULL, v_amount, v_reward_name, 'stamp_reward',
          v_reward_id, v_reward_requires_verification, v_status, now(), now() + interval '14 days'
        )
        RETURNING id INTO v_coupon_id;

        IF v_reward_stock IS NOT NULL THEN
          UPDATE reward_catalog SET stock = GREATEST(0, stock - 1) WHERE id = v_reward_id;
        END IF;
      END IF;

      -- 리워드 미설정이어도 다음 판을 시작할 수 있도록 카운트는 항상 리셋한다
      UPDATE nfc_stamp_progress SET current_count = 0, updated_at = now()
      WHERE store_id = p_store_id AND kakao_user_id = p_kakao_user_id;

      RETURN jsonb_build_object(
        'ok', true, 'mode', 'stamp', 'goal_reached', true,
        'stamp_goal', v_goal, 'coupon_id', v_coupon_id, 'reward_issued', v_reward_found
      );
    END IF;

    RETURN jsonb_build_object(
      'ok', true, 'mode', 'stamp', 'goal_reached', false,
      'stamp_count', v_new_count, 'stamp_goal', v_goal
    );
  ELSE
    INSERT INTO customer_loyalty (store_id, kakao_user_id, point_balance, visit_count, last_visit_at)
    VALUES (p_store_id, p_kakao_user_id, v_points, 1, now())
    ON CONFLICT (store_id, kakao_user_id) DO UPDATE
      SET point_balance = customer_loyalty.point_balance + v_points,
          visit_count   = customer_loyalty.visit_count + 1,
          last_visit_at = now();

    INSERT INTO point_ledger (store_id, kakao_user_id, type, amount)
    VALUES (p_store_id, p_kakao_user_id, 'earn', v_points);

    RETURN jsonb_build_object('ok', true, 'mode', 'points', 'points_awarded', v_points);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION process_nfc_checkin(text, text, date) TO service_role;
