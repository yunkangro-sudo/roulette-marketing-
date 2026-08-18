/**
 * 로그인 후 임시 세션 결과를 kakao_user_id 앞으로 확정 저장
 */
import { createServerClient } from '@/lib/supabase/server'
import { computeValidUntil, type CouponValidityType } from '@/lib/game-engine/couponValidity'
import { sendAlimtalk } from '@/lib/alimtalk/send'
import { logActivity } from '@/lib/activity/log'
import { processMissionProgress } from '@/lib/missions/processProgress'
import { recalculateCustomerSegment } from '@/lib/segments/recalculate'
import { processChurnRisk } from '@/lib/churnRisk/processChurnRisk'
import { sendMeMessage } from '@/lib/kakao/meMessage'
import { getCustomerSession, type PendingPlay, type RevealedPlay } from '@/lib/auth/session'
import { isPointsEnabled } from '@/lib/game/guestPlayPolicy'

export { isPointsEnabled }
export class AlreadyParticipatedError extends Error {
  constructor() {
    super('ALREADY_PARTICIPATED')
    this.name = 'AlreadyParticipatedError'
  }
}

function kstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/**
 * 데모 버전 전용 — 하루 1회 참여 제한을 끄고 무제한 테스트를 허용한다.
 * 실제 서비스(진짜 매장 운영) 전환 시에는 반드시 false(미설정)로 되돌려야 한다.
 * .env.local / Vercel 환경변수에 DEMO_UNLIMITED_PLAY=true 로 설정해 켠다.
 */
const DEMO_UNLIMITED_PLAY = process.env.DEMO_UNLIMITED_PLAY === 'true'

export async function hasPlayedToday(storeId: string, kakaoUserId: string): Promise<boolean> {
  if (DEMO_UNLIMITED_PLAY) return false

  const supabase = createServerClient()
  const { data } = await supabase
    .from('daily_participation_log')
    .select('id')
    .eq('store_id', storeId)
    .eq('kakao_user_id', kakaoUserId)
    .eq('date', kstToday())
    .maybeSingle()
  return data !== null
}

