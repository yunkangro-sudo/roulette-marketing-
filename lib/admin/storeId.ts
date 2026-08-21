/**
 * 회원가입 페이지에서 자동으로 매장 ID를 발급할 때 사용하는 헬퍼.
 *
 * 관리자가 직접 등록할 때는 "store-gangnam-001" 처럼 알아보기 쉬운 ID를 직접 입력하지만,
 * 손님이 스스로 가입할 때는 업체명이 한글이라 그대로 URL에 쓸 수 없으므로
 * 짧은 랜덤 문자열로 대체한다. 손님/광고주에게 노출되는 값이 아니라
 * 내부 식별자(events.store_id, /play/[storeId] 등)로만 쓰인다.
 */
export function generateStoreId(): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `store-${random}`
}
