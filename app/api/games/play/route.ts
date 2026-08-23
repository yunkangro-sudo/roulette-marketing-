/**
 * POST /api/games/play
 * body: { event_id: string }
 *
 * 로그인 없이 추첨만 수행한다. 결과는 httpOnly 세션에만 저장하고
 * 응답에는 locked:true 만 내려 화면에서 당첨액을 볼 수 없게 한다.
 * 쿠폰/포인트/참여기록은 /api/games/claim (로그인 후)에서 확정한다.
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { drawPrizeTier, applyStockSafetyNet } from '@/lib/game-engine/prizeDraw'
import { getCustomerSession } from '@/lib/auth/session'
import { isLockedPlayResponse } from '@/lib/game/guestPlayPolicy'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const eventId = body?.event_id

  if (!eventId) {
    return NextResponse.json({ error: 'event_id가 필요합니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  const [tiersResult, eventResult] = await Promise.all([
    supabase
      .from('prize_tiers')
      .select('id, label, amount, computed_probability, remaining_quantity')
      .eq('event_id', eventId),
    supabase
      .from('events')
      .select('id, store_id, status, challenge_frequency')
      .eq('id', eventId)
      .maybeSingle(),
  ])

  const { data: tiers, error: tiersError } = tiersResult
  const { data: event, error: eventError } = eventResult

  if (tiersError) {
    console.error('[api/games/play] prize_tiers 조회 실패:', tiersError)
    return NextResponse.json({ error: '경품 정보를 불러오지 못했습니다' }, { status: 500 })
  }

  if (!tiers || tiers.length === 0) {
    return NextResponse.json({ error: '이 이벤트에 등록된 경품이 없습니다' }, { status: 404 })
  }

  if (eventError || !event || event.status !== 'active') {
    return NextResponse.json({ error: '진행 중인 이벤트가 없습니다' }, { status: 404 })
  }

  let finalTier
  try {
    const picked = drawPrizeTier(tiers)
    finalTier = applyStockSafetyNet(picked, tiers)
  } catch (err) {
    console.error('[api/games/play] 추첨 오류:', err)
    return NextResponse.json({ error: '추첨 처리 중 오류가 발생했습니다' }, { status: 500 })
  }

  const session = await getCustomerSession()
  session.pendingPlay = {
    eventId,
    storeId: event.store_id,
    drawnAt: new Date().toISOString(),
    label: finalTier.label,
    amount: finalTier.amount,
    tierId: finalTier.id,
    challengeFrequency: (event.challenge_frequency ?? 'daily') as 'daily' | 'weekly' | 'monthly' | 'unlimited',
  }
  session.revealedPlay = undefined
  await session.save()

  const lockedBody = { locked: true as const }
  if (!isLockedPlayResponse(lockedBody)) {
    return NextResponse.json({ error: '결과 잠금 응답 생성에 실패했습니다' }, { status: 500 })
  }
  return NextResponse.json(lockedBody)
}
