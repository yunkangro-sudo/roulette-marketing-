-- ============================================================
-- Migration 046: signup_inquiries에 source 컬럼 추가
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경: 랜딩페이지 요금제 섹션의 "베이직 신청" 폼도 기존 /api/signup-inquiry
--       (signup_inquiries 테이블)를 그대로 재사용한다. 어느 폼/도입 경로에서
--       들어온 리드인지 구분할 수 있도록 source 컬럼만 추가한다.
--       (신규 폼: source = 'landing_v5_pricing_basic')
-- ============================================================

ALTER TABLE signup_inquiries
  ADD COLUMN IF NOT EXISTS source text;

COMMENT ON COLUMN signup_inquiries.source IS
  '리드 유입 경로 (예: landing_v5_pricing_basic). 기존 데이터는 NULL = 출처 미상/구버전 폼';
