-- ============================================================
-- Migration 011: 이벤트 상태 변경 이력 테이블
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS event_status_changes (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id         uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  store_id         text        NOT NULL,
  changed_by       uuid        NOT NULL REFERENCES store_accounts(id),
  previous_status  text        NOT NULL,
  new_status       text        NOT NULL,
  changed_at       timestamptz DEFAULT now()
);

ALTER TABLE event_status_changes DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON event_status_changes TO service_role;

CREATE INDEX IF NOT EXISTS idx_esc_event_id  ON event_status_changes(event_id);
CREATE INDEX IF NOT EXISTS idx_esc_store_id  ON event_status_changes(store_id);
