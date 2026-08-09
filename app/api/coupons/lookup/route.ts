import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getEffectiveStatus } from '@/lib/coupons/getEffectiveStatus'

/**
 * GET /api/coupons/lookup?code=<coupon.id> — 계산대 화면(/staff)용 쿠폰 상세 조회.
 * 응답의 status는 DB 원본 값이 아니라 getEffectiveStatus()로 계산한 "실제 유효 상태"다
 * (만료 판정을 프론트에서 따로 계산하지 않도록 여기서 이미 반영해서 내려준다).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')?.trim()

  if (!code) {
    return NextResponse.json({ error: '쿠폰 코드를 입력해주세요' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('id, amount, status, requires_verification, issued_at, valid_until, unverified_reason')
    .eq('id', code)
    .maybeSingle()

  if (error) {
    // 코드가 uuid 형식이 아니면 postgres가 22P02(invalid_text_representation)를 반환한다
    if (error.code === '22P02') {
      return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다. 코드를 다시 확인해주세요' }, { status: 404 })
    }
    console.error('[api/coupons/lookup] 조회 실패:', error)
    return NextResponse.json({ error: '쿠폰 조회 중 오류가 발생했습니다' }, { status: 500 })
  }

  if (!coupon) {
    return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다. 코드를 다시 확인해주세요' }, { status: 404 })
  }

  return NextResponse.json({
    coupon: {
      ...coupon,
      status: getEffectiveStatus(coupon),
    },
  })
}
