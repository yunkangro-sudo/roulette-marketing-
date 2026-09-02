-- ============================================================
-- Migration 051: 매장 공개 홈페이지 (Business Page, /b/{storeId})
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 목적: 홈페이지 없는 매장에 정식 소개 페이지를 만들어주는 동시에, 이 페이지
--       자체를 신규 손님 유입 채널로 쓴다 (온라인에서 게임 참여 → 당첨 쿠폰
--       쓰러 첫 방문).
--
-- 설계 결정 (사장님 확인 완료):
--  1) slug 컬럼 없음 — store_id가 이미 /play/{storeId}에서 사람이 읽는 슬러그로
--     쓰이고 있어서, business_entity도 store_id를 그대로 slug로 재사용한다.
--  2) address/phone 컬럼 없음 — store_contracts.address/phone/website가 이미
--     있고 /admin/company에서 광고주가 수정하므로 중복 저장하지 않는다.
--  3) 무료/유료 구분은 DB 스키마에 없음 — 모든 매장에 기본으로 공개되고
--     (homepage_enabled 기본 true), "유료"는 운영팀이 대신 입력해주는
--     서비스 차이일 뿐 기능 게이팅이 아니다.
--  4) online_play_enabled는 기본 false — 매장 방문 없이 리워드 재고가
--     소모되는 걸 사장님이 명시적으로 켜야만 허용하도록 안전하게 설계.
-- ============================================================

-- 1. business_entity — 매장 홈페이지 본체 (store_id 1:1)
CREATE TABLE IF NOT EXISTS business_entity (
  store_id            text        PRIMARY KEY,          -- store_contracts.store_id와 동일, 그대로 /b/{store_id} slug로 사용
  homepage_enabled     boolean     NOT NULL DEFAULT true,  -- 끄면 "준비중" 화면
  online_play_enabled  boolean     NOT NULL DEFAULT false, -- 끄면 히어로에서 게임 버튼 숨김 + 안내문구로 대체
  show_trust_metrics   boolean     NOT NULL DEFAULT true,  -- 신뢰지표(참여자수/재방문율) 노출 여부
  category             text,                                -- 업종 (예: "분식", "카페")
  description          text,                                -- 소개 한 줄~짧은 문단
  business_hours        text,                                -- 자유 텍스트 (예: "매일 11:00~21:00, 일요일 휴무")
  naver_review_url      text,
  google_review_url     text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE business_entity IS
  '매장 공개 홈페이지(/b/{store_id}) 설정 및 콘텐츠. store_id를 slug로 그대로 사용 — 별도 slug 컬럼 없음.';

-- 2. business_media — 사진 (로고/커버/매장 내부 등)
CREATE TABLE IF NOT EXISTS business_media (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id    text        NOT NULL REFERENCES business_entity(store_id) ON DELETE CASCADE,
  media_type  text        NOT NULL CHECK (media_type IN ('LOGO', 'COVER', 'STORE')),
  url         text        NOT NULL,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_media_store ON business_media(store_id, media_type, sort_order);

-- 3. business_faq — 광고주 직접 입력 (AI 자동생성 없음)
CREATE TABLE IF NOT EXISTS business_faq (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id    text        NOT NULL REFERENCES business_entity(store_id) ON DELETE CASCADE,
  question    text        NOT NULL,
  answer      text        NOT NULL,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_faq_store ON business_faq(store_id, sort_order);

-- 4. business_external_links — 인스타/당근 등 (당근/카카오는 이미 store_contracts에
--    daangn_url/kakao_channel_url이 있으므로, 여기는 그 외 링크(인스타그램 등)만 담는다)
CREATE TABLE IF NOT EXISTS business_external_links (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id    text        NOT NULL REFERENCES business_entity(store_id) ON DELETE CASCADE,
  platform    text        NOT NULL,   -- 'instagram' | 'blog' | 'other' 등 자유 텍스트
  url         text        NOT NULL,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_external_links_store ON business_external_links(store_id, sort_order);

-- 5. activity_log.entry_source — 통계 집계용 컬럼 (보안 경계 아님, 경품 확률/재고
--    분기에 절대 쓰지 않는다 — URL 파라미터라 조작 가능해서 신뢰 못 함)
ALTER TABLE activity_log
  ADD COLUMN IF NOT EXISTS entry_source text NOT NULL DEFAULT 'qr_instore';

ALTER TABLE activity_log
  DROP CONSTRAINT IF EXISTS activity_log_entry_source_check;

ALTER TABLE activity_log
  ADD CONSTRAINT activity_log_entry_source_check
  CHECK (entry_source IN ('qr_instore', 'online_page'));

COMMENT ON COLUMN activity_log.entry_source IS
  '게임 진입 경로 (통계 집계용). qr_instore=매장 QR/NFC, online_page=매장 홈페이지(/b/{slug})에서 원격 참여. URL 파라미터 기반이라 조작 가능하므로 경품 확률/재고 분기 로직에는 절대 사용하지 않는다.';

-- 6. RLS + 권한 (기존 원칙대로 service_role만 허용, RLS는 켜두고 정책 없음 = 전체 차단)
ALTER TABLE business_entity           ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_media            ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_faq              ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_external_links   ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_entity          TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_media           TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_faq             TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_external_links  TO service_role;

-- 확인용
SELECT * FROM business_entity LIMIT 5;
