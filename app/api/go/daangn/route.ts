/**
 * GET /api/go/daangn?store={storeId}
 *
 * 카카오톡 "나에게 보내기" 메시지의 기본 템플릿 버튼은 앱에 등록된
 * 도메인으로만 링크를 걸 수 있어(카카오 정책), daangn.com 같은 외부
 * 도메인을 버튼에 직접 넣으면 메시지 발송 자체가 실패한다.
 * 그래서 버튼은 항상 우리 도메인의 이 경로로 걸고, 여기서 실제
 * 당근 URL로 302 리다이렉트한다.
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
    .select('daangn_url')
    .eq('store_id', storeId)
    .maybeSingle()

  const target = contract?.daangn_url
  if (!target) {
    return NextResponse.redirect(fallback)
  }

  try {
    const session = await getCustomerSession()
    const kakaoUserId = session.user?.kakao_user_id
    if (kakaoUserId) {
      logActivity({ storeId, kakaoUserId, eventType: 'daangn_click' }).catch(() => {})
    }
  } catch {
    // silent — 클릭 로그 실패가 리다이렉트를 막으면 안 된다
  }

  return NextResponse.redirect(target)
}
