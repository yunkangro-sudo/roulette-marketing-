-- ============================================================
-- Migration 039: 전체 테이블 RLS(Row-Level Security) 재활성화
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 날짜: 2026-08-25
-- ============================================================
--
-- 배경 (Supabase 보안 어드바이저 경고 대응):
--   Supabase가 "RLS가 꺼져있어 프로젝트 URL만 알면 누구나 테이블 데이터를
--   읽고/수정하고/삭제할 수 있다"는 보안 경고 메일을 보냄.
--
--   실제로 docs/migrations/001~038 전체를 조사한 결과, signup_inquiries
--   1개 테이블을 제외한 전체(25개) 테이블이 RLS가 꺼진 상태였음.
--   원인: 개발 초기(2026-08-09) "permission denied" 에러가 날 때마다
--   정식 해결(정책 추가) 대신 RLS를 꺼버리는 임시방편이 반복됨
--   (001번 마이그레이션 주석에 "배포 전 반드시 재활성화 필요"라고
--   명시되어 있었으나 지금까지 지켜지지 않음).
--
-- 안전성 확인:
--   - 서버 코드(lib/supabase/server.ts)는 전부 SUPABASE_SERVICE_ROLE_KEY 사용
--     → service_role은 Supabase에서 RLS를 항상 우회(BYPASSRLS)하므로
--       이 작업으로 서버 쪽 기능은 전혀 영향받지 않음.
--   - 브라우저(anon key) 전용 클라이언트(lib/supabase/client.ts)는
--     전체 코드베이스에서 실제로 import되어 쓰이는 곳이 없음 (미사용 코드).
--   - 즉 이 작업은 "정책(policy) 없이 RLS만 켜기" = anon/authenticated는
--     완전 차단, service_role(서버)만 계속 정상 동작 → 앱 코드 수정 불필요,
--     기능 회귀 위험 매우 낮음.
--
-- 조치: 아래 테이블 전체에 RLS 활성화 (정책은 추가하지 않음 = 기본 전체 차단)
--
-- ⚠️ 실행 중 수정: tier_usage_counters는 004번 마이그레이션에서
--   이미 DROP된 테이블이라 "relation does not exist" 에러가 발생함 → 목록에서 제외.
--   같은 종류의 사고(문서와 실제 DB 상태 불일치)를 방지하기 위해
--   전체를 `IF EXISTS`로 방어적으로 작성함 (존재하지 않는 테이블은 조용히 건너뜀).
-- ============================================================

ALTER TABLE IF EXISTS events                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_participation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS prize_tiers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coupons                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS store_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS store_accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tier_quantity_changes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS store_contracts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_status_changes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_loyalty        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS point_ledger            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS loyalty_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reward_catalog          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rewards_issued          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS message_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS message_consent         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS missions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mission_progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS churn_risk_alerts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS checkout_queue          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS impersonation_log       ENABLE ROW LEVEL SECURITY;

-- ── 확인용 쿼리: 실행 후 아래를 같이 실행해서 결과를 확인할 것 ──
-- rowsecurity 컬럼이 전부 true(t)로 나와야 정상.
-- (signup_inquiries는 025번 마이그레이션에서 이미 true였음)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
