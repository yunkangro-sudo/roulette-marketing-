-- ============================================================
-- Migration 014: 수동 쿠폰 발급 지원
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- coupons.source_type CHECK 제약 조건을 game_win + manual 모두 허용하도록 변경
ALTER TABLE coupons
  DROP CONSTRAINT IF EXISTS coupons_source_type_check;

ALTER TABLE coupons
  ADD CONSTRAINT coupons_source_type_check
  CHECK (source_type IN ('game_win', 'manual'));

-- coupons.kakao_user_id를 nullable로 변경 (수동 발급 시 손님 정보 없을 수 있음)
ALTER TABLE coupons
  ALTER COLUMN kakao_user_id DROP NOT NULL;

-- coupons.event_id를 nullable로 변경 (수동 발급 시 이벤트 없음)
ALTER TABLE coupons
  ALTER COLUMN event_id DROP NOT NULL;

-- service_role 권한 확인
GRANT INSERT, SELECT ON coupons TO service_role;
