-- ============================================================
-- Migration 029: 매장별 포인트 적립 온/오프
-- ============================================================

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS points_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN store_settings.points_enabled IS
  'false면 게임 완료 시 포인트 적립 로직을 건너뛴다';
