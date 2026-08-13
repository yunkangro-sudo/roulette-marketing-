-- ============================================================
-- Migration 025: 랜딩페이지 무료 체험 신청 테이블
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS signup_inquiries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name    text NOT NULL,
  owner_name    text NOT NULL,
  phone         text NOT NULL,
  email         text,
  business_type text,
  message       text,
  status        text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'converted', 'declined')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE signup_inquiries IS '랜딩페이지 무료 체험 신청 리드';
COMMENT ON COLUMN signup_inquiries.status IS 'new=신규 / contacted=연락함 / converted=계약전환 / declined=거절';

-- RLS: 조회는 인증된 관리자만 (anon은 INSERT만)
ALTER TABLE signup_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON signup_inquiries
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "auth_all" ON signup_inquiries
  FOR ALL TO authenticated USING (true);
