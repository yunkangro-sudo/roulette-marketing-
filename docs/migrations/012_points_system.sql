-- ============================================================
-- Migration 012: 포인트 적립/리워드 시스템
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. 고객 충성도 (포인트 잔액 + 방문횟수)
CREATE TABLE IF NOT EXISTS customer_loyalty (
  store_id          text    NOT NULL,
  kakao_user_id     text    NOT NULL,
  point_balance     integer NOT NULL DEFAULT 0,
  visit_count       integer NOT NULL DEFAULT 0,
  last_visit_at     timestamptz DEFAULT now(),
  PRIMARY KEY (store_id, kakao_user_id)
);

-- 2. 포인트 원장 (적립/사용 내역)
CREATE TABLE IF NOT EXISTS point_ledger (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id              text        NOT NULL,
  kakao_user_id         text        NOT NULL,
  type                  text        NOT NULL CHECK (type IN ('earn', 'redeem')),
  amount                integer     NOT NULL,          -- 적립: 양수, 차감: 양수(차감 금액)
  related_coupon_id     uuid        REFERENCES coupons(id) ON DELETE SET NULL,
  related_reward_id     uuid,                          -- rewards_issued.id (FK는 아래에서 추가)
  created_at            timestamptz DEFAULT now()
);

-- 3. 매장 포인트 정책
CREATE TABLE IF NOT EXISTS loyalty_settings (
  store_id              text    PRIMARY KEY,
  point_per_visit       integer NOT NULL DEFAULT 10,   -- 회당 적립 포인트
  usage_threshold       integer NOT NULL DEFAULT 100,  -- 사용 가능 최소 잔액
  point_expiry_days     integer,                       -- null = 무제한
  updated_at            timestamptz DEFAULT now()
);

-- 4. 리워드 카탈로그
CREATE TABLE IF NOT EXISTS reward_catalog (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id    text    NOT NULL,
  name        text    NOT NULL,
  point_cost  integer NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  stock       integer,                                 -- null = 무제한
  created_at  timestamptz DEFAULT now()
);

-- 5. 발급된 리워드
CREATE TABLE IF NOT EXISTS rewards_issued (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_catalog_id     uuid        NOT NULL REFERENCES reward_catalog(id),
  store_id              text        NOT NULL,
  kakao_user_id         text        NOT NULL,
  status                text        NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','used','expired')),
  issued_at             timestamptz DEFAULT now(),
  used_at               timestamptz,
  verified_by_staff_id  uuid        REFERENCES store_accounts(id) ON DELETE SET NULL
);

-- point_ledger → rewards_issued FK (순환 의존성 회피를 위해 별도로)
ALTER TABLE point_ledger
  ADD CONSTRAINT fk_point_ledger_reward
  FOREIGN KEY (related_reward_id) REFERENCES rewards_issued(id) ON DELETE SET NULL;

-- RLS 비활성화
ALTER TABLE customer_loyalty   DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_ledger        DISABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_settings    DISABLE ROW LEVEL SECURITY;
ALTER TABLE reward_catalog      DISABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_issued      DISABLE ROW LEVEL SECURITY;

-- 서비스 롤 권한
GRANT SELECT, INSERT, UPDATE ON customer_loyalty   TO service_role;
GRANT SELECT, INSERT          ON point_ledger        TO service_role;
GRANT SELECT, INSERT, UPDATE  ON loyalty_settings    TO service_role;
GRANT SELECT, INSERT, UPDATE  ON reward_catalog      TO service_role;
GRANT SELECT, INSERT, UPDATE  ON rewards_issued      TO service_role;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_cl_store_user     ON customer_loyalty(store_id, kakao_user_id);
CREATE INDEX IF NOT EXISTS idx_pl_store_user     ON point_ledger(store_id, kakao_user_id);
CREATE INDEX IF NOT EXISTS idx_rc_store          ON reward_catalog(store_id);
CREATE INDEX IF NOT EXISTS idx_ri_store_user     ON rewards_issued(store_id, kakao_user_id);
CREATE INDEX IF NOT EXISTS idx_ri_status         ON rewards_issued(status);

-- ============================================================
-- RPC: 리워드 교환 원자 처리 (포인트 차감 + rewards_issued 생성)
-- 동시 요청 시 이중 차감 방지
-- ============================================================
CREATE OR REPLACE FUNCTION redeem_points_atomic(
  p_kakao_user_id   text,
  p_store_id        text,
  p_reward_id       uuid,   -- reward_catalog.id
  p_point_cost      integer,
  p_usage_threshold integer
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_balance integer;
  v_reward          record;
  v_issued_id       uuid;
  v_ledger_id       uuid;
BEGIN
  -- 1) 잔액 확인 (FOR UPDATE 로 락)
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

  -- 2) 리워드 확인 (재고 체크)
  SELECT * INTO v_reward FROM reward_catalog
  WHERE id = p_reward_id AND store_id = p_store_id AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', '유효하지 않은 리워드입니다');
  END IF;

  IF v_reward.stock IS NOT NULL AND v_reward.stock <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', '재고가 소진되었습니다');
  END IF;

  -- 3) 포인트 차감
  UPDATE customer_loyalty
  SET point_balance = point_balance - p_point_cost
  WHERE store_id = p_store_id AND kakao_user_id = p_kakao_user_id;

  -- 4) 재고 차감 (null이면 무제한)
  IF v_reward.stock IS NOT NULL THEN
    UPDATE reward_catalog SET stock = stock - 1 WHERE id = p_reward_id;
  END IF;

  -- 5) rewards_issued 생성
  INSERT INTO rewards_issued (reward_catalog_id, store_id, kakao_user_id, status)
  VALUES (p_reward_id, p_store_id, p_kakao_user_id, 'issued')
  RETURNING id INTO v_issued_id;

  -- 6) point_ledger 기록
  INSERT INTO point_ledger (store_id, kakao_user_id, type, amount, related_reward_id)
  VALUES (p_store_id, p_kakao_user_id, 'redeem', p_point_cost, v_issued_id)
  RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object(
    'ok', true,
    'issued_id', v_issued_id,
    'new_balance', v_current_balance - p_point_cost
  );
END;
$$;

GRANT EXECUTE ON FUNCTION redeem_points_atomic TO service_role;

-- RPC: 포인트 적립 + 방문횟수 증가 (upsert)
CREATE OR REPLACE FUNCTION upsert_customer_loyalty(
  p_store_id      text,
  p_kakao_user_id text,
  p_points        integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO customer_loyalty (store_id, kakao_user_id, point_balance, visit_count, last_visit_at)
  VALUES (p_store_id, p_kakao_user_id, p_points, 1, now())
  ON CONFLICT (store_id, kakao_user_id) DO UPDATE
    SET point_balance = customer_loyalty.point_balance + p_points,
        visit_count   = customer_loyalty.visit_count + 1,
        last_visit_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_customer_loyalty TO service_role;

-- 테스트 기본 데이터
INSERT INTO loyalty_settings (store_id, point_per_visit, usage_threshold, point_expiry_days)
VALUES ('test-store-001', 10, 50, NULL)
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO reward_catalog (store_id, name, point_cost, active, stock)
VALUES
  ('test-store-001', '아메리카노 1잔', 50, true, null),
  ('test-store-001', '케이크 1조각', 100, true, 10)
ON CONFLICT DO NOTHING;
