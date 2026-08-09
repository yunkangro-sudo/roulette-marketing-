export type CouponValidityType = 'fixed_date' | 'relative_days'

/**
 * 발급 시각(issuedAt) 기준으로 쿠폰 만료 시각(valid_until)을 계산한다.
 * - relative_days: 발급일로부터 validityValue일 후 (같은 시각)
 * - fixed_date: validityValue 날짜(YYYY-MM-DD)의 23:59:59
 */
export function computeValidUntil(
  issuedAt: Date,
  validityType: CouponValidityType,
  validityValue: string
): Date {
  if (validityType === 'relative_days') {
    const days = Number(validityValue)
    if (!Number.isFinite(days)) {
      throw new Error(`coupon_validity_value가 숫자가 아닙니다: ${validityValue}`)
    }
    const result = new Date(issuedAt.getTime())
    result.setDate(result.getDate() + days)
    return result
  }

  const fixed = new Date(`${validityValue}T23:59:59`)
  if (Number.isNaN(fixed.getTime())) {
    throw new Error(`coupon_validity_value가 올바른 날짜가 아닙니다: ${validityValue}`)
  }
  return fixed
}
