-- ============================================================
-- Migration 060: signup_inquiries DELETE 권한 부여
-- 실행 위치: node scripts/apply-migration.mjs docs/migrations/060_signup_inquiries_delete_grant.sql
-- ============================================================
-- 031번에서 SELECT/INSERT/UPDATE만 GRANT 해서, 슈퍼관리자 문의 리스트의
-- 상태 변경(PATCH)은 되고 단건 삭제(DELETE)는 permission denied로 실패했다.

GRANT DELETE ON signup_inquiries TO service_role;
