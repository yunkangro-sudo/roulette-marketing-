import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCustomerSession } from '@/lib/auth/session'
import { getEffectiveStatus } from '@/lib/coupons/getEffectiveStatus'
import { logActivity } from '@/lib/activity/log'

/**
 * POST /api/me/coupons/[couponId]/confirm-use
 *
 * 손님 쿠폰함 상세 화면의 [사장님 확인] 버튼용 — 데모 버전 전용 간편 처리.
 * 직원 로그인/PIN 없이, 손님 본인 소유 쿠폰인지만 확인한 뒤 즉시 status를
 * 'used'로 전환한다. (기존 /staff 2단계 확인 플로우를 대체함 — 부정사용
 * 방지 장치는 없으며, 이는 의도된 결정이다.)
 *
 * 리워드 교환 쿠폰(source_type = reward_redemption)의 포인트 차감은 "교환하기"가
 * 아니라 바로 이 순간(사장님 확인)에 일어난다 — confirm_coupon_used_atomic RPC 참고.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ couponId: string }> },
) {
  const { couponId } = await params
  const session = await getCustomerSession()
  const kakaoUserId = session.user?.kakao_user_id
  if (!kakaoUserId) {
    return NextResponse.json({ error: '로그인이 필요합니다', needLogin: true }, { status: 401 })
  }

  const supabase = createServerClient()
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('id, store_id, kakao_user_id, status, valid_until')
    .eq('id', couponId)
    .maybeSingle()

  if (error || !coupon) {
    return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다' }, { status: 404 })
  }
  if (coupon.kakao_user_id !== kakaoUserId) {
    return NextResponse.json({ error: '본인의 쿠폰만 사용 처리할 수 있습니다' }, { status: 403 })
  }

  const effective = getEffectiveStatus(coupon)
  if (effective === 'expired') {
    return NextResponse.json({ error: '사용기간이 지난 쿠폰입니다' }, { status: 409 })
  }
  if (effective === 'used') {
    return NextResponse.json({ error: '이미 사용된 쿠폰입니다' }, { status: 409 })
  }

  const { data: result, error: rpcErr } = await supabase.rpc('confirm_coupon_used_atomic', {
    p_coupon_id: couponId,
    p_expected_status: null,
  })

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 })
  }
  if (!result?.ok) {
    return NextResponse.json({ error: result?.error ?? '처리에 실패했습니다' }, { status: 409 })
  }

  logActivity({
    storeId: coupon.store_id,
    kakaoUserId,
    eventType: 'coupon_used',
    refId: couponId,
    refType: 'coupon',
  }).catch(() => {})

  return NextResponse.json({ ok: true, status: 'used', usedAt: result.used_at })
}