export async function persistPendingPlay(params: {
  pending: PendingPlay
  kakaoUserId: string
}): Promise<RevealedPlay> {
  const { pending, kakaoUserId } = params
  const supabase = createServerClient()

  const { error: logError } = await supabase.from('daily_participation_log').insert({
    store_id: pending.storeId,
    kakao_user_id: kakaoUserId,
    date: kstToday(),
  })
  if (logError?.code === '23505' && !DEMO_UNLIMITED_PLAY) {
    throw new AlreadyParticipatedError()
  }
  if (logError && logError.code !== '23505') {
    throw new Error(`참여 기록 저장 실패: ${logError.message}`)
  }

  if (pending.tierId) {
    const { data: tier } = await supabase
      .from('prize_tiers')
      .select('id, remaining_quantity')
      .eq('id', pending.tierId)
      .maybeSingle()
    if (tier && tier.remaining_quantity > 0) {
      await supabase
        .from('prize_tiers')
        .update({ remaining_quantity: tier.remaining_quantity - 1 })
        .eq('id', pending.tierId)
    }
  }

  logActivity({
    storeId: pending.storeId,
    kakaoUserId,
    eventType: 'game_start',
    refId: pending.eventId,
    refType: 'game',
  }).catch(() => {})

  let pointsAwarded = 0
  try {
    const { data: storeSettings } = await supabase
      .from('store_settings')
      .select('points_enabled')
      .eq('store_id', pending.storeId)
      .maybeSingle()

    const pointsOn = isPointsEnabled(storeSettings?.points_enabled)

    if (pointsOn) {
      const { data: loyaltySettings } = await supabase
        .from('loyalty_settings')
        .select('point_per_visit')
        .eq('store_id', pending.storeId)
        .maybeSingle()

      const pointsToAdd = loyaltySettings?.point_per_visit ?? 0
      if (pointsToAdd > 0) {
        await supabase.rpc('upsert_customer_loyalty', {
          p_store_id: pending.storeId,
          p_kakao_user_id: kakaoUserId,
          p_points: pointsToAdd,
        })
        const { data: ledgerRow } = await supabase.from('point_ledger').insert({
          store_id: pending.storeId,
          kakao_user_id: kakaoUserId,
          type: 'earn',
          amount: pointsToAdd,
        }).select('id').single()
        pointsAwarded = pointsToAdd
        logActivity({
          storeId: pending.storeId,
          kakaoUserId,
          eventType: 'point_earned',
          refId: ledgerRow?.id,
          refType: 'point_ledger',
        }).catch(() => {})
      }
    }
  } catch (err) {
    console.error('[persistPendingPlay] 포인트 적립 실패:', err)
  }

  const revealed: RevealedPlay = {
    storeId: pending.storeId,
    label: pending.label,
    amount: pending.amount,
    pointsAwarded,
  }

  if (pending.amount <= 0) {
    logActivity({
      storeId: pending.storeId,
      kakaoUserId,
      eventType: 'game_complete',
      refId: pending.eventId,
      refType: 'game',
    }).catch(() => {})
    processMissionProgress(pending.storeId, kakaoUserId).catch(() => {})
    recalculateCustomerSegment(pending.storeId, kakaoUserId).catch(() => {})
    processChurnRisk(pending.storeId, kakaoUserId).catch(() => {})
    return revealed
  }

  const { data: event } = await supabase
    .from('events')
    .select('coupon_validity_type, coupon_validity_value')
    .eq('id', pending.eventId)
    .maybeSingle()

  if (!event?.coupon_validity_type || !event?.coupon_validity_value) {
    return revealed
  }

  const issuedAt = new Date()
  let validUntil: Date
  try {
    validUntil = computeValidUntil(
      issuedAt,
      event.coupon_validity_type as CouponValidityType,
      event.coupon_validity_value,
    )
  } catch {
    return revealed
  }

  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .insert({
      event_id: pending.eventId,
      kakao_user_id: kakaoUserId,
      store_id: pending.storeId,
      amount: pending.amount,
      source_type: 'game_win',
      requires_verification: true,
      status: 'pending_verify',
      issued_at: issuedAt.toISOString(),
      valid_until: validUntil.toISOString(),
    })
    .select('id, short_code, status, issued_at, valid_until')
    .single()

  if (couponError || !coupon) {
    console.error('[persistPendingPlay] 쿠폰 발급 실패:', couponError)
    return revealed
  }

  revealed.coupon = {
    id: coupon.id,
    shortCode: coupon.short_code ?? undefined,
    status: coupon.status,
    issuedAt: coupon.issued_at,
    validUntil: coupon.valid_until,
  }

  logActivity({
    storeId: pending.storeId,
    kakaoUserId,
    eventType: 'game_complete',
    refId: coupon.id,
    refType: 'coupon',
  }).catch(() => {})

  processMissionProgress(pending.storeId, kakaoUserId).catch(() => {})
  recalculateCustomerSegment(pending.storeId, kakaoUserId).catch(() => {})
  processChurnRisk(pending.storeId, kakaoUserId).catch(() => {})

  sendAlimtalk({
    storeId: pending.storeId,
    kakaoUserId,
    messageType: 'coupon_issued',
    data: {
      shortCode: coupon.short_code,
      amount: pending.amount,
      label: pending.label,
      validUntil: coupon.valid_until,
    },
  }).catch(() => {})

  // 카카오 로그인 → 결과 공개 시 당첨 내용을 손님 카카오톡으로 자동 발송.
  // 실제 카카오 앱키/talk_message 동의가 없는 데모·mock 로그인 상태에서는
  // accessToken이 없어 자동으로 스킵된다 — 심사 완료 후 별도 코드 변경 없이 활성화됨.
  ;(async () => {
    try {
      const session = await getCustomerSession()
      const accessToken = session.user?.accessToken
      if (!accessToken || !session.user?.hasTalkMsg) return
      await sendMeMessage(accessToken, {
        storeName: '매장',
        shortCode: coupon.short_code ?? coupon.id.slice(0, 8).toUpperCase(),
        amount: pending.amount,
        label: pending.label,
        validUntil: coupon.valid_until,
        storeId: pending.storeId,
      })
    } catch { /* silent */ }
  })()

  return revealed
}
