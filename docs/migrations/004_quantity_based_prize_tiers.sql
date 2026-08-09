-- ============================================================
-- 004. prize_tiers: 확률(%) 직접입력 → 수량 기반 자동계산으로 전환
-- 날짜: 2026-08-09
-- 실행 위치: Supabase 대시보드 → SQL Editor
-- ============================================================
--
-- 배경: probability_percent를 그대로 게임마다의 추첨 가중치로 썼는데,
-- 재고가 줄어들수록 확률이 계속 흔들리는 문제가 있어서 방식을 바꾼다.
--   - 확률은 "이벤트 설정 시점"에 한 번만 계산해서 prize_tiers.computed_probability에
--     고정 저장한다 (게임 진행 중에는 재계산하지 않음)
--   - remaining_quantity는 오직 "품절 시 꽝으로 강제 전환"하는 안전장치 + 소진 카운터로만 쓴다
--
-- computed_probability 계산 공식:
--   예상 참여자 수 = expected_daily_participants × 이벤트 기간(일)
--   티어 확률(%) = tier.total_quantity ÷ 예상 참여자 수 × 100

-- 1. events: 예상 참여자 수 컬럼 추가 (확률 계산 입력값, 사장님이 입력하는 콜드스타트 추측값)
alter table events add column if not exists expected_daily_participants integer;

-- 2. prize_tiers: 확률(%) 직접입력 컬럼 삭제, 수량 기반 컬럼으로 교체
alter table prize_tiers drop column if exists probability_percent;
alter table prize_tiers add column if not exists total_quantity integer not null default 0;
alter table prize_tiers add column if not exists remaining_quantity integer not null default 0;
alter table prize_tiers add column if not exists computed_probability numeric(6, 3) not null default 0;

-- 3. tier_usage_counters: 일/주/월 한도 개념을 수량 기반으로 통합했으므로 더 이상 불필요
drop table if exists tier_usage_counters;

-- 4. 테스트 이벤트(test-store-001) 예상 참여자 수 설정 — 20명/일
update events
set expected_daily_participants = 20
where store_id = 'test-store-001' and status = 'active';

-- 5. 기존 시드(확률 직접입력 방식) 삭제 후 수량 기반으로 재시딩
--    예상 참여자 수 = 20명/일 × 30일(2026-08-01~08-31) = 600명
--    computed_probability = total_quantity ÷ 600 × 100
delete from prize_tiers
where event_id in (
  select id from events where store_id = 'test-store-001' and status = 'active'
);

insert into prize_tiers
  (event_id, label, amount, total_quantity, remaining_quantity, computed_probability, requires_verification)
select id, '꽝', 0, 300, 300, round(300.0 / 600 * 100, 3), false
from events where store_id = 'test-store-001' and status = 'active'
union all
select id, '1,000원권', 1000, 150, 150, round(150.0 / 600 * 100, 3), false
from events where store_id = 'test-store-001' and status = 'active'
union all
select id, '10,000원권', 10000, 100, 100, round(100.0 / 600 * 100, 3), true
from events where store_id = 'test-store-001' and status = 'active';

-- 6. 확인용 쿼리
select label, amount, total_quantity, remaining_quantity, computed_probability, requires_verification
from prize_tiers
order by computed_probability desc;
