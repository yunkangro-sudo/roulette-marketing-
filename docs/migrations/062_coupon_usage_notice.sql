-- ============================================================
-- Migration 062: events.coupon_usage_notice
-- 실행 위치: node scripts/apply-migration.mjs docs/migrations/062_coupon_usage_notice.sql
-- ============================================================
-- 관리자가 이벤트 수정 화면의 "쿠폰 사용 기간" 아래에 적은 안내문구를
-- 손님 쿠폰함의 "리워드 교환" 바로 위에 보여준다.
-- 비어 있으면 손님 화면에 줄을 그리지 않는다.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS coupon_usage_notice text;

NOTIFY pgrst, 'reload schema';
