export type GamePhase = 'start' | 'play' | 'result' | 'verification_cta'

export type PrizeTier = 'miss' | 'small' | 'big'

export interface CouponInfo {
  id: string
  status: 'issued' | 'pending_verify'
  issuedAt: string
  validUntil: string
}

export interface PrizeResult {
  tier: PrizeTier
  label: string
  amount: number
  /** true면 매장 방문 전 별도 인증 절차가 필요한 고액 경품 (예: 당근 단골 인증) */
  requiresVerification: boolean
  /** 당첨(꽝 제외)이고 서버에서 쿠폰이 발급된 경우에만 존재. 데모 모드에서는 없음. */
  coupon?: CouponInfo
}
