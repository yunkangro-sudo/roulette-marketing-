/** 전화번호를 뒷 4자리만 남기고 마스킹한다. 관리자 화면에 절대 평문 전화번호를 노출하지 않기 위한 공통 유틸. */
export function maskPhoneLast4(phone: string | null | undefined): string {
  if (!phone) return '-'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '****'
  return `***-****-${digits.slice(-4)}`
}
