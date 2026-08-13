-- ============================================================
-- Migration 024: reward_catalog 확장 (8-6단계)
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- reward_type enum
DO $$ BEGIN
  CREATE TYPE reward_type_enum AS ENUM (
    'free_item',
    'discount',
    'points',
    'experience',
    'special_coupon',
    'vip_reward'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE reward_catalog
  ADD COLUMN IF NOT EXISTS reward_type  reward_type_enum NOT NULL DEFAULT 'free_item',
  ADD COLUMN IF NOT EXISTS start_at     timestamptz,
  ADD COLUMN IF NOT EXISTS end_at       timestamptz,
  ADD COLUMN IF NOT EXISTS image_url    text,
  ADD COLUMN IF NOT EXISTS tier_required text;   -- 등급 시스템 예약, 현재 미사용

COMMENT ON COLUMN reward_catalog.reward_type      IS '리워드 유형 (free_item/discount/points/experience/special_coupon/vip_reward)';
COMMENT ON COLUMN reward_catalog.start_at         IS '기간한정 리워드 노출 시작일 (null=상시)';
COMMENT ON COLUMN reward_catalog.end_at           IS '기간한정 리워드 노출 종료일 (null=상시)';
COMMENT ON COLUMN reward_catalog.image_url        IS '리워드 이미지 URL (null=기본 아이콘)';
COMMENT ON COLUMN reward_catalog.tier_required    IS '등급 시스템 예약 컬럼 (현재 미사용)';
