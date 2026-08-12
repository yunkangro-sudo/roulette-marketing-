-- ============================================================
-- Migration 017: 전화번호 암호화 저장 + 알림톡 발송 로그
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── customer_loyalty: 전화번호 컬럼 추가 ─────────────────────
ALTER TABLE customer_loyalty
  ADD COLUMN IF NOT EXISTS phone_encrypted text,  -- AES-256-CBC 암호화된 전화번호
  ADD COLUMN IF NOT EXISTS phone_hash      text;  -- HMAC-SHA256 해시 (중복체크/검색용, 복호화 불가)

-- 해시 인덱스 (동일인 조회용)
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_phone_hash
  ON customer_loyalty(phone_hash) WHERE phone_hash IS NOT NULL;

-- ── message_log: 알림톡 발송 기록 ────────────────────────────
CREATE TABLE IF NOT EXISTS message_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id       text NOT NULL,
  kakao_user_id  text NOT NULL,
  message_type   text NOT NULL,  -- 'coupon_issued' | 'reward_issued' | 'points_earned'
  payload        jsonb,          -- 발송 내용 스냅샷 (쿠폰코드, 금액 등)
  status         text NOT NULL DEFAULT 'pending',
  -- 'pending' | 'sent' | 'failed' | 'skipped'
  -- pending: 발송 대기 (현재 대행사 미연결)
  -- sent: 실제 발송 성공 (대행사 연결 후)
  -- failed: 발송 실패
  -- skipped: 발송 조건 미충족 (빈도 제한, 미동의 등)
  error_message  text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_message_log_store_user
  ON message_log(store_id, kakao_user_id);
CREATE INDEX IF NOT EXISTS idx_message_log_created_at
  ON message_log(created_at DESC);

-- GRANT
GRANT SELECT, INSERT ON message_log TO service_role;
GRANT SELECT, UPDATE ON customer_loyalty TO service_role;
