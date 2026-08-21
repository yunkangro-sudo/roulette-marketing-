-- ============================================================
-- Migration 032: coupons에 실제 품목명(label) 저장
-- 실행 위치: Supabase Dashboard > SQL Editor (2026-08-21)
-- 이유: coupons 테이블에 금액(amount)만 있고 품목명이 없어서,
--       현금이 아닌 실물 경품(예: 아메리카노, 감자칩, 제니시스 g90처럼
--       amount=0 또는 상징적인 소액만 넣어야 하는 경품)이 당첨돼도
--       직원 계산대 화면 / 손님 쿠폰함에 "100원 쿠폰"처럼 금액만 뜨고
--       실제 품목명이 전혀 보이지 않는 문제가 있었음.
--       이번부터 게임 당첨 시 prize_tiers.label을 coupons.label에도
--       그대로 저장해서, 화면에서 amount 대신 label을 우선 표시한다.
--       (기존 발급된 쿠폰은 label이 NULL이므로, 화면에서는
--        "label ?? `${amount}원 쿠폰`" 형태로 하위호환 처리)
-- ============================================================

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS label text;

GRANT SELECT, INSERT, UPDATE ON coupons TO service_role;
