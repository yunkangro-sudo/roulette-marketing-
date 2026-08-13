-- ============================================================
-- Migration 019: activity_log — 행동 이력 테이블
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 용도: 현재는 기록만. 이후 Phase 2(코호트 리텐션, 재방문주기 분석)에서
--       이 데이터를 기반으로 세그먼트 계산, Win-back 트리거 등에 활용 예정.
--       (v2.1 문서 8-2단계)
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id       text        NOT NULL,
  kakao_user_id  text        NOT NULL,

  event_type     text        NOT NULL,
  -- game_start      : 게임 시작 (play API 진입 시점)
  -- game_complete   : 게임 결과 확정 (당첨/꽝 모두)
  -- coupon_used     : 쿠폰 사용 처리 (/staff)
  -- reward_redeemed : 리워드 사용 처리 (/staff)
  -- point_earned    : 포인트 적립
  -- purchase        : 구매 (온라인 확장 대비, 로직 미구현)
  -- visit_checkin   : 방문 체크인 (온라인 확장 대비, 로직 미구현)

  ref_id         text,       -- 연관 ID (nullable)
  ref_type       text,       -- 연관 테이블 유형: 'game'|'coupon'|'reward'|'point_ledger'

  occurred_at    timestamptz NOT NULL DEFAULT now()
);

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
    'visit_checkin'
  ));

-- 조회 인덱스 (Phase 2 분석용)
CREATE INDEX IF NOT EXISTS idx_activity_log_user
  ON activity_log(store_id, kakao_user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_event
  ON activity_log(store_id, event_type, occurred_at DESC);

GRANT SELECT, INSERT ON activity_log TO service_role;
