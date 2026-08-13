-- ============================================================
-- Migration 023: reward_catalog.requires_verification 추가
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE reward_catalog
  ADD COLUMN IF NOT EXISTS requires_verification boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN reward_catalog.requires_verification IS
  '계산대에서 손님 본인 확인 절차를 거쳐야 지급 가능한 리워드 여부. 
   고가 리워드(예: 10,000P 이상)에 권장. /staff 화면에서 [확인함]/[미확인 처리] 버튼으로 처리.';
