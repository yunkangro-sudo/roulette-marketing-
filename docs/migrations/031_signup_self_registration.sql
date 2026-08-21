-- ============================================================
-- Migration 031: 회원가입 페이지 실사용 계정 전환 지원
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1) Migration 025에서 signup_inquiries에 service_role GRANT가 빠져있었음.
--    (다른 모든 테이블은 GRANT가 있는데 이 테이블만 없어서, 서버가
--     service_role 키로 INSERT할 때 permission denied로 조용히 실패 →
--     /signup 페이지에서 "저장에 실패했습니다" 에러의 원인)
GRANT SELECT, INSERT, UPDATE ON signup_inquiries TO service_role;

-- 2) /signup 페이지에서 선택한 업종을 업체 정보에도 남기기 위한 컬럼
ALTER TABLE store_contracts
  ADD COLUMN IF NOT EXISTS business_type text;

COMMENT ON COLUMN store_contracts.business_type IS
  '업종 (예: 카페·베이커리). 회원가입 페이지 또는 관리자가 직접 입력';
