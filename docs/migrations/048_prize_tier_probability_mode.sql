-- ============================================================
-- Migration 048: 경품 티어 확률 직접입력 모드 지원
-- ============================================================
-- 배경: 지금까지는 "총 준비 수량"을 입력하면 (수량 ÷ 예상 참여자 수)로
-- 확률을 자동 계산하는 방식만 있었다. 관리자가 "수량 계산 없이 확률(%)을
-- 직접 입력"하고 싶다는 요청으로, 이벤트별로 두 입력 방식 중 하나를
-- 선택할 수 있게 한다.
--
--   - quantity(기존, 기본값): total_quantity 입력 → computed_probability 자동계산
--   - percent(신규): 관리자가 티어별 확률(%)을 직접 입력 → 정규화해서
--     computed_probability에 그대로 저장 (재고 안전장치를 쓰려면
--     total_quantity를 선택적으로 입력, 비워두면 무제한으로 처리)
--
-- prize_tiers 테이블 구조는 그대로 둔다 (computed_probability가 실제
-- 추첨 가중치라는 원칙은 변하지 않음. 입력 "방식"만 이벤트 단위로 갈린다).

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS prize_tier_mode text NOT NULL DEFAULT 'quantity';

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_prize_tier_mode_check;

ALTER TABLE events
  ADD CONSTRAINT events_prize_tier_mode_check
  CHECK (prize_tier_mode IN ('quantity', 'percent'));

COMMENT ON COLUMN events.prize_tier_mode IS
  '경품 티어 입력 방식. quantity=총 수량 입력→확률 자동계산(기존 방식, 기본값), percent=관리자가 확률(%)을 직접 입력';
