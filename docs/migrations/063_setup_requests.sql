-- ============================================================
-- Migration 063: 세팅 접수
-- 영업사원·광고주가 적은 게임·리워드 접수를 슈퍼관리자가 본다.
-- 실행: node scripts/apply-migration.mjs docs/migrations/063_setup_requests.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS setup_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name          text NOT NULL,
  phone               text NOT NULL,
  salesperson_name    text NOT NULL,
  products            text[] NOT NULL,
  hq_call             boolean NOT NULL DEFAULT false,
  prizes              jsonb NOT NULL DEFAULT '[]'::jsonb,
  rewards             jsonb NOT NULL DEFAULT '[]'::jsonb,
  daangn_url          text,
  naver_review_url    text,
  google_review_url   text,
  naver_place_url     text,
  intro               text,
  business_hours      text,
  open_date           date,
  photo_via_kakao     boolean NOT NULL DEFAULT false,
  memo                text,
  status              text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'setting', 'done')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT setup_requests_products_known CHECK (
    cardinality(products) > 0
    AND products <@ ARRAY['dangolting', 'danggeun', 'aeo']::text[]
  )
);

COMMENT ON TABLE setup_requests IS '세팅 접수. 본사가 게임·리워드·홈페이지를 대신 넣을 때 보는 원본';
COMMENT ON COLUMN setup_requests.products IS 'dangolting=단골팅 / danggeun=당근마케팅 / aeo=AEO마케팅';
COMMENT ON COLUMN setup_requests.status IS 'received=접수 / setting=세팅중 / done=완료';
COMMENT ON COLUMN setup_requests.prizes IS '[{content, monthlyQty}] 게임에서 바로 주는 경품';
COMMENT ON COLUMN setup_requests.rewards IS '[{name, visits, monthlyQty}] 방문 횟수로 받는 리워드. 포인트는 방문 1회=100';

ALTER TABLE setup_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON setup_requests TO service_role;

CREATE INDEX IF NOT EXISTS setup_requests_created_at_idx ON setup_requests (created_at DESC);
