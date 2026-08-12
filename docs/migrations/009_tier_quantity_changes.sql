-- ============================================================
-- Migration 009: 경품 티어 수량 변경 이력 테이블
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS tier_quantity_changes (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  prize_tier_id uuid        NOT NULL REFERENCES prize_tiers(id) ON DELETE CASCADE,
  event_id      uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  store_id      text        NOT NULL,
  changed_by    uuid        NOT NULL REFERENCES store_accounts(id),
  previous_quantity  integer NOT NULL,
  new_quantity       integer NOT NULL,
  changed_at    timestamptz DEFAULT now()
);

-- RLS 비활성화 (서비스 롤로만 접근)
ALTER TABLE tier_quantity_changes DISABLE ROW LEVEL SECURITY;

-- 서비스 롤 권한
GRANT SELECT, INSERT ON tier_quantity_changes TO service_role;

-- 조회 성능용 인덱스
CREATE INDEX IF NOT EXISTS idx_tqc_prize_tier_id ON tier_quantity_changes(prize_tier_id);
CREATE INDEX IF NOT EXISTS idx_tqc_event_id       ON tier_quantity_changes(event_id);
CREATE INDEX IF NOT EXISTS idx_tqc_store_id        ON tier_quantity_changes(store_id);
