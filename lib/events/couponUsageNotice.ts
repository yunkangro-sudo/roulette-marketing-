const MAX_LEN = 300

/** 쿠폰함 "리워드 교환" 위에 보여줄 안내문구. 공백만 있으면 저장하지 않는다. */
export function normalizeCouponUsageNotice(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.replace(/\r\n/g, '\n').trim().slice(0, MAX_LEN)
  return trimmed.length > 0 ? trimmed : null
}
