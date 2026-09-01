/**
 * POST /api/checkin/[storeId]
 * NFC 태그 체크인 — 페이지 진입 시 자동 호출됨.
 * 계산대(/staff)와 마찬가지로 이용기간 만료 여부와 무관하게 항상 동작해야 하므로
 * (이미 발급된 방문 적립 권리를 매장 결제 상태 때문에 손님이 못 받는 상황 방지),
 * 이 라우트는 의도적으로 구독 상태를 확인하지 않는다.
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCustomerSession } from '@/lib/auth/session'
import { toKstDateLabel } from '@/lib/admin/dateRange'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params
  const session = await getCustomerSession()
  const kakaoUserId = session.user?.kakao_user_id

  const supabase = createServerClient()
  const { data: contract } = await supabase
    .from('store_contracts')
    .select('store_name')
    .eq('store_id', storeId)
    .maybeSingle()
  const storeName = contract?.store_name ?? storeId

  if (!kakaoUserId) {
    return NextResponse.json({ needLogin: true, storeName }, { status: 401 })
  }

  const todayKst = toKstDateLabel(new Date().toISOString())

  const { data, error } = await supabase.rpc('process_nfc_checkin', {
    p_store_id: storeId,
    p_kakao_user_id: kakaoUserId,
    p_checkin_date: todayKst,
  })

  if (error) {
    console.error('[checkin] process_nfc_checkin 실패:', error)
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다', storeName }, { status: 500 })
  }

  if (!data?.ok) {
    if (data?.error === 'disabled') {
      return NextResponse.json({ disabled: true, storeName })
    }
    if (data?.error === 'already_checked_in') {
      return NextResponse.json({ alreadyCheckedIn: true, storeName })
    }
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다', storeName }, { status: 500 })
  }

  if (data.mode === 'points') {
    return NextResponse.json({
      ok: true,
      mode: 'points',
      pointsAwarded: data.points_awarded,
      storeName,
      storeId,
    })
  }

  return NextResponse.json({
    ok: true,
    mode: 'stamp',
    goalReached: data.goal_reached,
    stampCount: data.stamp_count ?? data.stamp_goal,
    stampGoal: data.stamp_goal,
    couponId: data.coupon_id ?? null,
    rewardIssued: data.reward_issued ?? false,
    storeName,
    storeId,
  })
}
