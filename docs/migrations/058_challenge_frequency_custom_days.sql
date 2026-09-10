-- ============================================================
-- Migration 058: 도전 횟수(challenge_frequency) — 주간/월간 제거, "N일마다" 직접입력으로 대체
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경: 관리자가 "주간"/"월간" 중에서만 고르던 방식을 없애고, 며칠에 한 번
--       재도전 가능한지 숫자로 직접 입력하는 "custom" 옵션으로 일반화한다.
--       기존 weekly=7일/monthly=30일이었던 것과 동일한 값으로 백필해서
--       기존 이벤트의 실제 동작(재도전 주기)은 전혀 바뀌지 않는다.
-- ============================================================

-- ── events: 커스텀 일수 컬럼 추가 ────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS challenge_frequency_days integer;

-- 기존 CHECK 제약을 먼저 풀어야 아래 백필(UPDATE)에서 'custom' 값을 넣을 수 있다
ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_challenge_frequency_check;

-- 기존 weekly/monthly 이벤트를 custom + 동일한 일수로 백필 (동작 변화 없음)
UPDATE events SET challenge_frequency = 'custom', challenge_frequency_days = 7
WHERE challenge_frequency = 'weekly';

UPDATE events SET challenge_frequency = 'custom', challenge_frequency_days = 30
WHERE challenge_frequency = 'monthly';

-- ── CHECK 제약 갱신: daily / custom / unlimited 만 허용 ──────────────
ALTER TABLE events
  ADD CONSTRAINT events_challenge_frequency_check
  CHECK (challenge_frequency IN ('daily', 'custom', 'unlimited'));

-- custom인데 일수가 비어있거나 0 이하인 데이터가 저장되지 않도록 방어
ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_challenge_frequency_days_check;

ALTER TABLE events
  ADD CONSTRAINT events_challenge_frequency_days_check
  CHECK (challenge_frequency <> 'custom' OR challenge_frequency_days > 0);
