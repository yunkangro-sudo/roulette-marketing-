-- ============================================================
-- Migration 036: impersonation_log (슈퍼관리자 대리접속 감사 로그)
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경: 슈퍼관리자/에이전시가 "이 업체로 관리 진입"해서 광고주 화면을 대신
--       조작할 수 있게 되면서, 언제/누가/어느 매장을 대리접속했는지 추적할
--       감사 로그가 필요하다. 대리접속 시작 시 row를 만들고, "나가기" 또는
--       로그아웃 시 ended_at을 채운다.
-- ============================================================

CREATE TABLE IF NOT EXISTS impersonation_log (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  super_admin_id uuid        NOT NULL REFERENCES store_accounts(id),
  store_id       text        NOT NULL,
  started_at     timestamptz NOT NULL DEFAULT now(),
  ended_at       timestamptz
);

ALTER TABLE impersonation_log DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON impersonation_log TO service_role;

-- "이 매장의 대리접속 이력" 조회 최적화
CREATE INDEX IF NOT EXISTS idx_impersonation_log_store
  ON impersonation_log(store_id, started_at DESC);

-- "이 슈퍼관리자가 지금 대리접속 중인가" 조회 최적화 (진행중인 row만)
CREATE INDEX IF NOT EXISTS idx_impersonation_log_active
  ON impersonation_log(super_admin_id) WHERE ended_at IS NULL;
