-- ============================================================
-- Migration 021: 고객 세그먼트 자동 분류 (v2.1 8-4단계)
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. customer_loyalty 세그먼트 컬럼 추가 ───────────────────
ALTER TABLE customer_loyalty
  ADD COLUMN IF NOT EXISTS segment               text NOT NULL DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS average_visit_interval numeric;   -- 평균 방문 간격(일), null=표본 부족

ALTER TABLE customer_loyalty
  DROP CONSTRAINT IF EXISTS customer_loyalty_segment_check;

ALTER TABLE customer_loyalty
  ADD CONSTRAINT customer_loyalty_segment_check
  CHECK (segment IN ('NEW', 'ACTIVE', 'AT_RISK', 'DORMANT', 'RETURNED'));

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_segment
  ON customer_loyalty(store_id, segment);

-- ── 2. loyalty_settings: default_revisit_interval_days 추가 ──
-- store_settings 별도 테이블 없이 loyalty_settings에 통합
-- (관리자 UI를 추가 구축 없이 기존 loyalty-settings 화면에 입력란만 추가)
ALTER TABLE loyalty_settings
  ADD COLUMN IF NOT EXISTS default_revisit_interval_days integer DEFAULT 7;
-- 기본값 7일 (업종 무관 안전한 초기값)

-- ── 3. recalculate_customer_segment RPC 함수 ─────────────────
--
-- ⚠️ 구조적 한계 (명시):
--   이 함수는 게임 플레이 시점에만 호출되므로, 실제로 AT_RISK/DORMANT가
--   되는 시점(마지막 방문 후 장기 미방문)에는 자동 갱신되지 않는다.
--   정밀한 AT_RISK/DORMANT 탐지는 추후 Supabase pg_cron 또는 Vercel Cron을
--   통해 전체 사용자 대상 배치 재계산 스케줄러 추가 필요.
--   현재 단계에서는:
--     - 플레이 시 본인 세그먼트만 재계산 (on-play trigger)
--     - NEW / ACTIVE / RETURNED 정확히 작동
--     - AT_RISK / DORMANT는 추후 배치 또는 재방문 시 반영

CREATE OR REPLACE FUNCTION recalculate_customer_segment(
  p_store_id      text,
  p_kakao_user_id text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visit_count       integer;
  v_last_visit        timestamptz;
  v_old_segment       text;
  v_avg_interval      numeric;    -- 실제 계산된 개인 평균 (일)
  v_effective_interval numeric;   -- 판정에 실제 사용하는 값
  v_fallback_interval  integer;
  v_days_since_last    numeric;
  v_new_segment        text;
BEGIN
  -- ── 현재 loyalty 정보 조회 ─────────────────────────────────
  SELECT visit_count, last_visit_at, segment
    INTO v_visit_count, v_last_visit, v_old_segment
    FROM customer_loyalty
   WHERE store_id      = p_store_id
     AND kakao_user_id = p_kakao_user_id;

  IF NOT FOUND OR v_last_visit IS NULL THEN RETURN; END IF;

  -- ── 1. 방문 1회: NEW 고정 ──────────────────────────────────
  IF v_visit_count <= 1 THEN
    UPDATE customer_loyalty
       SET segment = 'NEW', average_visit_interval = NULL
     WHERE store_id = p_store_id AND kakao_user_id = p_kakao_user_id;
    RETURN;
  END IF;

  -- ── 2. 개인 평균 방문 간격 계산 (activity_log 기준) ─────────
  SELECT AVG(gap_days)
    INTO v_avg_interval
    FROM (
      SELECT
        EXTRACT(EPOCH FROM (
          occurred_at - LAG(occurred_at) OVER (ORDER BY occurred_at)
        )) / 86400.0 AS gap_days
      FROM activity_log
      WHERE store_id      = p_store_id
        AND kakao_user_id = p_kakao_user_id
        AND event_type    = 'game_complete'
    ) gaps
   WHERE gap_days IS NOT NULL;

  -- ── 3. fallback: 표본 3회 미만이면 매장 기본값 사용 ─────────
  SELECT COALESCE(default_revisit_interval_days, 7)
    INTO v_fallback_interval
    FROM loyalty_settings
   WHERE store_id = p_store_id;

  -- fallback이 없으면(매장 설정 미존재) 7일 하드코딩
  v_fallback_interval := COALESCE(v_fallback_interval, 7);

  IF v_visit_count < 3 OR v_avg_interval IS NULL THEN
    v_effective_interval := v_fallback_interval;
    v_avg_interval := NULL;  -- 표본 부족 시 저장 안 함
  ELSE
    v_effective_interval := v_avg_interval;
  END IF;

  -- ── 4. 마지막 방문 후 경과일 ────────────────────────────────
  v_days_since_last := EXTRACT(EPOCH FROM (now() - v_last_visit)) / 86400.0;

  -- ── 5. 세그먼트 판정 ────────────────────────────────────────
  IF v_days_since_last <= 30 THEN
    -- 최근 30일 내 재방문
    IF v_old_segment = 'DORMANT' THEN
      v_new_segment := 'RETURNED';   -- 복귀 고객 1회 표시
    ELSIF v_old_segment = 'RETURNED' THEN
      v_new_segment := 'ACTIVE';     -- RETURNED 다음은 정상 ACTIVE
    ELSE
      v_new_segment := 'ACTIVE';
    END IF;

  ELSIF v_days_since_last > v_effective_interval * 3 THEN
    v_new_segment := 'DORMANT';

  ELSIF v_days_since_last > v_effective_interval * 1.5 THEN
    v_new_segment := 'AT_RISK';

  ELSE
    v_new_segment := 'ACTIVE';
  END IF;

  -- ── 6. 저장 ────────────────────────────────────────────────
  UPDATE customer_loyalty
     SET segment                = v_new_segment,
         average_visit_interval = v_avg_interval
   WHERE store_id      = p_store_id
     AND kakao_user_id = p_kakao_user_id;

END;
$$;

GRANT EXECUTE ON FUNCTION recalculate_customer_segment(text, text) TO service_role;
