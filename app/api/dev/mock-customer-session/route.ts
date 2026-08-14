/**
 * POST /api/dev/mock-customer-session
 * 개발용: 카카오 없이 손님 세션만 심는다. pendingPlay는 유지한다.
 * 프로덕션에서는 404.
 */
import { NextResponse } from 'next/server'
import { getCustomerSession } from '@/lib/auth/session'

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const kakaoUserId = String(body?.kakao_user_id ?? '').trim()
  const storeId = String(body?.storeId ?? body?.store_id ?? '').trim()

  if (!kakaoUserId) {
    return NextResponse.json({ error: 'kakao_user_id가 필요합니다' }, { status: 400 })
  }

  const session = await getCustomerSession()
  session.user = {
    kakao_user_id: kakaoUserId,
    nickname: kakaoUserId,
    storeId,
  }
  await session.save()

  return NextResponse.json({ ok: true, kakao_user_id: kakaoUserId })
}
