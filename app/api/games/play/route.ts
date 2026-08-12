import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { drawPrizeTier, applyStockSafetyNet } from '@/lib/game-engine/prizeDraw'
import { computeValidUntil, type CouponValidityType } from '@/lib/game-engine/couponValidity'
import { sendAlimtalk } from '@/lib/alimtalk/send'

/**
 * POST /api/games/play
 * body: { event_id: string, kakao_user_id: string }
 *
 * 서버에서 확률을 계산해 당첨 결과를 확정하고, 당첨(꽝 제외)인 경우 coupons에
 * row를 생성한다. requires_verification=false면 즉시 issued, true면 pending_verify.
 *
 * 동시접속자 방어(트랜잭션 락)는 이번 프로젝트 규모에선 불필요하다고 판단해
 * 이번 단계에선 구현하지 않는다 (단순 read → decrement/insert).
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

  const [tiersResult, eventResult] = await Promise.all([
    supabase
      .from('prize_tiers')
      .select('id, label, amount, computed_probability, remaining_quantity, requires_verification')
      .eq('event_id', eventId),
    supabase
      .from('events')
      .select('store_id, coupon_validity_type, coupon_validity_value')
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
    return NextResponse.json(
      { error: '이 이벤트에 등록된 경품이 없습니다' },
      { status: 404 }
    )
  }

  if (eventError || !event) {
    console.error('[api/games/play] 이벤트 조회 실패:', eventError)
    return NextResponse.json({ error: '이벤트 정보를 불러오지 못했습니다' }, { status: 500 })
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

  // ── 포인트 적립 (꽝 포함 무조건 적립) ──────────────────────────
  try {
    const { data: loyaltySettings } = await supabase
      .from('loyalty_settings')
      .select('point_per_visit')
      .eq('store_id', event.store_id)
      .maybeSingle()

    const pointsToAdd = loyaltySettings?.point_per_visit ?? 0

    if (pointsToAdd > 0) {
      // customer_loyalty upsert (복합 PK: store_id + kakao_user_id)
      await supabase.rpc('upsert_customer_loyalty', {
        p_store_id: event.store_id,
        p_kakao_user_id: kakaoUserId,
        p_points: pointsToAdd,
      })

      // point_ledger earn 기록
      await supabase.from('point_ledger').insert({
        store_id: event.store_id,
        kakao_user_id: kakaoUserId,
        type: 'earn',
        amount: pointsToAdd,
      })
    }
  } catch (err) {
    // 포인트 적립 실패는 게임 결과에 영향 없음 (로그만)
    console.error('[api/games/play] 포인트 적립 실패:', err)
  }
  // ─────────────────────────────────────────────────────────────

  // 꽝이면 쿠폰을 발급하지 않는다
  if (finalTier.amount <= 0) {
    return NextResponse.json({
      label: finalTier.label,
      amount: finalTier.amount,
      requiresVerification: finalTier.requires_verification,
    })
  }

  if (!event.coupon_validity_type || !event.coupon_validity_value) {
    console.error('[api/games/play] 이벤트에 coupon_validity 설정이 없습니다:', eventId)
    // 결과 자체는 유효하므로 쿠폰 정보 없이 결과만 반환
    return NextResponse.json({
      label: finalTier.label,
      amount: finalTier.amount,
      requiresVerification: finalTier.requires_verification,
    })
  }

  const issuedAt = new Date()
  let validUntil: Date
  try {
    validUntil = computeValidUntil(
      issuedAt,
      event.coupon_validity_type as CouponValidityType,
      event.coupon_validity_value
    )
  } catch (err) {
    console.error('[api/games/play] valid_until 계산 오류:', err)
    return NextResponse.json({
      label: finalTier.label,
      amount: finalTier.amount,
      requiresVerification: finalTier.requires_verification,
    })
  }

  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .insert({
      event_id: eventId,
      kakao_user_id: kakaoUserId,
      store_id: event.store_id,
      amount: finalTier.amount,
      source_type: 'game_win',
      requires_verification: finalTier.requires_verification,
      status: finalTier.requires_verification ? 'pending_verify' : 'issued',
      issued_at: issuedAt.toISOString(),
      valid_until: validUntil.toISOString(),
    })
    .select('id, short_code, status, issued_at, valid_until')
    .single()

  if (couponError) {
    // 쿠폰 저장이 실패해도 게임 결과 자체는 이미 확정됐으므로 결과는 반환한다 (쿠폰 정보만 빠짐)
    console.error('[api/games/play] 쿠폰 발급 실패:', couponError)
    return NextResponse.json({
      label: finalTier.label,
      amount: finalTier.amount,
      requiresVerification: finalTier.requires_verification,
    })
  }

  // ── 알림톡 발송 (쿠폰 발급 시점 — stub 버전) ────────────────
  sendAlimtalk({
    storeId:     event.store_id,
    kakaoUserId,
    messageType: 'coupon_issued',
    data: {
      shortCode:  coupon.short_code,
      amount:     finalTier.amount,
      label:      finalTier.label,
      validUntil: coupon.valid_until,
    },
  }).catch((err) => {
    // 알림톡 실패는 게임 결과에 영향 없음
    console.error('[api/games/play] 알림톡 발송 실패 (무시):', err)
  })
  // ─────────────────────────────────────────────────────────────

  return NextResponse.json({
    label: finalTier.label,
    amount: finalTier.amount,
    requiresVerification: finalTier.requires_verification,
    coupon: {
      id: coupon.id,
      shortCode: coupon.short_code ?? undefined,
      status: coupon.status,
      issuedAt: coupon.issued_at,
      validUntil: coupon.valid_until,
    },
  })
}
