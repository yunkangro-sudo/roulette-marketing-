import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession, getAllowedStoreId } from '@/lib/admin/session'

type Params = { params: Promise<{ id: string }> }

/**
 * PATCH /api/admin/prize-tiers/[id]
 * 경품 티어 수량 증가 전용 (active 이벤트만, 감소 불가)
 *
 * body: { add_quantity: number }  ← 추가할 수량 (양수만 허용)
 */
export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { id: tierId } = await params
  const body = await req.json().catch(() => null)
  const addQuantity = Number(body?.add_quantity)

  if (!addQuantity || addQuantity <= 0 || !Number.isInteger(addQuantity)) {
    return NextResponse.json({ error: '추가 수량은 1 이상의 정수여야 합니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  // 티어 + 이벤트 정보 조회
  const { data: tier } = await supabase
    .from('prize_tiers')
    .select('id, event_id, total_quantity, remaining_quantity, computed_probability, events(id, store_id, status)')
    .eq('id', tierId)
    .single()

  if (!tier) {
    return NextResponse.json({ error: '경품 티어를 찾을 수 없습니다' }, { status: 404 })
  }

  const event = Array.isArray(tier.events) ? tier.events[0] : tier.events as { id: string; store_id: string; status: string } | null
  if (!event) {
    return NextResponse.json({ error: '이벤트 정보를 찾을 수 없습니다' }, { status: 404 })
  }

  // active 이벤트만 수정 허용
  if (event.status !== 'active') {
    return NextResponse.json(
      { error: '진행 중인(active) 이벤트의 티어만 수량을 늘릴 수 있습니다' },
      { status: 403 }
    )
  }

  // 권한 확인 (advertiser는 자기 매장만)
  const allowedStoreId = getAllowedStoreId(session.account)
  if (allowedStoreId && event.store_id !== allowedStoreId) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const previousQty = tier.total_quantity
  const newTotalQty = previousQty + addQuantity
  const newRemainingQty = tier.remaining_quantity + addQuantity

  // prize_tiers 업데이트 (computed_probability는 건드리지 않음)
  const { error: updateError } = await supabase
    .from('prize_tiers')
    .update({
      total_quantity: newTotalQty,
      remaining_quantity: newRemainingQty,
    })
    .eq('id', tierId)

  if (updateError) {
    return NextResponse.json({ error: '수량 업데이트 실패: ' + updateError.message }, { status: 500 })
  }

  // 변경 이력 기록
  const { error: logError } = await supabase
    .from('tier_quantity_changes')
    .insert({
      prize_tier_id: tierId,
      event_id: event.id,
      store_id: event.store_id,
      changed_by: session.account.id,
      previous_quantity: previousQty,
      new_quantity: newTotalQty,
    })

  if (logError) {
    // 이력 기록 실패는 치명적이지 않으므로 경고만 (롤백 안 함)
    console.warn('tier_quantity_changes 기록 실패:', logError.message)
  }

  return NextResponse.json({
    ok: true,
    tier_id: tierId,
    previous_total: previousQty,
    new_total: newTotalQty,
    new_remaining: newRemainingQty,
    probability_unchanged: tier.computed_probability,
  })
}
