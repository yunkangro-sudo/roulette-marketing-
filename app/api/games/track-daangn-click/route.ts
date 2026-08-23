/**
 * POST /api/games/track-daangn-click
 * "당근에서 단골 추가하기" 버튼 클릭 로그. 클릭 시점만 기록하며
 * 실제 당근 단골 등록 완료 여부는 확인하지 않는다 (당근 쪽 API 미제공).
 * 실패해도 손님 화면에는 절대 영향 주지 않는다 (silent fail, fire-and-forget 호출 전제).
 */
import { NextResponse } from 'next/server'
import { getCustomerSession } from '@/lib/auth/session'
import { logActivity } from '@/lib/activity/log'

export async function POST() {
  try {
    const session = await getCustomerSession()
    const kakaoUserId = session.user?.kakao_user_id
    const storeId = session.user?.storeId
    if (kakaoUserId && storeId) {
      logActivity({ storeId, kakaoUserId, eventType: 'daangn_click' }).catch(() => {})
    }
  } catch {
    // silent
  }
  return NextResponse.json({ ok: true })
}
