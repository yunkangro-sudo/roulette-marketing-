import type { PrizeResult, PrizeTier } from './types'

/** 서버 응답(amount, requiresVerification)으로 화면 표시용 tier를 판단 */
export function resolveTier(amount: number, requiresVerification: boolean): PrizeTier {
  if (amount <= 0) return 'miss'
  return requiresVerification ? 'big' : 'small'
}

/**
 * 데모 모드(`/game-demo`, event 없이 GameContainer 단독 실행) 전용 로컬 추첨.
 * 실서비스 플로우(`/play/[storeId]`)는 `/api/games/play` 서버 추첨을 사용한다.
 */
export function rollPrize(): PrizeResult {
  const rand = Math.random() * 100

  if (rand < 60) {
    return { tier: 'miss', label: '꽝!', amount: 0, requiresVerification: false }
  }
  if (rand < 80) {
    return { tier: 'small', label: '1,000원 쿠폰', amount: 1000, requiresVerification: false }
  }
  if (rand < 90) {
    return { tier: 'small', label: '2,000원 쿠폰', amount: 2000, requiresVerification: false }
  }
  return { tier: 'big', label: '10,000원 쿠폰', amount: 10000, requiresVerification: true }
}
