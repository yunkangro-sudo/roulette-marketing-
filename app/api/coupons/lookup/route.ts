import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getEffectiveStatus } from '@/lib/coupons/getEffectiveStatus'

/**
 * GET /api/coupons/lookup?code=<short_code>&store_id=<store_id>
 * 계산대(/staff) 쿠폰 조회. short_code 기반, store_id 필터로 다른 매장 코드 차단.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code    = searchParams.get('code')?.trim().toUpperCase()
  const storeId = searchParams.get('store_id')?.trim()

  if (!code) {
    return NextResponse.json({ error: '쿠폰 코드를 입력해주세요' }, { status: 400 })
  }

  const supabase = createServerClient()

  let query = supabase
    .from('coupons')
    .select('id, short_code, store_id, kakao_user_id, amount, status, requires_verification, issued_at, valid_until, unverified_reason')

  // short_code(8자리) 또는 id(UUID) 모두 허용 (하위 호환)
  if (code.length === 8) {
    query = query.eq('short_code', code)
  } else {
    query = query.eq('id', code)
  }

  const { data: coupon, error } = await query.maybeSingle()

  if (error) {
    if (error.code === '22P02') {
      return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다. 코드를 다시 확인해주세요' }, { status: 404 })
    }
    console.error('[api/coupons/lookup] 조회 실패:', error)
    return NextResponse.json({ error: '쿠폰 조회 중 오류가 발생했습니다' }, { status: 500 })
  }

  if (!coupon) {
    return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다. 코드를 다시 확인해주세요' }, { status: 404 })
  }

  // store_id 필터: 다른 매장 코드 차단
  if (storeId && coupon.store_id !== storeId) {
    return NextResponse.json({ error: '해당 매장의 코드가 아닙니다' }, { status: 403 })
  }

  return NextResponse.json({
    coupon: {
      ...coupon,
      status: getEffectiveStatus(coupon),
    },
  })
}
