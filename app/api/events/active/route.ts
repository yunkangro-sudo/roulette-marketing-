/**
 * GET /api/events/active?store_id=xxx
 *
 * 순수 정보 조회용 — 게임 실행 흐름과 무관하다 (patent-safety 규칙 대상 아님).
 * 활성 이벤트의 경품 티어 중 "꽝"(amount<=0)을 제외한 label/amount만 내려준다.
 * 확률(computed_probability)·재고(remaining_quantity)는 절대 응답에 포함하지 않는다.
 * 조회 여부를 별도로 기록하지 않는다 (로그인/서버 기록 없이 언제든 호출 가능).
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('store_id')

  if (!storeId) {
    return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name, status')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .maybeSingle()

  if (eventError) {
    return NextResponse.json({ error: '이벤트 조회 실패' }, { status: 500 })
  }
  if (!event) {
    return NextResponse.json({ error: '진행 중인 이벤트가 없습니다' }, { status: 404 })
  }

  // "꽝" 라벨만 제외하고 나머지는 전부 보여준다.
  // 주의: 여기서 amount > 0만 필터링하면 안 된다 — 커피/과자 같은 실물 경품은
  // 쿠폰 금액이 없어 amount=0으로 등록되지만, "꽝"이 아닌 실제 경품이므로 목록에 표시돼야 한다.
  const { data: tiers, error: tiersError } = await supabase
    .from('prize_tiers')
    .select('label, amount')
    .eq('event_id', event.id)
    .neq('label', '꽝')
    .order('amount', { ascending: true })

  if (tiersError) {
    return NextResponse.json({ error: '경품 정보 조회 실패' }, { status: 500 })
  }

  return NextResponse.json({
    event: { id: event.id, name: event.name },
    tiers: (tiers ?? []).map((t) => ({ label: t.label })),
  })
}
