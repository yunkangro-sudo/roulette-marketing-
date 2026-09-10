-- ============================================================
-- Migration 059: store_contracts.naver_review_url / google_review_url — 네이버·구글맵 후기쓰기 URL
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경: 손님용 화면(내 쿠폰함)에 기존 "당근 단골 추가하기"/"당근마켓 후기쓰기" 버튼과
--       나란히 "네이버 후기쓰기"/"구글 맵 후기쓰기" 버튼을 추가하기 위해 매장별 후기
--       링크를 저장한다. 각각 독립 컬럼이라 비어있으면 해당 버튼만 숨기고 나머지는
--       그대로 노출된다 (daangn_review_url과 동일한 패턴).
-- ============================================================

ALTER TABLE store_contracts
  ADD COLUMN IF NOT EXISTS naver_review_url text;

ALTER TABLE store_contracts
  ADD COLUMN IF NOT EXISTS google_review_url text;

COMMENT ON COLUMN store_contracts.naver_review_url IS
  '네이버 후기 작성 페이지(플레이스) URL. 비어 있으면 손님 화면에서 "네이버 후기쓰기" 버튼을 숨긴다';

COMMENT ON COLUMN store_contracts.google_review_url IS
  '구글 맵 후기 작성 페이지 URL. 비어 있으면 손님 화면에서 "구글 맵 후기쓰기" 버튼을 숨긴다';

-- ── activity_log: "네이버/구글 후기쓰기" 버튼 클릭 이벤트 타입 추가 ─────────
ALTER TABLE activity_log
  DROP CONSTRAINT IF EXISTS activity_log_event_type_check;

ALTER TABLE activity_log
  ADD CONSTRAINT activity_log_event_type_check
  CHECK (event_type IN (
    'game_start',
    'game_complete',
    'coupon_used',
    'reward_redeemed',
    'point_earned',
    'purchase',
    'visit_checkin',
    'kakao_login',
    'daangn_click',
    'daangn_review_click',
    'naver_review_click',   -- 신규: "네이버 후기쓰기" 버튼 클릭 (클릭 기준, 실제 후기 작성 확정 아님)
    'google_review_click'   -- 신규: "구글 맵 후기쓰기" 버튼 클릭 (클릭 기준, 실제 후기 작성 확정 아님)
  ));
