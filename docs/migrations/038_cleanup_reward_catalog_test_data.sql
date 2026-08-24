-- ============================================================
-- Migration 038 (일회성 정리 스크립트): 리워드 카탈로그 테스트 더미데이터 삭제
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경: scripts/cleanup-reward-catalog.cjs와 동일한 작업을, 이 작업 환경에는
-- DATABASE_URL(직접 Postgres 접속 정보)이 없어 에이전트가 대신 실행할 수 없다.
-- 아래 SQL을 그대로 Supabase SQL Editor에 붙여넣고 실행하면 된다.
--
-- 대상: chj-001 매장의 [TEST-A]~[TEST-D], [테스트] 확인필수 리워드 등
-- 이름이 [TEST, [테스트, [A], [B], [C], [D]로 시작하는 항목.
-- 운영 전환 직전 1회만 실행하면 된다. (이미 정리되어 대상이 없으면 0건 삭제되고 끝난다)
-- ============================================================

DO $$
DECLARE
  v_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO v_ids
  FROM reward_catalog
  WHERE store_id = 'chj-001'
    AND (
      name LIKE '[TEST%' OR name LIKE '[테스트%'
      OR name LIKE '[A]%' OR name LIKE '[B]%'
      OR name LIKE '[C]%' OR name LIKE '[D]%'
    );

  IF v_ids IS NOT NULL THEN
    DELETE FROM rewards_issued WHERE reward_catalog_id = ANY(v_ids);
    DELETE FROM reward_catalog WHERE id = ANY(v_ids);
    RAISE NOTICE '삭제된 리워드 카탈로그 항목 수: %', array_length(v_ids, 1);
  ELSE
    RAISE NOTICE '삭제 대상 없음 (이미 정리됨)';
  END IF;
END $$;

-- 확인용: 삭제 후 chj-001에 남은 리워드 목록
SELECT id, name, active, reward_type FROM reward_catalog
WHERE store_id = 'chj-001'
ORDER BY name;
