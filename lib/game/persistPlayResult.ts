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
  nextAvailableAt: string | null
  constructor(nextAvailableAt: string | null = null) {
    super('ALREADY_PARTICIPATED')
    this.name = 'AlreadyParticipatedError'
    this.nextAvailableAt = nextAvailableAt
  }
}

export type ChallengeFrequency = 'daily' | 'weekly' | 'monthly' | 'unlimited'

function kstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** 어떤 시각의 "KST 기준 다음날 00:00"을 UTC 인스턴트로 반환 (daily 재도전 가능 시점 계산용) */
function nextKstMidnightAfter(d: Date): Date {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const nextDayKst = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + 1, 0, 0, 0)
  return new Date(nextDayKst - 9 * 60 * 60 * 1000)
}

/**
 * 데모 버전 전용 — 참여 제한을 끄고 무제한 테스트를 허용한다.
 * 실제 서비스(진짜 매장 운영) 전환 시에는 반드시 false(미설정)로 되돌려야 한다.
 * .env.local / Vercel 환경변수에 DEMO_UNLIMITED_PLAY=true 로 설정해 켠다.
 */
const DEMO_UNLIMITED_PLAY = process.env.DEMO_UNLIMITED_PLAY === 'true'

export interface ParticipationCheckResult {
  allowed: boolean
  /** 다음 도전 가능 시점 (ISO). allowed=true 또는 unlimited면 null */
  nextAvailableAt: string | null
}

/**
 * 이벤트별 도전횟수(challenge_frequency) 설정에 따라 참여 가능 여부를 판정한다.
 * - daily:   마지막 참여가 오늘(KST) 이전이면 허용
 * - weekly:  마지막 참여로부터 롤링 7일 지났으면 허용 (캘린더 주 아님)
 * - monthly: 마지막 참여로부터 롤링 30일 지났으면 허용 (캘린더 월 아님)
 * - unlimited: 항상 허용, 단 참여 기록은 통계용으로 계속 남긴다
 */
export async function checkParticipationAllowed(
  storeId: string,
  kakaoUserId: string,
  eventId: string,
  frequency: ChallengeFrequency,
): Promise<ParticipationCheckResult> {
  if (DEMO_UNLIMITED_PLAY || frequency === 'unlimited') {
    return { allowed: true, nextAvailableAt: null }
  }

  const supabase = createServerClient()
  const { data } = await supabase
    .from('daily_participation_log')
    .select('last_played_at')
    .eq('store_id', storeId)
    .eq('kakao_user_id', kakaoUserId)
    .eq('event_id', eventId)
    .maybeSingle()

  if (!data?.last_played_at) return { allowed: true, nextAvailableAt: null }

  const lastPlayedAt = new Date(data.last_played_at)
  const now = new Date()

  if (frequency === 'daily') {
    const nextAvailable = nextKstMidnightAfter(lastPlayedAt)
    if (now.getTime() >= nextAvailable.getTime()) return { allowed: true, nextAvailableAt: null }
    return { allowed: false, nextAvailableAt: nextAvailable.toISOString() }
  }

  const rollingDays = frequency === 'weekly' ? 7 : 30
  const nextAvailable = new Date(lastPlayedAt.getTime() + rollingDays * 86400000)
  if (now.getTime() >= nextAvailable.getTime()) return { allowed: true, nextAvailableAt: null }
  return { allowed: false, nextAvailableAt: nextAvailable.toISOString() }
}

/** @deprecated checkParticipationAllowed(…, 'daily')로 대체. 기존 호출부 정리 전까지만 유지 */
export async function hasPlayedToday(storeId: string, kakaoUserId: string, eventId: string): Promise<boolean> {
  const result = await checkParticipationAllowed(storeId, kakaoUserId, eventId, 'daily')
  return !result.allowed
}

