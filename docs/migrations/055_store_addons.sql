-- ============================================================
-- Migration 055: 매장 애드온(유료 부가기능) 게이팅 — store_addons
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 목적: "매장 홈페이지" 기능은 유료 옵션이므로, 슈퍼관리자가 결제를 확인한 뒤에만
--       광고주가 사용할 수 있게 게이팅한다.
--
-- 설계 결정:
--  1) subscriptions 테이블에 컬럼을 얹지 않는다 — subscriptions는 매장당 여러 row가
--     쌓이는 "갱신 이력" 테이블이라(033_subscriptions.sql), 플래그를 거기 두면 갱신할
--     때마다(새 row 생성) 값이 기본값(false)으로 리셋되는 문제가 생긴다.
--  2) business_entity(051_business_page.sql)에도 두지 않는다 — 그 테이블은 광고주가
--     "본인 판단"으로 직접 켜고 끄는 콘텐츠/설정 값(homepage_enabled 등)이고,
--     이번 플래그는 슈퍼관리자만 켤 수 있는 "결제 게이트"라 성격이 다르다.
--  3) 그래서 store_id 1:1의 별도 테이블(store_addons)로 분리한다 — 구독 갱신과
--     무관하게 값이 유지되고, 나중에 "이용기간 만료 시 자동 OFF" 연동을 붙일 때도
--     이 테이블에 만료 체크 로직만 얹으면 되도록 구조를 단순하게 잡아둔다
--     (이번 마이그레이션에서 만료 자동 연동까지는 구현하지 않음).
-- ============================================================

CREATE TABLE IF NOT EXISTS store_addons (
  store_id                      text        PRIMARY KEY,           -- store_contracts.store_id / business_entity.store_id와 동일
  homepage_feature_enabled      boolean     NOT NULL DEFAULT false, -- 매장 홈페이지 기능 사용 가능 여부 (슈퍼관리자 전용 토글)
  homepage_feature_enabled_at   timestamptz,                        -- 마지막으로 true로 전환된 시각 (노출용 기록)
  homepage_feature_enabled_by   uuid        REFERENCES store_accounts(id) ON DELETE SET NULL, -- 켠 슈퍼관리자/에이전시 계정
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE store_addons IS
  '매장별 유료 부가기능 게이팅 플래그. 구독(subscriptions) 갱신 이력과 별개로 store_id당 1행만 유지된다.';
COMMENT ON COLUMN store_addons.homepage_feature_enabled IS
  '매장 홈페이지(/admin/business-page, /b/{slug}) 기능 사용 가능 여부. false면 광고주 admin 메뉴/화면/API 전부 차단되고, 공개 페이지는 "준비중" 화면으로 대체된다.';

ALTER TABLE store_addons ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_addons TO service_role;

-- 확인용
SELECT * FROM store_addons LIMIT 5;
