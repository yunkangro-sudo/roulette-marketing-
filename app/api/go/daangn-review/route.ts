/**
 * GET /api/go/daangn-review?store={storeId}
 *
 * 카카오톡 "나에게 보내기" 메시지의 "당근마켓 후기 남기기" 버튼용 리다이렉트.
 * 카카오 기본 템플릿은 등록된 도메인만 버튼 링크로 허용하므로, 우리 도메인을 거쳐
 * store_contracts.daangn_review_url(후기쓰기 URL)로 302 이동한다.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCustomerSession } from '@/lib/auth/session'
import { logActivity } from '@/lib/activity/log'

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('store')
  const fallback = new URL('/', req.url)

  if (!storeId) {
    return NextResponse.redirect(fallback)
  }

  const supabase = createServerClient()
  const { data: contract } = await supabase
    .from('store_contracts')
    .select('daangn_review_url')
    .eq('store_id', storeId)
    .maybeSingle()

  const target = contract?.daangn_review_url
  if (!target) {
    return NextResponse.redirect(fallback)
  }

  try {
    const session = await getCustomerSession()
    const kakaoUserId = session.user?.kakao_user_id
    if (kakaoUserId) {
      logActivity({ storeId, kakaoUserId, eventType: 'daangn_review_click' }).catch(() => {})
    }
  } catch {
    // silent — 클릭 로그 실패가 리다이렉트를 막으면 안 된다
  }

  return NextResponse.redirect(target)
}
