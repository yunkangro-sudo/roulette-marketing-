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
  id:           string
  nickname:     string
  phone_number: string | null
  has_talk_msg: boolean   // talk_message 동의 여부
  has_friends:  boolean   // friends 동의 여부
}

export interface KakaoFriend {
  id:        number
  uuid:      string
  profile_nickname: string
  profile_thumbnail_image?: string
  favorite:  boolean
  app_friend: boolean
}

/** 카카오 로그인 인증 URL 생성 */
export function getKakaoAuthUrl(params: {
  redirectUri: string
  state: string
  requestPhone?: boolean
  requestTalkMsg?: boolean
  requestFriends?: boolean
}): string {
  // 서버사이드(REST API 방식) 인가코드 요청은 REST API 키를 client_id로 써야 한다.
  // JavaScript 키를 쓰면 "REST API 키에 등록된 리다이렉트 URI"와 불일치해 KOE006이 발생한다.
  const clientId = process.env.KAKAO_REST_API_KEY
  if (!clientId) throw new Error('KAKAO_REST_API_KEY가 설정되지 않았습니다')

  const scopes = ['profile_nickname']
  if (params.requestPhone)   scopes.push('phone_number')
  if (params.requestTalkMsg) scopes.push('talk_message')
  if (params.requestFriends) scopes.push('friends')

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
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{ access_token: string; scope?: string }> {
  // 토큰 교환도 인가코드 요청과 동일한 REST API 키를 client_id로 써야 한다 (KOE114 방지).
  const clientId     = process.env.KAKAO_REST_API_KEY!
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
  return { access_token: data.access_token as string, scope: data.scope as string | undefined }
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
    has_talk_msg: false,  // scope 확인은 exchangeCodeForToken 결과로 판단
    has_friends:  false,
  }
}

/** 카카오 친구 목록 조회 (friends scope 필요) */
export async function getKakaoFriends(accessToken: string): Promise<KakaoFriend[]> {
  const res = await fetch(`${KAKAO_API_BASE}/v1/api/talk/friends?limit=100`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`친구 목록 조회 실패: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  return (data.elements ?? []) as KakaoFriend[]
}
