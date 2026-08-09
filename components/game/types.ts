export type GamePhase = 'start' | 'play' | 'result'

export type PrizeTier = 'miss' | 'small' | 'big'

export interface PrizeResult {
  tier: PrizeTier
  label: string
  amount: number
  /** true면 매장 방문 전 별도 인증 절차가 필요한 고액 경품 (예: 당근 단골 인증) */
  requiresVerification: boolean
}
