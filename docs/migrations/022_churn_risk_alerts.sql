-- ============================================================
-- Migration 022: churn_risk_alerts — Win-back 3단계 세분화
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. churn_risk_alerts 테이블 ──────────────────────────────
CREATE TABLE IF NOT EXISTS churn_risk_alerts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id       text        NOT NULL,
  kakao_user_id  text        NOT NULL,

  risk_level     text        NOT NULL,
  -- 'interested' : 1.0~1.5배 경과 (초기 이탈 신호)
  -- 'at_risk'    : 1.5~2.5배 경과 (위험)
  -- 'dormant'    : 2.5배 초과 (휴면)

  flagged_at     timestamptz NOT NULL DEFAULT now(),
  reminder_sent_at timestamptz,   -- 알림 발송 시점 (NULL이면 미발송)
  recovered      boolean     NOT NULL DEFAULT false,
  recovered_at   timestamptz       -- 복귀 확인 시점
);

ALTER TABLE churn_risk_alerts
  DROP CONSTRAINT IF EXISTS churn_risk_alerts_risk_level_check;

ALTER TABLE churn_risk_alerts
  ADD CONSTRAINT churn_risk_alerts_risk_level_check
  CHECK (risk_level IN ('interested', 'at_risk', 'dormant'));

-- 활성 알림 조회용 (Phase 2 배치에서 미발송 대상 탐색에 활용)
CREATE INDEX IF NOT EXISTS idx_churn_risk_active
  ON churn_risk_alerts(store_id, kakao_user_id, recovered)
  WHERE recovered = false;

-- 대시보드 집계용
CREATE INDEX IF NOT EXISTS idx_churn_risk_store
  ON churn_risk_alerts(store_id, flagged_at DESC);

GRANT SELECT, INSERT, UPDATE ON churn_risk_alerts TO service_role;

-- ── 2. process_churn_risk RPC 함수 ───────────────────────────
--
-- 설계 원칙:
--   - activity_log의 마지막 두 game_complete 간격으로 risk 측정
--     ("현재 플레이 이전에 얼마나 비어있었는가" → 복귀 이력 기록)
--   - 감지 시 recovered=true로 즉시 기록 (복귀했으므로)
--   - 기존 unrecovered 알림이 있으면 먼저 복귀 처리
--   - 중복 방지: 이전 복귀와 현재 복귀 사이에 동일 risk_level 이미 있으면 skip
--
-- ⚠️ 한계 (v2.1 4절에 기록됨):
--   미방문 상태인 사용자의 unrecovered 알림 생성은 Phase 2 배치에서 처리.
--   현재 단계에서는 "복귀 시점 이력 기록" 용도로만 동작.
--
-- 반환값: 감지된 risk_level 문자열, 없으면 NULL

CREATE OR REPLACE FUNCTION process_churn_risk(
  p_store_id      text,
  p_kakao_user_id text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visit_count       integer;
  v_last_gap          numeric;     -- 직전 두 방문 간격 (일)
  v_avg_interval      numeric;     -- 개인 평균 방문 간격
  v_fallback_interval integer;
  v_effective_interval numeric;
  v_risk_level        text;
BEGIN
  -- ── 방문 횟수 확인 ────────────────────────────────────────
  SELECT visit_count INTO v_visit_count
    FROM customer_loyalty
   WHERE store_id = p_store_id AND kakao_user_id = p_kakao_user_id;

  IF v_visit_count IS NULL OR v_visit_count < 2 THEN
    RETURN NULL;  -- 데이터 부족
  END IF;

  -- ── 기존 unrecovered 알림 → 복귀 처리 ────────────────────
  UPDATE churn_risk_alerts
     SET recovered    = true,
         recovered_at = now()
   WHERE store_id      = p_store_id
     AND kakao_user_id = p_kakao_user_id
     AND recovered     = false;

  -- ── 직전 두 방문 간격 계산 (activity_log 기준) ────────────
  WITH ranked AS (
    SELECT occurred_at,
           ROW_NUMBER() OVER (ORDER BY occurred_at DESC) AS rn
      FROM activity_log
     WHERE store_id      = p_store_id
       AND kakao_user_id = p_kakao_user_id
       AND event_type    = 'game_complete'
  )
  SELECT EXTRACT(EPOCH FROM (
    (SELECT occurred_at FROM ranked WHERE rn = 1) -
    (SELECT occurred_at FROM ranked WHERE rn = 2)
  )) / 86400.0
    INTO v_last_gap;

  IF v_last_gap IS NULL OR v_last_gap <= 0 THEN
    RETURN NULL;
  END IF;

  -- ── 유효 기준 주기 결정 (8-4와 동일 로직) ────────────────
  SELECT COALESCE(default_revisit_interval_days, 7)
    INTO v_fallback_interval
    FROM loyalty_settings
   WHERE store_id = p_store_id;
  v_fallback_interval := COALESCE(v_fallback_interval, 7);

  SELECT AVG(gap_days) INTO v_avg_interval
    FROM (
      SELECT EXTRACT(EPOCH FROM (
        occurred_at - LAG(occurred_at) OVER (ORDER BY occurred_at)
      )) / 86400.0 AS gap_days
        FROM activity_log
       WHERE store_id      = p_store_id
         AND kakao_user_id = p_kakao_user_id
         AND event_type    = 'game_complete'
    ) gaps
   WHERE gap_days IS NOT NULL;

  v_effective_interval := CASE
    WHEN v_visit_count >= 3 AND v_avg_interval IS NOT NULL THEN v_avg_interval
    ELSE v_fallback_interval
  END;

  -- ── risk_level 판정 ───────────────────────────────────────
  IF v_last_gap > v_effective_interval * 2.5 THEN
    v_risk_level := 'dormant';
  ELSIF v_last_gap > v_effective_interval * 1.5 THEN
    v_risk_level := 'at_risk';
  ELSIF v_last_gap > v_effective_interval * 1.0 THEN
    v_risk_level := 'interested';
  ELSE
    RETURN NULL;  -- 정상 범위 복귀, 위험 없음
  END IF;

  -- ── 중복 방지: 직전 복귀 이후 동일 risk_level 이미 있으면 skip ──
  IF EXISTS (
    SELECT 1 FROM churn_risk_alerts
     WHERE store_id      = p_store_id
       AND kakao_user_id = p_kakao_user_id
       AND risk_level    = v_risk_level
       AND flagged_at    > now() - (v_effective_interval * interval '1 day')
  ) THEN
    RETURN NULL;
  END IF;

  -- ── 복귀 이력 기록 (recovered=true: 이미 복귀했으므로) ────
  INSERT INTO churn_risk_alerts
    (store_id, kakao_user_id, risk_level, flagged_at, recovered, recovered_at)
  VALUES
    (p_store_id, p_kakao_user_id, v_risk_level, now(), true, now());

  RETURN v_risk_level;
END;
$$;

GRANT EXECUTE ON FUNCTION process_churn_risk(text, text) TO service_role;
