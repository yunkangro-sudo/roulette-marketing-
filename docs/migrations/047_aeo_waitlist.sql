-- ============================================================
-- Migration 047: aeo_waitlist (AEO마케팅 출시 알림 대기자) 테이블 추가
-- 실행 위치: Supabase Dashboard > SQL Editor
--
-- 배경: 랜딩페이지 요금제 섹션의 "AEO마케팅"(준비중) 카드에서 "출시 알림
--       받기"로 들어오는 리드는 베이직 신청(signup_inquiries)과 성격이
--       다르므로(결제 의사 없음, 단순 대기자 등록) 별도 테이블로 분리한다.
--
-- 접근 방식: 이 테이블은 서버 API 라우트(app/api/aeo-waitlist)에서
--       service_role 키로만 insert된다 (브라우저 anon 키로 직접 접근하는
--       경로 없음). 따라서 025번과 달리 anon/authenticated 정책은 추가하지
--       않고, service_role GRANT만 부여한다 (2026-08-25 보안 사고 이후
--       원칙: 클라이언트 직접 접근이 필요할 때만 최소 권한 정책 추가).
-- ============================================================

CREATE TABLE IF NOT EXISTS aeo_waitlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL,
  phone      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE aeo_waitlist IS 'AEO마케팅(준비중) 출시 알림 대기자 목록 — 랜딩 요금제 섹션 "출시 알림 받기"';

ALTER TABLE aeo_waitlist ENABLE ROW LEVEL SECURITY;

-- service_role(서버 API)만 접근 가능. anon/authenticated 정책 없음 = 전체 차단.
GRANT SELECT, INSERT, UPDATE ON aeo_waitlist TO service_role;