export async function persistPendingPlay(params: {
  pending: PendingPlay
  kakaoUserId: string
}): Promise<RevealedPlay> {
  const { pending, kakaoUserId } = params
  const supabase = createServerClient()

  if (!DEMO_UNLIMITED_PLAY) {
    const check = await checkParticipationAllowed(
      pending.storeId, kakaoUserId, pending.eventId, pending.challengeFrequency ?? 'daily',
    )
    if (!check.allowed) {
      throw new AlreadyParticipatedError(check.nextAvailableAt)
    }
  }

  const { error: logError } = await supabase.from('daily_participation_log').upsert({
    store_id: pending.storeId,
    kakao_user_id: kakaoUserId,
    event_id: pending.eventId,
    date: kstToday(),
    last_played_at: new Date().toISOString(),
  }, { onConflict: 'store_id,kakao_user_id,event_id' })
  if (logError) {
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
    entrySource: pending.entrySource,
  }).catch(() => {})

  let pointsAwarded = 0
  try {
    const { data: storeSettings } = await supabase
      .from('store_settings')
      .select('points_enabled')
      .eq('store_id', pending.storeId)
      .maybeSingle()

    const pointsOn = isPointsEnabled(storeSettings?.points_enabled)

    let pointsToAdd = 0
    if (pointsOn) {
      const { data: loyaltySettings } = await supabase
        .from('loyalty_settings')
        .select('point_per_visit')
        .eq('store_id', pending.storeId)
        .maybeSingle()
      pointsToAdd = loyaltySettings?.point_per_visit ?? 0
    }

    // 포인트 기능이 꺼져 있거나 적립액이 0이어도, 회원 관리(방문횟수/최근방문일 집계)를
    // 위해 항상 customer_loyalty를 갱신한다 (p_points=0이면 point_balance는 변화 없음).
    await supabase.rpc('upsert_customer_loyalty', {
      p_store_id: pending.storeId,
      p_kakao_user_id: kakaoUserId,
      p_points: pointsToAdd,
    })

    if (pointsToAdd > 0) {
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
  } catch (err) {
    console.error('[persistPendingPlay] 방문 집계/포인트 적립 실패:', err)
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
      entrySource: pending.entrySource,
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
      label: pending.label,
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
    entrySource: pending.entrySource,
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
  //
  // 발송 결과(성공/스킵/실패)는 항상 message_log에 기록한다. Vercel 서버 로그는
  // 운영자가 바로 확인하기 어려워서, "왜 카톡이 안 오는지"를 DB 조회 한 번으로
  // 진단할 수 있도록 하기 위함 — message_type='coupon_issued_me_message'로 구분해서
  // 기존 알림톡(coupon_issued) 기록과 섞이지 않게 한다.
  ;(async () => {
    const logResult = async (status: 'sent' | 'skipped' | 'failed', errorMessage?: string) => {
      await supabase.from('message_log').insert({
        store_id: pending.storeId,
        kakao_user_id: kakaoUserId,
        message_type: 'coupon_issued_me_message',
        payload: { couponId: coupon.id, shortCode: coupon.short_code, amount: pending.amount },
        status,
        error_message: errorMessage ?? null,
      }).then(() => {}, () => {})
    }

    try {
      const session = await getCustomerSession()
      const accessToken = session.user?.accessToken
      if (!accessToken) {
        await logResult('skipped', '로그인 세션에 accessToken 없음 (mock 로그인이거나 세션 만료)')
        return
      }
      if (!session.user?.hasTalkMsg) {
        await logResult('skipped', 'talk_message 동의 스코프 없음 (카카오 로그인 시 동의 안 함, 또는 앱 동의항목 미설정)')
        return
      }
      const [{ data: store }, { data: contract }] = await Promise.all([
        supabase
          .from('store_settings')
          .select('store_name')
          .eq('store_id', pending.storeId)
          .maybeSingle(),
        supabase
          .from('store_contracts')
          .select('daangn_url')
          .eq('store_id', pending.storeId)
          .maybeSingle(),
      ])
      const result = await sendMeMessage(accessToken, {
        storeName: store?.store_name || '매장',
        shortCode: coupon.short_code ?? coupon.id.slice(0, 8).toUpperCase(),
        amount: pending.amount,
        label: pending.label,
        validUntil: coupon.valid_until,
        storeId: pending.storeId,
        daangnUrl: contract?.daangn_url ?? null,
      })
      if (result.ok) {
        await logResult('sent')
      } else {
        await logResult('failed', `${result.reason}: ${JSON.stringify(result.detail)}`)
      }
    } catch (err) {
      await logResult('failed', `예외: ${err instanceof Error ? err.message : String(err)}`)
    }
  })()

  return revealed
}
