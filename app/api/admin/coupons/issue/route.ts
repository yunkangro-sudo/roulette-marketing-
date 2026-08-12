import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'

/**
 * POST /api/admin/coupons/issue
 * 관리자가 수동으로 쿠폰을 발급합니다.
 * 발급된 쿠폰의 short_code를 응답으로 반환 — 관리자가 손님에게 직접 전달합니다.
 *
 * body: {
 *   store_id,           // 발급 대상 매장
 *   customer_memo,      // 손님 메모 (이름/전화 등 — DB 저장 안 함, 관리자 참고용)
 *   amount,             // 쿠폰 금액 (원)
 *   valid_until,        // 만료일 (ISO 날짜 문자열 "YYYY-MM-DD")
 * }
 */
export async function POST(req: Request) {
  const account = await requireAdminAuth()

  if (!['advertiser', 'super_admin', 'agency'].includes(account.role)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const { store_id, amount, valid_until } = body ?? {}

  if (!store_id) {
    return NextResponse.json({ error: '매장을 선택해주세요' }, { status: 400 })
  }
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: '쿠폰 금액을 올바르게 입력해주세요' }, { status: 400 })
  }
  if (!valid_until) {
    return NextResponse.json({ error: '사용 기한을 선택해주세요' }, { status: 400 })
  }

  // advertiser는 자기 매장만 발급 가능
  if (account.role === 'advertiser' && account.storeId !== store_id) {
    return NextResponse.json({ error: '자신의 매장에만 쿠폰을 발급할 수 있습니다' }, { status: 403 })
  }

  const validUntilDate = new Date(valid_until)
  validUntilDate.setHours(23, 59, 59, 999)

  if (isNaN(validUntilDate.getTime()) || validUntilDate <= new Date()) {
    return NextResponse.json({ error: '만료일은 오늘 이후로 설정해주세요' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: coupon, error } = await supabase
    .from('coupons')
    .insert({
      store_id,
      amount: Number(amount),
      source_type: 'manual',
      status: 'issued',
      requires_verification: false,
      issued_at: new Date().toISOString(),
      valid_until: validUntilDate.toISOString(),
    })
    .select('id, short_code, amount, valid_until')
    .single()

  if (error) {
    console.error('[api/admin/coupons/issue] 쿠폰 발급 실패:', error)
    return NextResponse.json({ error: '쿠폰 발급에 실패했습니다: ' + error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    coupon: {
      id: coupon.id,
      shortCode: coupon.short_code,
      amount: coupon.amount,
      validUntil: coupon.valid_until,
    },
  })
}
