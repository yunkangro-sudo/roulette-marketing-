-- ============================================================
-- Migration 056: 경품 확률 자동 재조정 + "장기 운영" 모드
-- ============================================================
-- 배경: 지금까지는 이벤트 생성/수정 시점에만 확률이 계산되고 그 뒤로 고정됐다.
-- 이제 매일 자정(KST) 배치가 실측 참여 데이터를 기반으로 확률을 자동
-- 재조정한다 (lib/game-engine/dailyRebalance.ts, /api/cron/probability-rebalance).
--
-- 추가로 "노출기간은 길게 두되 예산(경품 수량)은 주기적으로 리셋"하고 싶은
-- 상시 이벤트를 위한 "장기 운영" 모드를 추가한다.
--
--   - long_term_mode = false(기본값): 기존 방식 그대로. 확률만 매일 자동 재조정됨.
--   - long_term_mode = true: total_quantity를 "한 주기당 배분 수량"으로 재해석.
--     reset_cycle(주간/월간) 경계를 넘을 때마다 remaining_quantity가
--     total_quantity로 리필되고, 확률 계산의 "남은 기간"도 이벤트 전체
--     종료일이 아니라 "현재 주기의 종료일"(display_end_date로 상한) 기준이 된다.
--
-- current_cycle_start: 장기운영 모드에서만 사용. 현재 진행 중인 예산 주기의
-- 시작일을 추적한다 (캘린더 기준 리셋 — 주간=매주 월요일, 월간=매월 1일 —
-- 이라 그 자체는 계산 가능하지만, "이벤트를 주/월 중간에 시작해도 첫 주기는
-- 짧게 처리"해야 해서 앵커값을 별도로 저장해야 함).

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS long_term_mode boolean NOT NULL DEFAULT false;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS reset_cycle text;

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_reset_cycle_check;

ALTER TABLE events
  ADD CONSTRAINT events_reset_cycle_check
  CHECK (reset_cycle IS NULL OR reset_cycle IN ('weekly', 'monthly'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS current_cycle_start date;

COMMENT ON COLUMN events.long_term_mode IS
  '장기 운영 모드. true면 total_quantity를 "주기당 배분 수량"으로 해석하고, reset_cycle 경계마다 remaining_quantity를 리필한다.';
COMMENT ON COLUMN events.reset_cycle IS
  '장기 운영 모드 리셋 주기. weekly=매주 월요일 시작, monthly=매월 1일 시작. long_term_mode=false면 NULL.';
COMMENT ON COLUMN events.current_cycle_start IS
  '장기 운영 모드에서 현재 진행 중인 예산 주기의 시작일. long_term_mode=false면 NULL.';
