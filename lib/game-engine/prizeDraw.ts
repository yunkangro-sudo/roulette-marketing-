/**
 * 경품 추첨 순수 함수 — 게임 타입과 무관하게 재사용 (크레인/룰렛/스크래치 공통)
 * 서버(API 라우트)에서만 호출한다. 클라이언트는 결과만 받는다.
 *
 * 가중치는 computed_probability(이벤트 설정 시점에 고정 계산된 값)를 쓴다.
 * remaining_quantity를 가중치로 쓰면 재고가 줄어들수록 확률이 계속 흔들리므로 사용하지 않는다.
 * remaining_quantity는 오직 품절 안전장치(applyStockSafetyNet)로만 쓴다.
 */

export interface PrizeTierRow {
  id: string
  label: string
  amount: number
  computed_probability: number
  remaining_quantity: number
  requires_verification: boolean
}

/** computed_probability 가중치 기준으로 하나를 뽑는다 */
export function drawPrizeTier(tiers: PrizeTierRow[]): PrizeTierRow {
  if (tiers.length === 0) {
    throw new Error('추첨할 경품(prize_tiers)이 없습니다')
  }

  const total = tiers.reduce((sum, t) => sum + t.computed_probability, 0)
  if (total <= 0) {
    throw new Error('computed_probability 합계가 0 이하입니다')
  }

  const rand = Math.random() * total
  let cumulative = 0
  for (const tier of tiers) {
    cumulative += tier.computed_probability
    if (rand < cumulative) return tier
  }

  // 부동소수점 누적 오차로 못 걸렸을 경우 마지막 항목으로 폴백
  return tiers[tiers.length - 1]
}

/**
 * 품절 안전장치: 뽑힌 티어의 remaining_quantity가 이미 0이면 꽝 티어로 강제 전환한다.
 * (꽝 티어는 amount === 0으로 식별한다. 이벤트당 꽝 티어는 정확히 1개라고 가정한다.)
 */
export function applyStockSafetyNet(picked: PrizeTierRow, tiers: PrizeTierRow[]): PrizeTierRow {
  if (picked.remaining_quantity > 0) return picked

  const missTier = tiers.find((t) => t.amount === 0)
  return missTier ?? picked // 꽝 티어를 못 찾는 극단적인 경우엔 원래 결과를 그대로 반환
}
