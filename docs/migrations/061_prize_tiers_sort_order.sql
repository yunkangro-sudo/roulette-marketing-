-- ============================================================
-- Migration 061: prize_tiers에 관리자 입력 순서(sort_order) 저장
-- 실행 위치: node scripts/apply-migration.mjs docs/migrations/061_prize_tiers_sort_order.sql
-- ============================================================
-- 경품보기 목록이 금액(amount) 순으로 정렬되어, 관리자가 입력한 순서와
-- 손님 화면 순서가 어긋났다. 폼 배열 인덱스를 sort_order로 저장하고
-- 목록은 이 값으로 정렬한다.
-- 기존 행은 created_at(같은 시각이면 id) 기준으로 순서를 채운다.

ALTER TABLE prize_tiers
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY event_id
      ORDER BY created_at ASC, id ASC
    ) - 1 AS rn
  FROM prize_tiers
)
UPDATE prize_tiers t
SET sort_order = ranked.rn
FROM ranked
WHERE t.id = ranked.id;

CREATE INDEX IF NOT EXISTS prize_tiers_event_id_sort_order_idx
  ON prize_tiers (event_id, sort_order);
