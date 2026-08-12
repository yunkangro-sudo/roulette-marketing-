-- ============================================================
-- Migration 013: 쿠폰/리워드 short_code 컬럼 추가
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- 짧은 코드 생성 함수 (8자리 대문자+숫자, 헷갈리는 문자 제외)
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i      int;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ── coupons.short_code ──────────────────────────────────────
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS short_code text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_short_code ON coupons(short_code) WHERE short_code IS NOT NULL;

-- 기존 쿠폰에 short_code 채우기 (backfill)
DO $$
DECLARE
  rec  record;
  code text;
BEGIN
  FOR rec IN SELECT id FROM coupons WHERE short_code IS NULL LOOP
    LOOP
      code := generate_short_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM coupons WHERE short_code = code);
    END LOOP;
    UPDATE coupons SET short_code = code WHERE id = rec.id;
  END LOOP;
END;
$$;

-- 신규 쿠폰 자동 생성 트리거
CREATE OR REPLACE FUNCTION trg_set_coupon_short_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  attempts int := 0;
BEGIN
  IF NEW.short_code IS NOT NULL THEN RETURN NEW; END IF;
  LOOP
    new_code := generate_short_code();
    IF NOT EXISTS (SELECT 1 FROM coupons WHERE short_code = new_code) THEN
      NEW.short_code := new_code;
      RETURN NEW;
    END IF;
    attempts := attempts + 1;
    IF attempts >= 20 THEN RAISE EXCEPTION 'short_code 생성 실패'; END IF;
  END LOOP;
END;
$$;

DROP TRIGGER IF EXISTS set_coupon_short_code ON coupons;
CREATE TRIGGER set_coupon_short_code
  BEFORE INSERT ON coupons
  FOR EACH ROW EXECUTE FUNCTION trg_set_coupon_short_code();

-- ── rewards_issued.short_code ───────────────────────────────
ALTER TABLE rewards_issued ADD COLUMN IF NOT EXISTS short_code text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rewards_issued_short_code ON rewards_issued(short_code) WHERE short_code IS NOT NULL;

DO $$
DECLARE
  rec  record;
  code text;
BEGIN
  FOR rec IN SELECT id FROM rewards_issued WHERE short_code IS NULL LOOP
    LOOP
      code := generate_short_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM rewards_issued WHERE short_code = code);
    END LOOP;
    UPDATE rewards_issued SET short_code = code WHERE id = rec.id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION trg_set_reward_short_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  attempts int := 0;
BEGIN
  IF NEW.short_code IS NOT NULL THEN RETURN NEW; END IF;
  LOOP
    new_code := generate_short_code();
    IF NOT EXISTS (SELECT 1 FROM rewards_issued WHERE short_code = new_code) THEN
      NEW.short_code := new_code;
      RETURN NEW;
    END IF;
    attempts := attempts + 1;
    IF attempts >= 20 THEN RAISE EXCEPTION 'short_code 생성 실패'; END IF;
  END LOOP;
END;
$$;

DROP TRIGGER IF EXISTS set_reward_short_code ON rewards_issued;
CREATE TRIGGER set_reward_short_code
  BEFORE INSERT ON rewards_issued
  FOR EACH ROW EXECUTE FUNCTION trg_set_reward_short_code();

-- GRANT 업데이트 (service_role이 short_code 컬럼도 읽을 수 있도록)
GRANT SELECT, UPDATE ON coupons TO service_role;
GRANT SELECT, UPDATE ON rewards_issued TO service_role;
