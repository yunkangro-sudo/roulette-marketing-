-- ============================================================
-- Migration 053: 샘플(데모) 매장 격리 장치
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 목적: 영업 시연용으로 만드는 가짜 매장 10곳이 실제 서비스 집계
-- (슈퍼관리자 대시보드, 업체 리스트 등)에 절대 섞이지 않도록 표시하는 플래그.
-- 매장 마스터 테이블은 "stores"가 아니라 store_contracts이므로 여기에 추가한다.
-- ============================================================

ALTER TABLE store_contracts
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN store_contracts.is_demo IS
  '영업 시연용 샘플 매장 여부. true인 매장은 슈퍼관리자 전체 집계(대시보드)와 sitemap에서
   제외되고, 업체 리스트 기본(전체) 탭에서도 숨겨지며 "샘플" 탭에서만 노출된다.
   알림톡/카카오 메시지 발송 함수 진입부에서도 이 값을 확인해 조기 차단한다.';

CREATE INDEX IF NOT EXISTS idx_store_contracts_is_demo ON store_contracts(is_demo);
