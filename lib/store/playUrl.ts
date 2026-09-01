/**
 * 매장 고정 손님 참여 URL(=QR코드가 가리키는 주소) 생성.
 *
 * storeId 하나로 완전히 결정되는 순수 함수라 DB에 저장하지 않는다.
 * /play/[storeId] 라우트가 항상 "현재 활성 이벤트"를 조회하므로, 이벤트가
 * 몇 번을 바뀌어도 이 URL 자체는 절대 바뀌지 않는다.
 */
export function buildPlayUrl(storeId: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.dgting.co.kr').trim().replace(/\/+$/, '')
  return `${appUrl}/play/${storeId}`
}
