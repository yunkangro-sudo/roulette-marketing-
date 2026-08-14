export type CouponStatus = 'issued' | 'pending_verify' | 'pending_apply' | 'used' | 'expired' | 'unverified'

export interface CouponForStatusCheck {
  status: CouponStatus
  valid_until: string | Date
}

/**
 * 쿠폰의 "실제 유효 상태"를 계산하는 단일 진실 소스.
 *
 * 만료 배치/크론 작업이 없어 DB의 status 컬럼은 사용기간이 지나도 계속
 * issued/pending_verify/unverified로 남아있다 (이번 프로젝트 규모에서는
 * 배치 작업 대신 조회 시점에 계산하는 방식을 택함 — docs/당근인형뽑기_게임설계도.md
 * 6.2절 참고). 그래서 "진짜 지금 이 쿠폰을 어떻게 취급해야 하는지"는
 * status 컬럼만 보면 안 되고 valid_until과 함께 판단해야 한다.
 *
 * 우선순위:
 * 1. status가 이미 'used' 또는 'expired'면 그대로 신뢰한다 (되돌릴 수 없는 확정 상태).
 * 2. 그 외 상태(issued/pending_verify/pending_apply/unverified)인데 valid_until이 지났으면 'expired'로 간주한다.
 * 3. 그 외에는 DB status를 그대로 사용한다.
 *
 * 이 함수는 /staff 계산대 화면의 쿠폰 조회(GET /api/coupons/lookup)뿐 아니라,
 * 6~7단계에서 만들 관리자 대시보드의 쿠폰 현황 리스트/상태별 필터링에서도
 * 그대로 재사용해야 한다 — 만료 판정 로직이 여러 곳에서 각자 계산되면
 * 화면마다 판정이 어긋날 수 있으므로, 반드시 이 함수 하나만 거치도록 한다.
 */
export function getEffectiveStatus(coupon: CouponForStatusCheck): CouponStatus {
  if (coupon.status === 'used' || coupon.status === 'expired') {
    return coupon.status
  }

  if (new Date(coupon.valid_until) < new Date()) {
    return 'expired'
  }

  return coupon.status
}
