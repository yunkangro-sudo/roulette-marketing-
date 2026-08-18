import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCustomerSession } from '@/lib/auth/session'
import { getEffectiveStatus } from '@/lib/coupons/getEffectiveStatus'

/**
 * GET /api/me/coupons/[couponId]
 *
 * 쿠폰함 상세 화면용 단건 조회. 세션의 kakao_user_id와 쿠폰 소유자가
 * 일치하는 경우에만 조회를 허용한다 (본인 쿠폰만 볼 수 있도록).
 */
export async function GET(
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
    .select('id, store_id, kakao_user_id, amount, status, short_code, issued_at, valid_until, used_at')
    .eq('id', couponId)
    .maybeSingle()

  if (error || !coupon) {
    return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다' }, { status: 404 })
  }
  if (coupon.kakao_user_id !== kakaoUserId) {
    return NextResponse.json({ error: '본인의 쿠폰만 확인할 수 있습니다' }, { status: 403 })
  }

  const { data: store } = await supabase
    .from('store_settings')
    .select('store_name')
    .eq('store_id', coupon.store_id)
    .maybeSingle()

  return NextResponse.json({
    coupon: {
      id: coupon.id,
      storeId: coupon.store_id,
      storeName: store?.store_name ?? coupon.store_id,
      amount: coupon.amount,
      shortCode: coupon.short_code,
      issuedAt: coupon.issued_at,
      validUntil: coupon.valid_until,
      usedAt: coupon.used_at,
      status: getEffectiveStatus(coupon),
    },
  })
}
