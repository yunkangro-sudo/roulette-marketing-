-- 세팅 접수에 매장 주소와 영업담당자 연락처를 추가한다.
-- 실행: node scripts/apply-migration.mjs docs/migrations/064_setup_requests_address_phone.sql

ALTER TABLE setup_requests ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE setup_requests ADD COLUMN IF NOT EXISTS salesperson_phone text;
