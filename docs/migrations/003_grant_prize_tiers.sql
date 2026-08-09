-- ============================================================
-- 003. prize_tiers / tier_usage_counters 권한(GRANT) 추가
-- 날짜: 2026-08-09
-- 실행 위치: Supabase 대시보드 → SQL Editor
-- ============================================================
--
-- 문제: 002에서 테이블을 만들고 RLS는 비활성화했지만, service_role에 대한
-- 테이블 GRANT가 없어서 /api/games/play가 아래 에러로 실패함:
--
--   permission denied for table prize_tiers
--   hint: Grant the required privileges to the current role with:
--         GRANT SELECT ON public.prize_tiers TO service_role;
--
-- RLS(행 단위 보안)와 GRANT(테이블 단위 권한)는 서로 다른 개념이라
-- RLS를 비활성화해도 GRANT가 없으면 여전히 접근이 막힌다.
-- (참고: 2단계에서 daily_participation_log/events도 같은 이유로 GRANT를 추가한 적 있음)

grant select, insert, update, delete on public.prize_tiers to service_role;
grant select, insert, update, delete on public.tier_usage_counters to service_role;
