-- ============================================================
-- 005. computed_probability 정규화 (등급 합계 100% 보장)
-- 날짜: 2026-08-09
-- 실행 위치: Supabase 대시보드 → SQL Editor
-- ============================================================
--
-- 문제: 004에서 각 티어의 computed_probability를
-- (total_quantity ÷ expected_participants × 100)로 "독립적으로" 계산해서 저장했다.
-- 이러면 이벤트당 합계가 100%가 안 될 수 있다 (실제로 91.667%가 나왔었음:
-- 50 + 25 + 16.667 = 91.667). 설계도 3.1절 원칙("확률 합계는 항상 100%로 정규화")을
-- 어긴 것.
--
-- 수정: lib/game-engine/probability.ts에 normalizeProbabilities() 추가 완료.
-- DB에 이미 저장된 값도 정규화해서 맞춰준다.
--
-- 수학적으로, 한 이벤트 안에서는 expected_participants가 모든 티어에 동일하게
-- 적용되므로 (qty ÷ expected_participants) 값들을 정규화하는 것은
-- (qty ÷ 해당 이벤트의 qty 합계)로 정규화하는 것과 정확히 같다. 그래서 아래처럼
-- expected_participants 없이도 total_quantity 합계만으로 정규화할 수 있다.

update prize_tiers t
set computed_probability = round(
  t.total_quantity::numeric / nullif(s.total_qty, 0) * 100,
  3
)
from (
  select event_id, sum(total_quantity) as total_qty
  from prize_tiers
  group by event_id
) s
where t.event_id = s.event_id;

-- 확인용 쿼리 — 이벤트별 합계가 정확히 100인지 확인
select event_id, sum(computed_probability) as probability_sum
from prize_tiers
group by event_id;

select label, amount, total_quantity, remaining_quantity, computed_probability
from prize_tiers
order by computed_probability desc;
