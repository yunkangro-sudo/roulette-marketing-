-- ============================================================
-- Migration 035: 이벤트 도전횟수(challenge_frequency) 일반화
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경: 지금까지 "하루 1회/매장" 제한이 daily_participation_log에
--       unique(store_id, kakao_user_id, date)로 하드코딩되어 있었다.
--       매일/주간/월간/무제한을 이벤트별로 고를 수 있게 하려면 날짜(date) 단위
--       유니크 대신 "마지막 참여 시각(last_played_at)"을 저장하고 프론트/서버
--       로직에서 주기별로 비교해야 한다. 테이블명은 유지하되(마이그레이션 부담
--       최소화) event_id를 추가해 이벤트 단위로 참여 기록을 구분한다.
-- ============================================================

-- ── events: 도전 횟수 설정 ────────────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS challenge_frequency text NOT NULL DEFAULT 'daily';

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_challenge_frequency_check;

ALTER TABLE events
  ADD CONSTRAINT events_challenge_frequency_check
  CHECK (challenge_frequency IN ('daily', 'weekly', 'monthly', 'unlimited'));

-- ── daily_participation_log: event_id + last_played_at 추가 ─────────
ALTER TABLE daily_participation_log
  ADD COLUMN IF NOT EXISTS event_id       uuid REFERENCES events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS last_played_at timestamptz;

-- 기존 row 보정: date(참여일) 00:00 KST를 last_played_at으로 채워둔다
UPDATE daily_participation_log
SET last_played_at = (date::timestamptz - interval '9 hours') + interval '9 hours'
WHERE last_played_at IS NULL;

-- event_id가 없는 과거 row는 매장의 현재 active 이벤트로 채워둔다 (베스트에포트, 없으면 NULL 유지)
UPDATE daily_participation_log dpl
SET event_id = e.id
FROM events e
WHERE dpl.event_id IS NULL
  AND e.store_id = dpl.store_id
  AND e.status = 'active';

-- 중복 정리: event_id 백필로 같은(store_id, kakao_user_id, event_id) 조합에 여러 날짜의
-- row가 쌓인 경우, 가장 최근 참여(last_played_at) 1건만 남기고 나머지는 삭제한다.
-- (참여 가능 여부 판단용 기록이라 과거 중복 row를 지워도 데이터 손실 문제는 없다.)
DELETE FROM daily_participation_log dpl
WHERE dpl.event_id IS NOT NULL
  AND dpl.id NOT IN (
    SELECT DISTINCT ON (store_id, kakao_user_id, event_id) id
    FROM daily_participation_log
    WHERE event_id IS NOT NULL
    ORDER BY store_id, kakao_user_id, event_id, last_played_at DESC NULLS LAST, created_at DESC
  );

-- 기존 (store_id, kakao_user_id, date) 유니크 제약 제거 → (store_id, kakao_user_id, event_id)로 교체
ALTER TABLE daily_participation_log
  DROP CONSTRAINT IF EXISTS daily_participation_log_store_id_kakao_user_id_date_key;

-- 일반 UNIQUE 제약으로 추가 (앱 코드에서 upsert onConflict로 참조하려면 부분 인덱스가
-- 아닌 일반 제약이어야 한다). event_id가 NULL인 과거 row끼리는 표준 SQL 규칙상
-- NULL <> NULL로 취급되어 서로 유니크 충돌 없이 계속 공존 가능하다.
ALTER TABLE daily_participation_log
  DROP CONSTRAINT IF EXISTS uq_participation_store_user_event;

ALTER TABLE daily_participation_log
  ADD CONSTRAINT uq_participation_store_user_event UNIQUE (store_id, kakao_user_id, event_id);
