import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getEffectiveStatus } from '@/lib/coupons/getEffectiveStatus'

/**
 * POST /api/coupons/use — 인증 불필요(requires_verification=false) 쿠폰 즉시 사용 처리.
 * body: { coupon_id }
 * status='issued'일 때만 처리 가능 ('issued' → 'used').
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const couponId = body?.coupon_id

  if (!couponId) {
    return NextResponse.json({ error: 'coupon_id가 필요합니다' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: coupon, error: fetchError } = await supabase
    .from('coupons')
    .select('id, status, requires_verification, valid_until')
    .eq('id', couponId)
    .maybeSingle()

  if (fetchError || !coupon) {
    return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다' }, { status: 404 })
  }

  if (coupon.requires_verification) {
    return NextResponse.json(
      { error: '이 쿠폰은 인증이 필요합니다. 확인/미확인 처리(/api/coupons/verify)를 이용해주세요' },
      { status: 400 }
    )
  }

  const effectiveStatus = getEffectiveStatus(coupon)

  if (effectiveStatus === 'expired') {
    return NextResponse.json({ error: '사용기간이 지난 쿠폰입니다' }, { status: 409 })
  }

  if (effectiveStatus === 'used') {
    return NextResponse.json({ error: '이미 사용된 쿠폰입니다' }, { status: 409 })
  }

  if (effectiveStatus !== 'issued') {
    return NextResponse.json(
      { error: `현재 상태(${effectiveStatus})에서는 사용 처리할 수 없습니다` },
      { status: 409 }
    )
  }

  const { data: updated, error: updateError } = await supabase
    .from('coupons')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('id', couponId)
    .select('id, status, used_at')
    .single()

  if (updateError) {
    console.error('[api/coupons/use] 상태 변경 실패:', updateError)
    return NextResponse.json({ error: '쿠폰 상태 변경 중 오류가 발생했습니다' }, { status: 500 })
  }

  return NextResponse.json({ coupon: updated })
}
