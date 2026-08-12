-- ============================================================
-- Migration 010: 업체 계약 정보 테이블
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS store_contracts (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id            text        NOT NULL UNIQUE,          -- events.store_id 와 동일 형식 (예: test-store-001)
  store_name          text        NOT NULL,                 -- 업체명 (표시용)
  contract_start_date date        NOT NULL,
  contract_end_date   date        NOT NULL,
  ad_amount           integer     NOT NULL DEFAULT 0,       -- 월 광고금액 (원)
  contractor_name     text        NOT NULL DEFAULT '',      -- 계약자 이름
  manager_name        text        NOT NULL DEFAULT '',      -- 담당자 이름
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE store_contracts DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON store_contracts TO service_role;

CREATE INDEX IF NOT EXISTS idx_sc_store_id          ON store_contracts(store_id);
CREATE INDEX IF NOT EXISTS idx_sc_contract_end_date ON store_contracts(contract_end_date);

-- 테스트 데이터
INSERT INTO store_contracts (store_id, store_name, contract_start_date, contract_end_date, ad_amount, contractor_name, manager_name)
VALUES ('test-store-001', '당골마켓 테스트점', '2026-07-01', '2026-09-30', 300000, '김사장', '이담당')
ON CONFLICT (store_id) DO NOTHING;
