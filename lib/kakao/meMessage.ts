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
  /** 매장의 당근마켓 비즈프로필 URL. 없으면 후기 버튼을 넣지 않는다 */
  daangnUrl?:   string | null
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

  // text 템플릿은 buttons 배열로 최대 2개까지 버튼을 지정할 수 있다.
  // ⚠️ 카카오 기본 템플릿의 웹 링크는 [앱 관리 > 제품 링크 관리]에 등록된
  // 도메인만 허용된다. daangn.com은 등록할 수 없는 외부 도메인이라
  // 버튼에 직접 넣으면 메시지 발송 전체가 실패한다(카카오 API가 거부).
  // 그래서 항상 우리 도메인의 리다이렉트 경로(/api/go/daangn)로 연결하고,
  // 서버에서 실제 당근 URL로 302 리다이렉트한다.
  // 당근 URL이 없는 매장(daangn_url 미설정)은 기존과 동일하게 버튼 1개만 노출한다.
  const daangnUrl = payload.daangnUrl?.trim() || null
  const daangnRedirectUrl = daangnUrl
    ? `${appUrl}/api/go/daangn?store=${encodeURIComponent(payload.storeId)}`
    : null
  const buttons = [
    { title: '매장에서 사용하기', link: { web_url: playUrl, mobile_web_url: playUrl } },
    ...(daangnRedirectUrl
      ? [{ title: '당근마켓 후기 남기고 쿠폰받기', link: { web_url: daangnRedirectUrl, mobile_web_url: daangnRedirectUrl } }]
      : []),
  ]

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
    buttons,
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
