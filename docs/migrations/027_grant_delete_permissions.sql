-- ============================================================
-- Migration 027: service_role DELETE 권한 추가 + 테스트 데이터 정리
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- Migration 012에서 DELETE 권한이 누락된 테이블에 추가
GRANT DELETE ON reward_catalog  TO service_role;
GRANT DELETE ON rewards_issued  TO service_role;

-- 테스트 데이터 정리
DELETE FROM rewards_issued
WHERE reward_catalog_id IN (
  SELECT id FROM reward_catalog
  WHERE store_id = 'chj-001'
    AND (name LIKE '[TEST%' OR name LIKE '[테스트%'
      OR name LIKE '[A]%' OR name LIKE '[B]%'
      OR name LIKE '[C]%' OR name LIKE '[D]%')
);

DELETE FROM reward_catalog
WHERE store_id = 'chj-001'
  AND (name LIKE '[TEST%' OR name LIKE '[테스트%'
    OR name LIKE '[A]%' OR name LIKE '[B]%'
    OR name LIKE '[C]%' OR name LIKE '[D]%');

-- 확인 쿼리
SELECT name FROM reward_catalog WHERE store_id = 'chj-001' ORDER BY name;
