-- ============================================================
-- Migration 034: 회원 관리 확장 — customer_loyalty 가입시점 컬럼 + activity_log 이벤트 타입 추가
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경: "회원(store_customers)" 개념을 새 테이블로 또 만들지 않고, 이미 있는
--       customer_loyalty(store_id+kakao_user_id 기준 visit_count/last_visit_at/
--       segment/phone_encrypted/phone_hash)에 부족한 두 컬럼만 추가한다.
--       "카카오 로그인", "당근 단골추가 클릭"도 새 테이블 대신 기존 activity_log의
--       event_type만 확장해서 기록한다 (Phase 2 분석 용도로 이미 설계된 범용 로그).
-- ============================================================

-- ── customer_loyalty: 최초 방문/최초 카카오 인증(=가입) 시점 ──────────
ALTER TABLE customer_loyalty
  ADD COLUMN IF NOT EXISTS first_seen_at        timestamptz,  -- 최초 게임 참여 시각
  ADD COLUMN IF NOT EXISTS kakao_first_login_at  timestamptz;  -- 최초 카카오 인증 완료 시각(nullable) = "가입" 기준

-- 기존 row는 first_seen_at을 last_visit_at으로 보정(정확한 최초방문일은 아니지만 NULL보다 낫다)
UPDATE customer_loyalty
SET first_seen_at = last_visit_at
WHERE first_seen_at IS NULL AND last_visit_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_kakao_first_login
  ON customer_loyalty(store_id, kakao_first_login_at);

-- upsert_customer_loyalty(012_points_system.sql)가 INSERT되는 시점(=최초 방문)에
-- first_seen_at을 함께 채우도록 갱신. 앱 코드도 이제 포인트 기능 OFF인 매장에서도
-- 방문 집계(visit_count/last_visit_at)를 위해 이 RPC를 항상(p_points=0 포함) 호출한다
-- (회원 관리 기능이 customer_loyalty 존재를 전제하므로).
CREATE OR REPLACE FUNCTION upsert_customer_loyalty(
  p_store_id      text,
  p_kakao_user_id text,
  p_points        integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO customer_loyalty (store_id, kakao_user_id, point_balance, visit_count, last_visit_at, first_seen_at)
  VALUES (p_store_id, p_kakao_user_id, p_points, 1, now(), now())
  ON CONFLICT (store_id, kakao_user_id) DO UPDATE
    SET point_balance = customer_loyalty.point_balance + p_points,
        visit_count   = customer_loyalty.visit_count + 1,
        last_visit_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_customer_loyalty TO service_role;

-- ── activity_log: kakao_login / daangn_click 이벤트 타입 추가 ─────────
ALTER TABLE activity_log
  DROP CONSTRAINT IF EXISTS activity_log_event_type_check;

ALTER TABLE activity_log
  ADD CONSTRAINT activity_log_event_type_check
  CHECK (event_type IN (
    'game_start',
    'game_complete',
    'coupon_used',
    'reward_redeemed',
    'point_earned',
    'purchase',
    'visit_checkin',
    'kakao_login',     -- 신규: 카카오 로그인 성공 (신규가입/재방문 로그인 모두 포함)
    'daangn_click'     -- 신규: "당근에서 단골 추가하기" 버튼 클릭 (클릭 기준, 실제 단골등록 확정 아님)
  ));
