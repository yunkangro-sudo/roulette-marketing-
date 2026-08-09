-- ============================================================
-- 002. prize_tiers / tier_usage_counters 테이블 추가 + 테스트 시드
-- 날짜: 2026-08-09
-- 실행 위치: Supabase 대시보드 → SQL Editor
-- ============================================================
--
-- 배경: 3단계(게임 결과 서버 확정) 작업. /api/games/play가 이 테이블에서
-- 확률(probability_percent)을 읽어 서버에서 가중 랜덤 추첨을 한다.
--
-- tier_usage_counters는 이번 단계에서는 테이블만 만들고 로직은 아직 안 쓴다.
-- 일/주/월 한도 체크는 관리자 화면과 함께 다음 단계에서 붙일 예정.

-- 1. prize_tiers — 이벤트별 경품 등급
create table if not exists prize_tiers (
  id uuid default gen_random_uuid() primary key,
  event_id uuid not null references events(id) on delete cascade,
  label text not null,
  amount integer not null default 0,
  probability_percent numeric(5,2) not null
    check (probability_percent >= 0 and probability_percent <= 100),
  requires_verification boolean not null default false,
  created_at timestamptz default now()
);

-- 2. tier_usage_counters — 기간별 사용 카운터 (다음 단계에서 한도 체크용으로 사용 예정)
create table if not exists tier_usage_counters (
  id uuid default gen_random_uuid() primary key,
  tier_id uuid not null references prize_tiers(id) on delete cascade,
  period_type text not null check (period_type in ('daily', 'weekly', 'monthly')),
  period_key text not null, -- 예: daily='2026-08-09', weekly='2026-W32', monthly='2026-08'
  used_count integer not null default 0,
  unique (tier_id, period_type, period_key)
);

-- 3. RLS 비활성화 (개발 단계 — 001과 동일 원칙, 배포 전 반드시 재검토)
alter table prize_tiers disable row level security;
alter table tier_usage_counters disable row level security;

-- 4. 시드 데이터 — test-store-001의 active 이벤트에 경품 3종 등록
--    꽝 50% / 1,000원권 30% (인증 불필요) / 10,000원권 20% (방문 전 인증 필요)
insert into prize_tiers (event_id, label, amount, probability_percent, requires_verification)
select id, '꽝', 0, 50, false
from events where store_id = 'test-store-001' and status = 'active'
union all
select id, '1,000원권', 1000, 30, false
from events where store_id = 'test-store-001' and status = 'active'
union all
select id, '10,000원권', 10000, 20, true
from events where store_id = 'test-store-001' and status = 'active';

-- 5. 확인용 쿼리
select id, label, amount, probability_percent, requires_verification
from prize_tiers
order by probability_percent desc;
