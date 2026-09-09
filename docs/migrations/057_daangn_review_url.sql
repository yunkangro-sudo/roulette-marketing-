-- ============================================================
-- Migration 057: store_contracts.daangn_review_url — 당근마켓 후기쓰기 URL
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경: 손님용 화면(내 쿠폰함)에 기존 "당근 단골 추가하기" 버튼과 나란히
--       "당근마켓 후기쓰기" 버튼을 추가하기 위해 매장별 후기 링크를 저장한다.
--       daangn_url(단골 추가용)과 별개 컬럼으로 둔다 — 매장에 따라 두 링크가
--       다를 수 있고, 비어있으면 손님 화면에서 후기쓰기 버튼만 숨기고
--       단골추가 버튼은 그대로(풀와이드로) 노출해야 하기 때문.
-- ============================================================

ALTER TABLE store_contracts
  ADD COLUMN IF NOT EXISTS daangn_review_url text;

COMMENT ON COLUMN store_contracts.daangn_review_url IS
  '당근마켓 후기 작성 페이지(비즈프로필) URL. 비어 있으면 손님 화면에서 "당근마켓 후기쓰기" 버튼을 숨긴다';

-- ── activity_log: "당근마켓 후기쓰기" 버튼 클릭 이벤트 타입 추가 ─────────
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
    'daangn_review_click'   -- 신규: "당근마켓 후기쓰기" 버튼 클릭 (클릭 기준, 실제 후기 작성 확정 아님)
  ));
