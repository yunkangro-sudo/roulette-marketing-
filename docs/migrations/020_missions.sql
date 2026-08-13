-- ============================================================
-- Migration 020: missions / mission_progress — 방문 미션 시스템
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. missions 테이블 ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS missions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     text        NOT NULL,
  name         text        NOT NULL,

  mission_type text        NOT NULL DEFAULT 'visit_count',
  -- visit_count    : 방문(게임 플레이) 횟수 — 이번 단계 실제 사용
  -- game_play_count: 게임 플레이 횟수 (향후 확장용, 로직 미구현)
  -- coupon_use_count: 쿠폰 사용 횟수 (향후 확장용, 로직 미구현)

  target_value integer     NOT NULL CHECK (target_value > 0),

  reward_type  text        NOT NULL,
  -- 'point'  : 포인트 지급
  -- 'coupon' : 쿠폰 발급

  reward_value integer     NOT NULL CHECK (reward_value > 0),
  -- reward_type='point' → 지급할 포인트 수
  -- reward_type='coupon' → 쿠폰 금액(원)

  start_at     timestamptz,
  end_at       timestamptz,
  active       boolean     NOT NULL DEFAULT true,

  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE missions
  ADD CONSTRAINT missions_mission_type_check
  CHECK (mission_type IN ('visit_count', 'game_play_count', 'coupon_use_count'));

ALTER TABLE missions
  ADD CONSTRAINT missions_reward_type_check
  CHECK (reward_type IN ('point', 'coupon'));

CREATE INDEX IF NOT EXISTS idx_missions_store_active
  ON missions(store_id, active) WHERE active = true;

GRANT SELECT, INSERT, UPDATE ON missions TO service_role;

-- ── 2. mission_progress 테이블 ───────────────────────────────
CREATE TABLE IF NOT EXISTS mission_progress (
  mission_id     uuid        NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  store_id       text        NOT NULL,
  kakao_user_id  text        NOT NULL,
  current_value  integer     NOT NULL DEFAULT 0,
  completed_at   timestamptz,          -- NULL이면 진행 중, NOT NULL이면 완료
  updated_at     timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (mission_id, store_id, kakao_user_id)
);

CREATE INDEX IF NOT EXISTS idx_mission_progress_user
  ON mission_progress(store_id, kakao_user_id);

GRANT SELECT, INSERT, UPDATE ON mission_progress TO service_role;

-- ── 3. coupons.source_type에 'mission_reward' 추가 ────────────
-- 기존 CHECK 제약 삭제 후 재생성
ALTER TABLE coupons
  DROP CONSTRAINT IF EXISTS coupons_source_type_check;

ALTER TABLE coupons
  ADD CONSTRAINT coupons_source_type_check
  CHECK (source_type IN ('game_win', 'manual', 'mission_reward'));

-- event_id가 NOT NULL이면 nullable로 변경 (미션/수동 쿠폰엔 event 없음)
ALTER TABLE coupons
  ALTER COLUMN event_id DROP NOT NULL;

-- ── 4. process_mission_progress RPC 함수 ─────────────────────
-- 게임 플레이 완료 시 호출 — 원자적 진행률 업데이트 + 보상 지급
-- Silent fail은 호출 측(TypeScript)에서 처리
CREATE OR REPLACE FUNCTION process_mission_progress(
  p_store_id     text,
  p_kakao_user_id text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mission     record;
  v_new_value   integer;
  v_updated     boolean;
BEGIN
  -- visit_count 타입 + active 미션만 처리
  FOR v_mission IN
    SELECT id, target_value, reward_type, reward_value, end_at
    FROM missions
    WHERE store_id    = p_store_id
      AND mission_type = 'visit_count'
      AND active       = true
      AND (start_at IS NULL OR start_at <= now())
      AND (end_at   IS NULL OR end_at   >  now())
  LOOP
    -- 이미 완료된 미션은 건너뜀
    IF EXISTS (
      SELECT 1 FROM mission_progress
      WHERE mission_id    = v_mission.id
        AND store_id      = p_store_id
        AND kakao_user_id = p_kakao_user_id
        AND completed_at IS NOT NULL
    ) THEN
      CONTINUE;
    END IF;

    -- 원자적 upsert: current_value + 1
    INSERT INTO mission_progress (mission_id, store_id, kakao_user_id, current_value, updated_at)
    VALUES (v_mission.id, p_store_id, p_kakao_user_id, 1, now())
    ON CONFLICT (mission_id, store_id, kakao_user_id)
    DO UPDATE
      SET current_value = mission_progress.current_value + 1,
          updated_at    = now()
    RETURNING current_value INTO v_new_value;

    -- 목표 달성 여부 확인
    IF v_new_value >= v_mission.target_value THEN

      -- completed_at IS NULL 조건으로 중복 완료 방어
      UPDATE mission_progress
         SET completed_at = now()
       WHERE mission_id    = v_mission.id
         AND store_id      = p_store_id
         AND kakao_user_id = p_kakao_user_id
         AND completed_at IS NULL;

      GET DIAGNOSTICS v_updated = ROW_COUNT;

      -- 실제로 업데이트됐을 때(최초 완료)만 보상 지급
      IF v_updated > 0 THEN

        IF v_mission.reward_type = 'point' THEN
          -- ① point_ledger 기록
          INSERT INTO point_ledger (store_id, kakao_user_id, type, amount)
          VALUES (p_store_id, p_kakao_user_id, 'earn', v_mission.reward_value);

          -- ② customer_loyalty 포인트 증가 (upsert)
          INSERT INTO customer_loyalty (store_id, kakao_user_id, point_balance, visit_count, last_visit_at)
          VALUES (p_store_id, p_kakao_user_id, v_mission.reward_value, 0, now())
          ON CONFLICT (store_id, kakao_user_id)
          DO UPDATE SET point_balance = customer_loyalty.point_balance + v_mission.reward_value;

        ELSIF v_mission.reward_type = 'coupon' THEN
          -- ③ 미션 보상 쿠폰 발급
          INSERT INTO coupons (
            store_id,
            kakao_user_id,
            event_id,
            amount,
            source_type,
            requires_verification,
            status,
            issued_at,
            valid_until
          ) VALUES (
            p_store_id,
            p_kakao_user_id,
            NULL,  -- 미션 쿠폰은 event 없음
            v_mission.reward_value,
            'mission_reward',
            CASE WHEN v_mission.reward_value >= 10000 THEN true ELSE false END,
            CASE WHEN v_mission.reward_value >= 10000 THEN 'pending_verify' ELSE 'issued' END,
            now(),
            -- 유효기간: 미션 종료일이 있으면 그 날, 없으면 발급일 +30일
            COALESCE(v_mission.end_at, now() + interval '30 days')
          );
        END IF;

      END IF; -- IF v_updated > 0
    END IF;   -- IF v_new_value >= target
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION process_mission_progress(text, text) TO service_role;
