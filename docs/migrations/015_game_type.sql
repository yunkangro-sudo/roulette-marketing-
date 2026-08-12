-- ============================================================
-- Migration 015: events 테이블에 game_type 컬럼 추가
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 목적: 나중에 게임(인형뽑기 → 가챠캡슐 등) 교체/다양화를 위한 준비.
--       지금은 컬럼만 추가, 두 번째 게임 로직은 만들지 않음.
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS game_type text NOT NULL DEFAULT 'claw_machine';

-- 현재 허용 game_type: claw_machine (나중에 gacha_capsule 등 추가 예정)
ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_game_type_check;

ALTER TABLE events
  ADD CONSTRAINT events_game_type_check
  CHECK (game_type IN ('claw_machine'));

-- 기존 이벤트는 자동으로 'claw_machine'으로 채워짐 (DEFAULT 적용)
-- GRANT 확인
GRANT SELECT, UPDATE ON events TO service_role;
