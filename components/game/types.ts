export type GamePhase = 'start' | 'play' | 'result'

export type PrizeTier = 'miss' | 'small' | 'big'

export interface PrizeResult {
  tier: PrizeTier
  label: string
  amount: number
}
