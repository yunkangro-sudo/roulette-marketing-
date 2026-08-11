-- ============================================================
-- 007. payment_logs + store_settings 테이블 추가
-- 날짜: 2026-08-11
-- 목적: 계산대 실결제금액 기록 + 매장 설정(광고비/객단가) 저장
-- 실행 위치: Supabase 대시보드 → SQL Editor → 전체 실행
-- ============================================================

-- 1. payment_logs 테이블
create table if not exists payment_logs (
  id             uuid         default gen_random_uuid() primary key,
  coupon_id      uuid         references coupons(id) on delete set null,  -- nullable (소액쿠폰도 기록 가능)
  store_id       text         not null,
  kakao_user_id  text         not null,
  amount         integer      not null check (amount > 0),
  recorded_at    timestamptz  not null default now()
);

-- 2. store_settings 테이블 (매장별 광고비·객단가 설정)
create table if not exists store_settings (
  store_id            text     primary key,
  store_name          text,
  monthly_ad_budget   integer  default 0,    -- 월 광고비 (원)
  average_order_value integer  default 0,    -- 평균 객단가 (원) — 추정치 계산에 사용
  updated_at          timestamptz not null default now()
);

-- 3. RLS 비활성화 (개발 단계 — 배포 전 반드시 활성화 예정)
alter table payment_logs   disable row level security;
alter table store_settings disable row level security;

-- 4. service_role GRANT
grant select, insert, update, delete on public.payment_logs   to service_role;
grant select, insert, update, delete on public.store_settings to service_role;
grant select on public.payment_logs   to anon;
grant select on public.store_settings to anon;

-- 5. 테스트용 시드 데이터
insert into store_settings (store_id, store_name, monthly_ad_budget, average_order_value)
values ('test-store-001', '8월 테스트 매장', 100000, 15000)
on conflict (store_id) do update
  set store_name          = excluded.store_name,
      monthly_ad_budget   = excluded.monthly_ad_budget,
      average_order_value = excluded.average_order_value,
      updated_at          = now();

-- 6. 확인용
select * from store_settings;
select count(*) as payment_count from payment_logs;
