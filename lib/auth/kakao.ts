/**
 * 카카오 OAuth2 유틸리티
 *
 * 사용 흐름:
 *  1. getKakaoAuthUrl()로 인증 URL 생성 → 사용자 리다이렉트
 *  2. 콜백에서 exchangeCodeForToken()으로 액세스 토큰 획득
 *  3. getKakaoUserProfile()으로 카카오 사용자 정보 조회
 *
 * 전화번호 동의항목은 카카오 비즈앱 심사 후에만 수집 가능.
 * 심사 전에는 phone_number가 null로 내려오므로, null 처리 필수.
 */

const KAKAO_AUTH_BASE = 'https://kauth.kakao.com'
const KAKAO_API_BASE  = 'https://kapi.kakao.com'

export interface KakaoUserProfile {
  id: string                // 카카오 사용자 ID
  nickname: string          // 닉네임
  phone_number: string | null  // 전화번호 (비즈앱 심사 후 수집 가능, 그 전엔 null)
}

/** 카카오 로그인 인증 URL 생성 */
export function getKakaoAuthUrl(params: {
  redirectUri: string
  state: string
  requestPhone?: boolean
}): string {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
  if (!clientId) throw new Error('NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았습니다')

  const scopes = ['profile_nickname']
  if (params.requestPhone) {
    // 비즈앱 심사 통과 후에만 실제로 수집됨
    scopes.push('phone_number')
  }

  const query = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  params.redirectUri,
    response_type: 'code',
    scope:         scopes.join(','),
    state:         params.state,
  })

  return `${KAKAO_AUTH_BASE}/oauth/authorize?${query}`
}

/** Authorization Code → Access Token 교환 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
  const clientId     = process.env.NEXT_PUBLIC_KAKAO_JS_KEY!
  const clientSecret = process.env.KAKAO_CLIENT_SECRET ?? ''

  const body = new URLSearchParams({
    grant_type:   'authorization_code',
    client_id:    clientId,
    redirect_uri: redirectUri,
    code,
    ...(clientSecret ? { client_secret: clientSecret } : {}),
  })

  const res = await fetch(`${KAKAO_AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`카카오 토큰 교환 실패: ${err}`)
  }

  const data = await res.json()
  return data.access_token as string
}

/** 액세스 토큰으로 사용자 프로필 조회 */
export async function getKakaoUserProfile(accessToken: string): Promise<KakaoUserProfile> {
  const res = await fetch(`${KAKAO_API_BASE}/v2/user/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  if (!res.ok) {
    throw new Error('카카오 사용자 정보 조회 실패')
  }

  const data = await res.json()

  // phone_number 형식: "+82 10-1234-5678" (비즈앱 심사 후)
  // 심사 전에는 해당 키 자체가 없거나 null
  const rawPhone: string | undefined = data.kakao_account?.phone_number

  return {
    id:           String(data.id),
    nickname:     data.properties?.nickname ?? data.kakao_account?.profile?.nickname ?? '손님',
    phone_number: rawPhone ?? null,
  }
}
