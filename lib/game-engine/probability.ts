/**
 * 이벤트 확률 계산 — 이벤트 등록/수정 시점에 호출해서 prize_tiers.computed_probability에
 * 저장하는 용도. 게임 진행 중(추첨 시점)에는 재계산하지 않고 저장된 값을 그대로 쓴다.
 *
 * 아직 관리자 화면(4단계)이 없어서 API로 연결되지 않았다.
 * 관리자 화면에서 이벤트 기간·예상 참여자 수·티어 수량을 수정할 때
 * computeTierProbabilities()를 그대로 호출해서 prize_tiers.computed_probability를 갱신하면 된다.
 *
 * 설계 원칙(3.1절): 한 이벤트 내 모든 티어의 확률 합계는 항상 정확히 100%가 되어야 한다.
 * 각 티어를 (quantity ÷ expected_participants)로 독립 계산만 하면 합계가 100%를
 * 보장하지 못하므로(예: 재고가 예상 참여자 수보다 적게 준비된 경우), 반드시
 * 정규화(normalize) 단계를 거쳐야 한다.
 */

/**
 * percent 모드에서 total_quantity를 입력하지 않은 티어에 쓰는 "무제한 재고" 값.
 * applyStockSafetyNet()이 remaining_quantity > 0인 동안은 절대 꽝으로 강제 전환하지
 * 않으므로, 이 값이면 실질적으로 재고 소진 안전장치가 작동하지 않는다.
 */
export const UNLIMITED_TIER_QUANTITY = 999_999_999

/** 예상 참여자 수 = 하루 예상 참여자 수 × 이벤트 기간(일) */
export function computeExpectedParticipants(
  expectedDailyParticipants: number,
  periodDays: number
): number {
  return Math.max(0, expectedDailyParticipants) * Math.max(0, periodDays)
}

/** 정규화 전 원시 확률(%) = 총 준비 수량 ÷ 예상 참여자 수 × 100 (등급 간 합계 보장 안 됨) */
function computeRawTierProbability(totalQuantity: number, expectedParticipants: number): number {
  if (expectedParticipants <= 0) return 0
  return (totalQuantity / expectedParticipants) * 100
}

/** 원시 확률 배열을 합계 100이 되도록 비율 그대로 재조정한다 */
export function normalizeProbabilities(rawProbabilities: number[]): number[] {
  const total = rawProbabilities.reduce((sum, p) => sum + p, 0)
  if (total <= 0) return rawProbabilities.map(() => 0)
  return rawProbabilities.map((p) => Math.round((p / total) * 100 * 1000) / 1000)
}

/**
 * 이벤트의 모든 티어에 대해 (원시 확률 계산 → 정규화)까지 한 번에 처리한다.
 * 반환값 배열은 항상 합계가 정확히 100이다(반올림 오차 제외).
 * `totalQuantities`는 prize_tiers 조회 순서와 1:1로 대응해야 한다.
 */
export function computeTierProbabilities(
  totalQuantities: number[],
  expectedParticipants: number
): number[] {
  const raw = totalQuantities.map((q) => computeRawTierProbability(q, expectedParticipants))
  return normalizeProbabilities(raw)
}
