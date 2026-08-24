export type CouponValidityType = 'fixed_date' | 'relative_days'

/**
 * 발급 시각(issuedAt) 기준으로 쿠폰 만료 시각(valid_until)을 계산한다.
 * - relative_days: 발급일로부터 validityValue일 후 (같은 시각)
 * - fixed_date: validityValue 날짜(YYYY-MM-DD)의 23:59:59.
 *   이벤트 등록 폼(NewEventForm/EditEventForm)의 "고정 날짜" 옵션은 시작일과 종료일을
 *   입력받아 `"시작일~종료일"` 형태의 문자열로 저장한다 — 여기서는 만료 시각 계산에
 *   필요한 종료일(마지막 `~` 뒤 부분)만 사용한다. 시작일은 표시용일 뿐 만료 계산에는
 *   쓰이지 않는다. 단일 날짜(`YYYY-MM-DD`)만 저장된 경우도 그대로 지원한다.
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

  const endDatePart = validityValue.includes('~')
    ? validityValue.split('~').pop()!.trim()
    : validityValue.trim()

  const fixed = new Date(`${endDatePart}T23:59:59`)
  if (Number.isNaN(fixed.getTime())) {
    throw new Error(`coupon_validity_value가 올바른 날짜가 아닙니다: ${validityValue}`)
  }
  return fixed
}
