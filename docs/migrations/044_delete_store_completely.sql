-- ============================================================
-- Migration 044: 업체 완전 삭제(Hard Delete) RPC
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 날짜: 2026-08-27
--
-- 배경:
--   슈퍼관리자가 테스트 업체나 계약이 완전히 끝난 업체를 DB에서 영구
--   삭제할 방법이 없었다(지금까지는 store_contracts row를 지워도 나머지
--   테이블에 store_id로 흩어진 데이터가 그대로 남는다 — 대부분의 테이블이
--   store_contracts에 대한 FK가 아니라 그냥 text 컬럼으로 store_id를 들고
--   있기 때문).
--
--   이 함수는 되돌릴 수 없다(hard delete, soft delete 아님). 호출 전에
--   반드시 관리자 화면에서 2차 확인(경고 문구 + 업체명 재입력)을 거친다
--   — app/api/admin/companies/[id]/route.ts DELETE 핸들러 참고.
--
-- 삭제 순서 원칙:
--   1) store_accounts(id)를 NOT NULL로 참조하는 이력 테이블
--      (tier_quantity_changes.changed_by, event_status_changes.changed_by)을
--      가장 먼저 지운다 — 나중에 store_accounts를 지울 때 FK 위반이 나지 않게.
--   2) reward_catalog(id)를 NOT NULL·RESTRICT로 참조하는 rewards_issued를
--      reward_catalog보다 먼저 지운다.
--   3) prize_tiers / tier_usage_counters는 event_id·prize_tier_id에 이미
--      ON DELETE CASCADE가 걸려있어 마지막에 events를 지우면 자동 정리된다.
--   4) 나머지 store_id 텍스트 컬럼 테이블은 순서 무관 — 전부 명시적으로 지운다.
--   5) 마지막에 store_settings, store_contracts 본체를 지운다.
-- ============================================================

CREATE OR REPLACE FUNCTION delete_store_completely(p_store_id text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_store_id IS NULL OR p_store_id = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'store_id가 없습니다');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM store_contracts WHERE store_id = p_store_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', '존재하지 않는 업체입니다');
  END IF;

  -- 1) store_accounts를 FK로 참조하는 이력 테이블 먼저 정리
  DELETE FROM tier_quantity_changes WHERE store_id = p_store_id;
  DELETE FROM event_status_changes  WHERE store_id = p_store_id;

  -- 2) 손님 활동/로그 테이블
  DELETE FROM payment_logs            WHERE store_id = p_store_id;
  DELETE FROM checkout_queue          WHERE store_id = p_store_id;
  DELETE FROM message_log             WHERE store_id = p_store_id;
  DELETE FROM message_consent         WHERE store_id = p_store_id;
  DELETE FROM activity_log            WHERE store_id = p_store_id;
  DELETE FROM churn_risk_alerts       WHERE store_id = p_store_id;
  DELETE FROM daily_participation_log WHERE store_id = p_store_id;

  -- 3) 미션
  DELETE FROM mission_progress WHERE store_id = p_store_id;
  DELETE FROM missions         WHERE store_id = p_store_id;

  -- 4) 포인트/리워드/쿠폰 (rewards_issued는 reward_catalog보다 먼저)
  DELETE FROM point_ledger     WHERE store_id = p_store_id;
  DELETE FROM rewards_issued   WHERE store_id = p_store_id;
  DELETE FROM coupons          WHERE store_id = p_store_id;
  DELETE FROM reward_catalog   WHERE store_id = p_store_id;
  DELETE FROM customer_loyalty WHERE store_id = p_store_id;
  DELETE FROM loyalty_settings WHERE store_id = p_store_id;

  -- 5) 구독/이용기간 이력
  DELETE FROM subscriptions WHERE store_id = p_store_id;

  -- 6) 이벤트 — prize_tiers/tier_usage_counters는 CASCADE로 자동 삭제됨
  DELETE FROM events WHERE store_id = p_store_id;

  -- 7) 대리접속 감사 로그
  DELETE FROM impersonation_log WHERE store_id = p_store_id;

  -- 8) 관리자 계정 (해당 매장의 advertiser/staff 계정만 — super_admin/agency는 store_id가 NULL이라 대상 아님)
  DELETE FROM store_accounts WHERE store_id = p_store_id;

  -- 9) 매장 설정 + 업체 본체
  DELETE FROM store_settings  WHERE store_id = p_store_id;
  DELETE FROM store_contracts WHERE store_id = p_store_id;

  RETURN jsonb_build_object('ok', true, 'store_id', p_store_id);
END;
$$;

GRANT EXECUTE ON FUNCTION delete_store_completely(text) TO service_role;
