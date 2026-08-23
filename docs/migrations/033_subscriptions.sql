-- ============================================================
-- Migration 033: subscriptions (이용기간/결제 이력) 테이블 추가
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경: store_contracts.contract_start_date/end_date는 매장당 "현재 값" 하나만
--       덮어쓰는 구조라 갱신 이력이 남지 않는다. 갱신할 때마다 새 row를 쌓아
--       이력을 남기고, "현재 유효한 구독"은 end_date가 가장 최근인 row로 판단한다.
--       이후 이 테이블이 "이용기간"의 단일 진실 원천이 된다
--       (store_contracts.contract_start_date/end_date는 점진적으로 대체 예정).
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id     text        NOT NULL,
  plan_name    text        NOT NULL,          -- 예: Basic/Standard/Premium
  amount_paid  integer     NOT NULL DEFAULT 0,
  start_date   date        NOT NULL,
  end_date     date        NOT NULL,
  memo         text,
  created_by   uuid        REFERENCES store_accounts(id) ON DELETE SET NULL,  -- 처리한 슈퍼관리자
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON subscriptions TO service_role;

-- "매장별 최신 구독 조회" 패턴 최적화 (store_id 고정 + end_date 내림차순 1건)
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_end_date
  ON subscriptions(store_id, end_date DESC);

-- 기존 store_contracts 계약기간을 초기 subscriptions row로 이전
-- (subscriptions가 비어있는 매장이 없도록 — 단, row가 없어도 접근은 막지 않음/무제한 체험 처리)
INSERT INTO subscriptions (store_id, plan_name, amount_paid, start_date, end_date, memo, created_at)
SELECT store_id, 'Basic', ad_amount, contract_start_date, contract_end_date,
       '초기 데이터 이전 (migration 033)', now()
FROM store_contracts
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.store_id = store_contracts.store_id
);
