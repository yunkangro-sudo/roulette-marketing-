-- ============================================================
-- 008. store_accounts 테이블 — 내부 관리자 계정 (이메일+비밀번호)
-- 날짜: 2026-08-12
-- 카카오 손님 로그인(mockLogin)과 완전히 별개인 내부 관리자 전용
-- 실행 위치: Supabase 대시보드 → SQL Editor → 전체 실행
-- ============================================================

create table if not exists store_accounts (
  id            uuid  default gen_random_uuid() primary key,
  store_id      text,          -- nullable: super_admin/agency는 특정 매장에 안 묶임
  email         text  not null unique,
  password_hash text  not null,
  role          text  not null default 'advertiser'
    check (role in ('advertiser', 'staff', 'agency', 'super_admin')),
  created_at    timestamptz not null default now()
);

alter table store_accounts disable row level security;
grant select, insert, update, delete on public.store_accounts to service_role;

-- ============================================================
-- 테스트 계정은 앱 최초 실행 후 아래 URL에서 생성:
-- POST https://[your-domain]/api/admin/auth/setup
-- (계정이 하나도 없을 때만 동작하는 개발용 엔드포인트)
-- ============================================================

select * from store_accounts;
