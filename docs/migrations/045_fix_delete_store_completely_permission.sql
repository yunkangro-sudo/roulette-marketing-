-- ============================================================
-- Migration 045: delete_store_completely 권한 오류 수정
-- 실행 위치: Supabase Dashboard > SQL Editor (또는 scripts/apply-migration.mjs)
-- 날짜: 2026-08-28
--
-- 배경:
--   슈퍼관리자가 업체 완전 삭제를 시도했더니
--   "permission denied for table tier_quantity_changes" 에러 발생.
--
--   원인: 044에서 만든 delete_store_completely 함수가 SECURITY DEFINER 없이
--   생성되어, 호출한 role(service_role)의 권한 그대로 실행된다. 그런데
--   tier_quantity_changes 등 일부 테이블은 service_role에 대한 명시적
--   GRANT가 빠져 있어서 DELETE 권한이 없다.
--
--   해결: 함수를 SECURITY DEFINER로 재정의한다. 이렇게 하면 함수를
--   "만든 사람"(테이블 소유자 권한을 가진 postgres 계정)의 권한으로
--   실행되므로, 호출자가 service_role이든 뭐든 테이블 권한 문제가 생기지
--   않는다. search_path를 public으로 고정해 보안 함정(다른 스키마의
--   동명 함수/테이블로 치환되는 공격)도 막는다.
-- ============================================================

CREATE OR REPLACE FUNCTION delete_store_completely(p_store_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
