-- ============================================================
-- Migration 030: 매장 당근/카카오채널 URL
-- ============================================================

ALTER TABLE store_contracts
  ADD COLUMN IF NOT EXISTS daangn_url text,
  ADD COLUMN IF NOT EXISTS kakao_channel_url text;

COMMENT ON COLUMN store_contracts.daangn_url IS
  '당근마켓 비즈프로필/단골 추가 딥링크. 비어 있으면 손님 화면에서 버튼을 숨긴다';
COMMENT ON COLUMN store_contracts.kakao_channel_url IS
  '카카오 채널 URL. 비어 있으면 채널 추가 버튼을 숨기고 건너뛰기만 노출';

UPDATE store_contracts
SET
  daangn_url = COALESCE(daangn_url, 'https://www.daangn.com/kr/local-profile/y6ixoqfzj4tw/?referrer=share'),
  kakao_channel_url = COALESCE(kakao_channel_url, 'https://pf.kakao.com/_xcuxobX')
WHERE store_id = 'test-store-001';
