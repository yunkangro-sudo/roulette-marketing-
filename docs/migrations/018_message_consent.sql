-- ============================================================
-- Migration 018: 메시지 발송 동의/빈도 규칙
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. message_consent 테이블 ────────────────────────────────
-- 카카오 채널 친구추가 완료 = 동의(consented=true)
CREATE TABLE IF NOT EXISTS message_consent (
  store_id       text        NOT NULL,
  kakao_user_id  text        NOT NULL,
  consented      boolean     NOT NULL DEFAULT false,
  consented_at   timestamptz,          -- 동의 시점 (법적 증거용)
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, kakao_user_id)
);

GRANT SELECT, INSERT, UPDATE ON message_consent TO service_role;

-- ── 2. message_log: message_type CHECK 제약 추가 ─────────────
-- (017에서 이미 생성된 테이블 — CHECK 제약만 추가)
ALTER TABLE message_log
  DROP CONSTRAINT IF EXISTS message_log_message_type_check;

ALTER TABLE message_log
  ADD CONSTRAINT message_log_message_type_check
  CHECK (message_type IN (
    'coupon_issued',
    'expiry_reminder',
    'winback_interested',
    'winback_at_risk',
    'winback_dormant',
    'mission_complete'
  ));

-- message_log에 sent_at 컬럼 추가 (발송 성공 시점 별도 기록)
ALTER TABLE message_log
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;

-- ── 3. 발송 체크용 인덱스 ────────────────────────────────────
-- 하루 1회 / 7일 3회 체크를 빠르게
CREATE INDEX IF NOT EXISTS idx_message_log_daily_check
  ON message_log(store_id, kakao_user_id, created_at DESC)
  WHERE status NOT IN ('skipped', 'failed');

CREATE INDEX IF NOT EXISTS idx_message_log_type_check
  ON message_log(store_id, kakao_user_id, message_type, created_at DESC)
  WHERE status NOT IN ('skipped', 'failed');
