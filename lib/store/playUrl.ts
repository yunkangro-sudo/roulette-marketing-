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

/**
 * 매장 NFC 방문적립 체크인 URL(=NFC 태그에 쓰는 주소, 보완용 QR코드가 가리키는 주소도 동일)
 *
 * NFC 태그는 결국 "폰이 이 URL을 여는 것"과 동일한 동작이라, 손님 폰의 NFC가 꺼져있거나
 * 태그 자체가 고장났을 때는 같은 URL을 QR코드로 스캔해도 완전히 동일하게 동작한다 —
 * 별도의 체크인 로직/RPC가 필요 없다.
 */
export function buildCheckinUrl(storeId: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.dgting.co.kr').trim().replace(/\/+$/, '')
  return `${appUrl}/checkin/${storeId}`
}
