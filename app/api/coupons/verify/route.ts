import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const VALID_REASONS = ['앱없음', '거부', '기타']

/**
 * POST /api/coupons/verify — 인증 필요(requires_verification=true) 쿠폰 전용.
 * body: { coupon_id, action: 'confirm' | 'unverified', reason?: '앱없음'|'거부'|'기타' }
 *
 * status='pending_verify' 또는 'unverified'(재시도)일 때만 처리 가능.
 * unverified는 재시도 무제한 — 다시 pending_verify/unverified 상태로 조회하면
 * 화면에서 다시 confirm/unverified 버튼이 노출된다.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const couponId = body?.coupon_id
  const action = body?.action
  const reason = body?.reason

  if (!couponId || (action !== 'confirm' && action !== 'unverified')) {
    return NextResponse.json(
      { error: 'coupon_id와 action(confirm 또는 unverified)이 필요합니다' },
      { status: 400 }
    )
  }

  if (action === 'unverified' && !VALID_REASONS.includes(reason)) {
    return NextResponse.json(
      { error: `unverified 처리 시 reason은 ${VALID_REASONS.join('/')} 중 하나여야 합니다` },
      { status: 400 }
    )
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

  if (!coupon.requires_verification) {
    return NextResponse.json(
      { error: '이 쿠폰은 인증이 필요하지 않습니다. 사용 처리(/api/coupons/use)를 이용해주세요' },
      { status: 400 }
    )
  }

  if (coupon.status === 'used') {
    return NextResponse.json({ error: '이미 사용된 쿠폰입니다' }, { status: 409 })
  }

  if (coupon.status !== 'pending_verify' && coupon.status !== 'unverified') {
    return NextResponse.json(
      { error: `현재 상태(${coupon.status})에서는 처리할 수 없습니다` },
      { status: 409 }
    )
  }

  if (new Date(coupon.valid_until) < new Date()) {
    return NextResponse.json({ error: '사용기간이 지난 쿠폰입니다' }, { status: 409 })
  }

  const update =
    action === 'confirm'
      ? { status: 'used', used_at: new Date().toISOString(), unverified_reason: null }
      : { status: 'unverified', unverified_reason: reason }

  const { data: updated, error: updateError } = await supabase
    .from('coupons')
    .update(update)
    .eq('id', couponId)
    .select('id, status, unverified_reason, used_at')
    .single()

  if (updateError) {
    console.error('[api/coupons/verify] 상태 변경 실패:', updateError)
    return NextResponse.json({ error: '쿠폰 상태 변경 중 오류가 발생했습니다' }, { status: 500 })
  }

  return NextResponse.json({ coupon: updated })
}
