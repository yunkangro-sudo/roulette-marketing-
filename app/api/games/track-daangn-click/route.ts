/**
 * POST /api/games/track-daangn-click
 * "당근 단골추가"/"당근·네이버·구글 후기쓰기" 버튼 클릭 로그. 클릭 시점만 기록하며
 * 실제 단골 등록·후기 작성 완료 여부는 확인하지 않는다 (각 플랫폼 쪽 API 미제공).
 * 실패해도 손님 화면에는 절대 영향 주지 않는다 (silent fail, fire-and-forget 호출 전제).
 * 엔드포인트명은 최초 구현("당근") 기준이라 남아있지만, 플랫폼 공용 클릭 로그로 사용한다.
 *
 * body(선택): { eventType?: 'daangn_click' | 'daangn_review_click' | 'naver_review_click' | 'google_review_click' }
 * body가 없거나 값이 허용 목록에 없으면 기존과 동일하게 'daangn_click'으로 기록한다
 * (기존 호출부와 하위 호환 유지).
 */
import { NextResponse } from 'next/server'
import { getCustomerSession } from '@/lib/auth/session'
import { logActivity, type ActivityEventType } from '@/lib/activity/log'

const ALLOWED_EVENT_TYPES: ActivityEventType[] = [
  'daangn_click',
  'daangn_review_click',
  'naver_review_click',
  'google_review_click',
]

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const requested = body?.eventType
    const eventType: ActivityEventType = ALLOWED_EVENT_TYPES.includes(requested)
      ? requested
      : 'daangn_click'

    const session = await getCustomerSession()
    const kakaoUserId = session.user?.kakao_user_id
    const storeId = session.user?.storeId
    if (kakaoUserId && storeId) {
      logActivity({ storeId, kakaoUserId, eventType }).catch(() => {})
    }
  } catch {
    // silent
  }
  return NextResponse.json({ ok: true })
}
