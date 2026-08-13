-- ============================================================
-- Migration 026: message_log 확장 — 쿠폰 만료 알림 중복방지용
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE message_log
  ADD COLUMN IF NOT EXISTS coupon_id      text,         -- 대상 쿠폰 ID (expiry_reminder용)
  ADD COLUMN IF NOT EXISTS days_remaining integer;      -- D-7 / D-3 / D-1

COMMENT ON COLUMN message_log.coupon_id      IS 'expiry_reminder 단계 중복방지용 쿠폰 ID';
COMMENT ON COLUMN message_log.days_remaining IS 'D-7=7 / D-3=3 / D-1=1 (expiry_reminder 단계 구분)';

-- 중복 방지 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_message_log_coupon_stage
  ON message_log (coupon_id, days_remaining, message_type)
  WHERE coupon_id IS NOT NULL;
