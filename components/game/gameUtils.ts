import type { PrizeResult } from './types'

export function rollPrize(): PrizeResult {
  const rand = Math.random() * 100

  if (rand < 60) {
    return { tier: 'miss', label: '꽝!', amount: 0 }
  }
  if (rand < 80) {
    return { tier: 'small', label: '1,000원 쿠폰', amount: 1000 }
  }
  if (rand < 90) {
    return { tier: 'small', label: '2,000원 쿠폰', amount: 2000 }
  }
  return { tier: 'big', label: '10,000원 쿠폰', amount: 10000 }
}
