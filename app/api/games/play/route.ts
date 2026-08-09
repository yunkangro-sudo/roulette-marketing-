import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { drawPrizeTier, applyStockSafetyNet } from '@/lib/game-engine/prizeDraw'

/**
 * POST /api/games/play
 * body: { event_id: string, kakao_user_id: string }
 *
 * 서버에서 확률을 계산해 당첨 결과만 반환한다 (설계 원칙: 게임 결과는 반드시 서버 확정).
 * 쿠폰 발급/참여자 저장은 다음 단계에서 연결 예정 — 지금은 결과 반환까지만.
 *
 * 동시접속자 방어(트랜잭션 락)는 이번 프로젝트 규모에선 불필요하다고 판단해
 * 이번 단계에선 구현하지 않는다 (단순 read → decrement).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const eventId = body?.event_id
  const kakaoUserId = body?.kakao_user_id

  if (!eventId || !kakaoUserId) {
    return NextResponse.json(
      { error: 'event_id와 kakao_user_id가 필요합니다' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  const { data: tiers, error } = await supabase
    .from('prize_tiers')
    .select('id, label, amount, computed_probability, remaining_quantity, requires_verification')
    .eq('event_id', eventId)

  if (error) {
    console.error('[api/games/play] prize_tiers 조회 실패:', error)
    return NextResponse.json({ error: '경품 정보를 불러오지 못했습니다' }, { status: 500 })
  }

  if (!tiers || tiers.length === 0) {
    return NextResponse.json(
      { error: '이 이벤트에 등록된 경품이 없습니다' },
      { status: 404 }
    )
  }

  let finalTier
  try {
    const picked = drawPrizeTier(tiers)
    // 뽑힌 티어가 이미 품절이면 꽝으로 강제 전환 (remaining_quantity는 안전장치 용도로만 사용)
    finalTier = applyStockSafetyNet(picked, tiers)
  } catch (err) {
    console.error('[api/games/play] 추첨 오류:', err)
    return NextResponse.json({ error: '추첨 처리 중 오류가 발생했습니다' }, { status: 500 })
  }

  if (finalTier.remaining_quantity > 0) {
    const { error: decrementError } = await supabase
      .from('prize_tiers')
      .update({ remaining_quantity: finalTier.remaining_quantity - 1 })
      .eq('id', finalTier.id)

    if (decrementError) {
      // 재고 차감 실패해도 사용자는 이미 결과를 받아야 하므로 로그만 남기고 응답은 그대로 진행
      console.error('[api/games/play] remaining_quantity 차감 실패:', decrementError)
    }
  }

  return NextResponse.json({
    label: finalTier.label,
    amount: finalTier.amount,
    requiresVerification: finalTier.requires_verification,
  })
}
