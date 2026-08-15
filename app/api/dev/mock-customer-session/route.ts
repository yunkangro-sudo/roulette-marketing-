/**
 * POST /api/dev/mock-customer-session
 * 개발용: 카카오 없이 손님 세션만 심는다. pendingPlay는 유지한다.
 * 프로덕션에서는 404.
 */
import { NextResponse } from 'next/server'
import { getCustomerSession } from '@/lib/auth/session'

export async function POST(request: Request) {
  // TEMP: 카카오 심사 대기용 임시 우회 - 심사 승인 후 제거
  const reviewPending = process.env.NEXT_PUBLIC_KAKAO_REVIEW_PENDING === 'true'
  if (process.env.NODE_ENV === 'production' && !reviewPending) {
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
