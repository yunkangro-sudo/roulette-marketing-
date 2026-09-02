-- ============================================================
-- Migration 052: 매장 공개 홈페이지 확장 (업종별 라벨, 대표상품, 매장정보 보강)
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 051에서 만든 business_entity/business_media/business_faq/business_external_links를
-- 그대로 두고 확장한다. GPT 지시문 검토 결과 아래 항목만 반영:
--  - business_type + 업종별 라벨 매핑(코드 쪽 lib/business-page/businessTypeLabels.ts) — "⑤ 대표
--    상품/메뉴/서비스" 섹션 이름과 관리자 입력폼 라벨을 업종에 맞게 바꿔줌
--  - business_products (대표 상품/메뉴/서비스, 3~6개 — 개수 제한은 앱 레벨에서 검증)
--  - parking_info(주차정보), pet_friendly(반려동물 동반), store_pride_points(매장 자랑 포인트)
--
-- 반영하지 않은 것(사장님 확인 완료):
--  - online_play_enabled 기본값/소유권 변경 — 기존 결정(기본 false, 매장관리자 직접 토글) 유지
--  - slug/id 별도 컬럼 — store_id를 그대로 slug로 재사용하는 기존 구조 유지
--  - "매장 소식"(당근 자동발행 재사용) 섹션 — 원본 기능 자체가 없어서 이번 작업 범위 제외 (v2 로드맵 기록)
-- ============================================================

ALTER TABLE business_entity
  ADD COLUMN IF NOT EXISTS business_type text NOT NULL DEFAULT 'service',
  ADD COLUMN IF NOT EXISTS parking_info text,
  ADD COLUMN IF NOT EXISTS pet_friendly boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS store_pride_points text[] NOT NULL DEFAULT '{}';

ALTER TABLE business_entity
  DROP CONSTRAINT IF EXISTS business_entity_business_type_check;

ALTER TABLE business_entity
  ADD CONSTRAINT business_entity_business_type_check
  CHECK (business_type IN ('restaurant', 'cafe', 'salon', 'gym', 'academy', 'service'));

COMMENT ON COLUMN business_entity.business_type IS
  '업종 — "⑤ 대표 상품/메뉴/서비스" 섹션명과 관리자 입력폼 라벨을 결정. 매핑은 lib/business-page/businessTypeLabels.ts에서 관리(코드 수정 없이 매핑만 추가하면 업종 확장 가능)';
COMMENT ON COLUMN business_entity.store_pride_points IS
  '"⑨ 우리 매장의 자랑" 자유 입력 카드 문구 배열 (3~4개 권장, 개수 제한은 앱 레벨 검증)';

CREATE TABLE IF NOT EXISTS business_products (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id    text        NOT NULL REFERENCES business_entity(store_id) ON DELETE CASCADE,
  name        text        NOT NULL,
  image_url   text,
  price       integer,
  description text,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE business_products IS
  '"⑤ 대표 상품/메뉴/서비스" — 3~6개 제한은 앱 레벨(app/api/admin/business-page/route.ts)에서 검증 (DB 트리거 대신 API 검증 — 이 프로젝트의 기존 관례, 예: prize_tiers 검증 방식과 동일)';

CREATE INDEX IF NOT EXISTS idx_business_products_store ON business_products(store_id, sort_order);

ALTER TABLE business_products ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_products TO service_role;

-- 확인용
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'business_entity';
