-- ============================================================
-- 2단계 테이블 생성 + 시드 데이터
-- Supabase → SQL Editor에서 전체 실행
-- ============================================================

-- 1. events 테이블
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  store_id text not null,
  name text not null,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'active', 'paused', 'ended')),
  display_start_date date,
  display_end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. daily_participation_log 테이블 (unique: 매장 + 유저 + 날짜)
create table if not exists daily_participation_log (
  id uuid default gen_random_uuid() primary key,
  store_id text not null,
  kakao_user_id text not null,
  date date not null,  -- KST 기준 날짜 (YYYY-MM-DD)
  created_at timestamptz default now(),
  unique(store_id, kakao_user_id, date)
);

-- 3. RLS 비활성화 (개발 단계 — 배포 전 반드시 활성화 예정)
alter table events disable row level security;
alter table daily_participation_log disable row level security;

-- 4. 시드 데이터 — active 이벤트 1개
insert into events (store_id, name, status, display_start_date, display_end_date)
values (
  'test-store-001',
  '8월 여름맞이 당근뽑기 이벤트 🥕',
  'active',
  '2026-08-01',
  '2026-08-31'
);

-- 5. 테스트 확인용 쿼리
select * from events;
select * from daily_participation_log;
