/**
 * 임시 가짜 로그인 모듈 — 카카오 SDK 연결 전까지 사용
 *
 * 교체 방법 (3단계):
 * 1. 이 파일의 login() 함수 내부만 카카오 OAuth 호출로 교체
 * 2. MockUser 타입을 실제 카카오 프로필 구조에 맞게 수정
 * 3. 나머지 화면 코드는 수정 불필요
 */

export interface MockUser {
  kakao_user_id: string
  nickname: string
}

const STORAGE_KEY = 'mock_kakao_user'

/** 현재 로그인된 사용자 반환 (없으면 null) */
export function getCurrentUser(): MockUser | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as MockUser) : null
  } catch {
    return null
  }
}

/** 가짜 로그인 — kakao_user_id를 세션에 저장 */
export function login(kakaoUserId: string): MockUser {
  const user: MockUser = {
    kakao_user_id: kakaoUserId.trim(),
    nickname: `테스트유저_${kakaoUserId.trim()}`,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  return user
}

/** 로그아웃 */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/*
 * TODO (3단계): 아래 함수를 실제 카카오 OAuth로 교체
 *
 * export async function loginWithKakao(): Promise<MockUser> {
 *   const { code } = await redirectToKakaoAuth()
 *   const token = await exchangeCodeForToken(code)
 *   const profile = await fetchKakaoProfile(token)
 *   return { kakao_user_id: String(profile.id), nickname: profile.properties.nickname }
 * }
 */
