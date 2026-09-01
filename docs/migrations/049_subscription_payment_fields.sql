-- ============================================================
-- Migration 049: subscriptions 결제 확인 워크플로우 컬럼 추가
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경: 구독료를 수동(계좌이체 등)으로 받고 있어, 어느 업체가 언제 얼마를
--       냈는지 관리하고 회계 처리를 위해 엑셀로 뽑을 수 있어야 한다.
--       payment_date(실제 입금 확인일)는 start_date(이용 시작일)와 다를 수
--       있다 (예: 이용은 8/1부터인데 입금은 7/28에 미리 받은 경우).
-- ============================================================

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_date   date,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_payment_status_check;
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_payment_status_check
  CHECK (payment_status IN ('paid', 'unpaid', 'overdue'));

COMMENT ON COLUMN subscriptions.payment_date   IS '실제 입금을 확인한 날짜 (start_date와 다를 수 있음, 미확인이면 null)';
COMMENT ON COLUMN subscriptions.payment_status IS '입금 확인 상태. paid=입금확인, unpaid=미입금(기본값), overdue=연체';

-- 기존 row(과거 이력)는 이미 서비스 중이었다는 뜻이므로 입금확인 완료로 간주하고,
-- payment_date는 start_date로 보정(정확한 입금일은 아니지만 null보다 낫다)
UPDATE subscriptions
SET payment_status = 'paid', payment_date = start_date
WHERE payment_status = 'unpaid' AND created_at < now() - interval '1 day';

CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_status
  ON subscriptions(payment_status);
