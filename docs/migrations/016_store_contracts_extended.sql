-- ============================================================
-- Migration 016: store_contracts 확장 컬럼 추가
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE store_contracts
  ADD COLUMN IF NOT EXISTS phone    text,          -- 계약자 휴대폰 번호
  ADD COLUMN IF NOT EXISTS website  text,          -- 홈페이지 URL
  ADD COLUMN IF NOT EXISTS address  text,          -- 매장 주소
  ADD COLUMN IF NOT EXISTS remarks  text;          -- 비고 (내부 참고용 자유 텍스트)

GRANT SELECT, UPDATE ON store_contracts TO service_role;
