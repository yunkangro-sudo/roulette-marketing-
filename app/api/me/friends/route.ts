/**
 * GET /api/me/friends
 * 카카오 친구 목록 조회 (FRIEND API — friends scope 필요)
 *
 * 세션에서 access_token과 hasFriends 플래그를 읽어
 * 카카오 API를 호출하고 결과를 반환한다.
 */

import { NextResponse } from 'next/server'
import { getCustomerSession } from '@/lib/auth/session'
import { getKakaoFriends } from '@/lib/auth/kakao'

export async function GET() {
  const session = await getCustomerSession()

  if (!session.user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { accessToken, hasFriends } = session.user

  if (!accessToken) {
    return NextResponse.json({ error: '카카오 세션이 만료되었습니다. 다시 로그인해주세요.' }, { status: 401 })
  }

  if (!hasFriends) {
    return NextResponse.json(
      { error: '친구 목록 동의가 필요합니다. 카카오 심사 완료 후 이용 가능합니다.', needConsent: true },
      { status: 403 }
    )
  }

  try {
    const friends = await getKakaoFriends(accessToken)
    return NextResponse.json({ friends, count: friends.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
