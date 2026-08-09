-- ============================================================
-- 006. coupons 테이블 추가 (게임 당첨분 source_type='game_win'만 다룸)
-- 날짜: 2026-08-09
-- 실행 위치: Supabase 대시보드 → SQL Editor
-- ============================================================
--
-- 참고: 지시문의 `game_event_id`는 생략했다. 이 프로젝트엔 아직 "게임 플레이 세션"
-- 테이블이 없어서(daily_participation_log는 하루 1회 체크용일 뿐 개별 플레이 기록이
-- 아님) 참조할 대상이 없다. event_id 하나만 쓴다.
-- 대신 지시문에 없던 kakao_user_id를 추가했다 — 이게 없으면 나중에 "내 쿠폰함"
-- 조회 API를 만들 때 누구 쿠폰인지 찾을 방법이 없다.

-- 1. events: 쿠폰 유효기간 설정
alter table events add column if not exists coupon_validity_type text
  check (coupon_validity_type in ('fixed_date', 'relative_days'));
alter table events add column if not exists coupon_validity_value text;

update events
set coupon_validity_type = 'relative_days', coupon_validity_value = '14'
where store_id = 'test-store-001' and status = 'active';

-- 2. coupons 테이블
create table if not exists coupons (
  id uuid default gen_random_uuid() primary key,
  event_id uuid not null references events(id) on delete cascade,
  kakao_user_id text not null,
  store_id text not null,
  amount integer not null,
  source_type text not null default 'game_win' check (source_type = 'game_win'),
  requires_verification boolean not null default false,
  status text not null default 'issued'
    check (status in ('issued', 'pending_verify', 'used', 'expired', 'unverified')),
  issued_at timestamptz not null default now(),
  valid_until timestamptz not null,
  used_at timestamptz,
  verified_by_staff_id uuid,
  unverified_reason text
);

-- 3. RLS 비활성화 + service_role GRANT (지금까지와 동일한 개발 단계 원칙)
alter table coupons disable row level security;
grant select, insert, update, delete on public.coupons to service_role;

-- 4. 확인용 쿼리
select coupon_validity_type, coupon_validity_value
from events
where store_id = 'test-store-001' and status = 'active';
