/**
 * 카카오 "나에게 보내기" API
 *
 * 손님 본인의 카카오 OAuth access_token을 사용해
 * 쿠폰 발급 내용을 손님 카카오톡으로 직접 발송한다.
 *
 * - 엔드포인트: POST https://kapi.kakao.com/v2/api/talk/memo/default/send
 * - scope 필요: talk_message
 * - 발송 실패는 항상 silent fail (쿠폰 발급에 영향 없음)
 */

const KAKAO_ME_MSG_URL = 'https://kapi.kakao.com/v2/api/talk/memo/default/send'

export interface CouponMsgPayload {
  storeName:    string
  shortCode:    string
  amount:       number
  label:        string
  validUntil:   string | null
  storeId:      string
}

/**
 * 손님 본인 카카오톡으로 쿠폰 안내 메시지 발송
 * @returns true=성공, false=실패(silent)
 */
export async function sendMeMessage(
  accessToken: string,
  payload: CouponMsgPayload,
): Promise<boolean> {
  if (!accessToken) return false

  const appUrl   = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://roulette-marketing.vercel.app').trim()
  const playUrl  = `${appUrl}/play/${payload.storeId}`
  const validStr = payload.validUntil
    ? new Date(payload.validUntil).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '기간 제한 없음'

  const templateObject = {
    object_type: 'text',
    text: [
      `🎁 ${payload.storeName} 쿠폰 발급 안내`,
      ``,
      `${payload.label} ${payload.amount.toLocaleString()}원 쿠폰이 발급되었습니다.`,
      ``,
      `📌 쿠폰 코드: ${payload.shortCode}`,
      `📅 사용 기간: ~${validStr}`,
      ``,
      `매장에서 직원에게 이 코드를 보여주세요.`,
    ].join('\n'),
    link: {
      web_url:        playUrl,
      mobile_web_url: playUrl,
    },
    button_title: '매장에서 사용하기',
  }

  try {
    const body = new URLSearchParams({
      template_object: JSON.stringify(templateObject),
    })

    const res = await fetch(KAKAO_ME_MSG_URL, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('[meMessage] 카카오 나에게 보내기 실패:', err)
      return false
    }

    console.log('[meMessage] 카카오 나에게 보내기 성공:', payload.shortCode)
    return true
  } catch (err) {
    console.warn('[meMessage] 카카오 나에게 보내기 예외 (무시):', err)
    return false
  }
}
