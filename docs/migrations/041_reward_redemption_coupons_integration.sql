-- ============================================================
-- Migration 041: 리워드 교환(포인트→경품)을 coupons 테이블로 통합
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 날짜: 2026-08-26
--
-- 배경:
--   지금까지 "포인트로 리워드 교환"은 rewards_issued 테이블에 별도로 발급되고,
--   손님 화면도 토스트 메시지만 뜨고 끝(코드 확인 화면 없음), 계산대도
--   coupons/rewards_issued 두 테이블을 각각 조회하는 별도 탭으로 나뉘어 있었다.
--   게임 당첨 쿠폰은 반대로 coupons 테이블 + "/me/points/[couponId]" 코드 화면 +
--   "사장님 확인" 버튼까지 이미 완결된 흐름을 갖고 있어서, 리워드 교환도 이
--   흐름에 완전히 합류시킨다 — 새 화면을 만들지 않고 기존 coupons 기반 흐름을
--   그대로 재사용하기 위함.
--
--   rewards_issued 테이블/관련 API(/api/rewards/lookup, /staff의 "리워드" 코드탭,
--   checkout_queue의 item_type='reward')는 삭제하지 않는다 — 이미 발급되어 아직
--   pending 상태로 남아있을 수 있는 기존 데이터를 위한 하위호환 경로로 유지한다.
--   앞으로 새로 발급되는 리워드 교환은 전부 coupons 테이블에만 쌓인다.
-- ============================================================

-- ── 1. coupons.source_type에 'reward_redemption' 추가 ──────────
ALTER TABLE coupons
  DROP CONSTRAINT IF EXISTS coupons_source_type_check;
ALTER TABLE coupons
  ADD CONSTRAINT coupons_source_type_check
  CHECK (source_type IN ('game_win', 'manual', 'mission_reward', 'reward_redemption'));

-- ── 2. coupons.reward_catalog_id — reward_redemption일 때만 값 있음 ──
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS reward_catalog_id uuid REFERENCES reward_catalog(id) ON DELETE SET NULL;

COMMENT ON COLUMN coupons.reward_catalog_id IS
  'source_type = reward_redemption일 때만 값 있음 — 포인트로 교환한 reward_catalog.id';

CREATE INDEX IF NOT EXISTS idx_coupons_reward_catalog_id
  ON coupons(reward_catalog_id) WHERE reward_catalog_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON coupons TO service_role;

-- ── 3. redeem_points_atomic: rewards_issued 대신 coupons에 발급 ──
-- 함수 시그니처(파라미터)는 그대로 유지해서 호출부(app/api/me/points/redeem/route.ts)
-- 수정을 최소화한다. 반환값만 issued_id → coupon_id로 바뀐다.
--
-- amount/label 규칙:
--   - reward_type = 'discount' → amount = discount_amount (계산대에서 "N원 할인"으로 적용)
--   - 그 외(free_item/points/experience/special_coupon/vip_reward) → amount = 0,
--     화면 표시는 label(리워드명)을 우선 사용 (coupons.label 컬럼, 032 마이그레이션 참고)
--
-- 유효기간: reward_catalog에 별도 유효기간 컬럼이 없어, 게임 당첨 쿠폰의 기본값(14일)과
-- 동일하게 발급일로부터 14일로 고정한다. 추후 리워드별 유효기간이 필요해지면 별도 컬럼
-- 추가 후 이 부분만 교체하면 된다.
CREATE OR REPLACE FUNCTION redeem_points_atomic(
  p_kakao_user_id   text,
  p_store_id        text,
  p_reward_id       uuid,
  p_point_cost      integer,
  p_usage_threshold integer
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

  IF v_current_balance < p_usage_threshold THEN
    RETURN jsonb_build_object('ok', false, 'error', '사용 임계값 미달입니다');
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
