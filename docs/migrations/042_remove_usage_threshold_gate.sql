-- ============================================================
-- Migration 042: 리워드 교환에서 "최소 사용 가능 잔액" 게이트 제거
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 날짜: 2026-08-26
--
-- 배경:
--   loyalty_settings.usage_threshold("리워드 사용 가능 최소 잔액")가 리워드
--   개별 가격(point_cost) 위에 추가로 얹혀져서, 예를 들어 20P짜리 리워드인데
--   최소잔액이 30P로 설정돼 있으면 20P를 모아도 여전히 교환이 막히는 문제가
--   있었다. 손님 입장에서는 "OOP만 더 모으면 받을 수 있어요" 안내를 보고
--   그만큼 모았는데도 교환이 안 되는 것처럼 보여 혼란스러웠다.
--   (실제 사례: docs/migrations 041 이후 리워드 교환 첫 실사용 테스트에서 발견)
--
--   매장 운영자와 상의 결과, 리워드 교환 가능 여부는 오직 해당 리워드의
--   point_cost만으로 판단하기로 결정. loyalty_settings.usage_threshold
--   컬럼/관리자 화면은 그대로 남겨두되(다른 용도로 참고할 수 있어 삭제하지
--   않음), redeem_points_atomic 함수 내부에서는 더 이상 이 값을 체크하지
--   않는다. 호출부(app/api/me/points/redeem/route.ts)도 이제 0을 넘기지만,
--   RPC 자체가 이 파라미터를 무시하도록 고쳐서 향후 다른 호출부가 실수로
--   실제 값을 넘기더라도 동일하게 동작하도록 방어한다.
-- ============================================================

CREATE OR REPLACE FUNCTION redeem_points_atomic(
  p_kakao_user_id   text,
  p_store_id        text,
  p_reward_id       uuid,
  p_point_cost      integer,
  p_usage_threshold integer  -- 더 이상 사용하지 않음(호출부 시그니처 호환을 위해서만 유지)
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_balance integer;
  v_reward          record;
  v_coupon_id       uuid;
  v_initial_status  text;
  v_amount          integer;
BEGIN
  SELECT point_balance INTO v_current_balance
  FROM customer_loyalty
  WHERE store_id = p_store_id AND kakao_user_id = p_kakao_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', '포인트 정보를 찾을 수 없습니다');
  END IF;

  IF v_current_balance < p_point_cost THEN
    RETURN jsonb_build_object('ok', false, 'error', '포인트가 부족합니다');
  END IF;

  SELECT * INTO v_reward FROM reward_catalog
  WHERE id = p_reward_id AND store_id = p_store_id AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', '유효하지 않은 리워드입니다');
  END IF;

  IF v_reward.stock IS NOT NULL AND v_reward.stock <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', '재고가 소진되었습니다');
  END IF;

  UPDATE customer_loyalty
  SET point_balance = point_balance - p_point_cost
  WHERE store_id = p_store_id AND kakao_user_id = p_kakao_user_id;

  IF v_reward.stock IS NOT NULL THEN
    UPDATE reward_catalog SET stock = stock - 1 WHERE id = p_reward_id;
  END IF;

  v_initial_status := CASE WHEN v_reward.requires_verification THEN 'pending_verify' ELSE 'pending_apply' END;
  v_amount := CASE WHEN v_reward.reward_type = 'discount' THEN COALESCE(v_reward.discount_amount, 0) ELSE 0 END;

  INSERT INTO coupons (
    store_id, kakao_user_id, event_id, amount, label, source_type,
    reward_catalog_id, requires_verification, status, issued_at, valid_until
  ) VALUES (
    p_store_id, p_kakao_user_id, NULL, v_amount, v_reward.name, 'reward_redemption',
    p_reward_id, v_reward.requires_verification, v_initial_status, now(), now() + interval '14 days'
  )
  RETURNING id INTO v_coupon_id;

  INSERT INTO point_ledger (store_id, kakao_user_id, type, amount, related_coupon_id)
  VALUES (p_store_id, p_kakao_user_id, 'redeem', p_point_cost, v_coupon_id);

  RETURN jsonb_build_object(
    'ok', true,
    'coupon_id', v_coupon_id,
    'new_balance', v_current_balance - p_point_cost
  );
END;
$$;

GRANT EXECUTE ON FUNCTION redeem_points_atomic TO service_role;
