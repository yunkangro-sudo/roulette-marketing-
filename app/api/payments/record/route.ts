import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/payments/record
 * body: { coupon_id?: string, store_id: string, kakao_user_id: string, amount: number }
 *
 * 계산대에서 직원이 실결제금액을 입력할 때 호출.
 * coupon_id는 nullable — 소액쿠폰(검증불필요) 사용 시에도 기록 가능.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const { coupon_id, store_id, kakao_user_id, amount } = body ?? {}

  if (!store_id || !kakao_user_id || !amount) {
    return NextResponse.json(
      { error: 'store_id, kakao_user_id, amount는 필수입니다' },
      { status: 400 }
    )
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json(
      { error: 'amount는 0보다 큰 숫자여야 합니다' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('payment_logs')
    .insert({
      coupon_id: coupon_id ?? null,
      store_id,
      kakao_user_id,
      amount,
    })
    .select('id, amount, recorded_at')
    .single()

  if (error) {
    console.error('[api/payments/record] 기록 실패:', error)
    return NextResponse.json({ error: '결제금액 기록에 실패했습니다' }, { status: 500 })
  }

  return NextResponse.json({ payment: data })
}
