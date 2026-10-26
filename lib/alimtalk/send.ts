/**
 * 알림톡 발송 유틸리티
 *
 * ── 발송 전 체크 ──
 *  수신 동의 = 게임 후 카카오 로그인에서 전화번호(알림 수신용)에 동의한 것.
 *  채널 친구추가는 보지 않는다.
 *  1. 동의 철회(consented=false) → 차단
 *  2. 동의 기록이 없으면, 저장된 전화번호가 있을 때만 동의로 보고 기록을 남긴다
 *     전화번호도 없으면 차단
 *  3. 오늘 이미 발송 있음 → 차단 (하루 1회 제한, KST 기준)
 *  4. 최근 7일 내 동일 매장 3회 초과 → 차단
 *  5. 동일 message_type 재발송 허용 간격 이내 → 차단
 *  → 5단계 모두 통과 시에만 실제 발송 + message_log INSERT
 *
 * 만료 리마인드(expiry_reminder)만 솔라피 알림톡으로 실제 발송한다.
 * 다른 메시지 종류는 message_log 기록만 남긴다.
 */

import { createServerClient } from '@/lib/supabase/server'
import { isDemoStore } from '@/lib/store/isDemoStore'
import { decryptPhone } from '@/lib/crypto/phoneEncryption'
import { sendSolapiAlimtalk } from '@/lib/alimtalk/solapi'

export type MessageType =
  | 'coupon_issued'
  | 'expiry_reminder'
  | 'winback_interested'
  | 'winback_at_risk'
  | 'winback_dormant'
  | 'mission_complete'

export interface AlimtalkPayload {
  storeId:     string
  kakaoUserId: string
  messageType: MessageType
  data:        Record<string, unknown>
}

/** message_type별 재발송 허용 간격 (분 단위) */
const RESEND_INTERVAL_MINUTES: Record<MessageType, number> = {
  coupon_issued:      60,        // 1시간
  expiry_reminder:    24 * 60,   // 24시간
  mission_complete:   24 * 60,   // 24시간
  winback_interested: 5 * 24 * 60,  // 5일
  winback_at_risk:    5 * 24 * 60,  // 5일
  winback_dormant:    30 * 24 * 60, // 30일
}

type BlockReason =
  | 'no_consent_record'
  | 'consented_false'
  | 'daily_limit'
  | 'weekly_limit'
  | 'resend_interval'
  | 'demo_store'

interface CheckResult {
  allowed: boolean
  reason?: BlockReason
}

/**
 * 발송 가능 여부 5단계 체크
 * KST(UTC+9) 기준으로 "오늘" 판단
 * — sendAlimtalk 내부 및 크론 등 외부에서도 재사용 가능
 */
export async function checkSendPermission(payload: AlimtalkPayload): Promise<CheckResult> {
  const supabase = createServerClient()

  // ── 0단계: 샘플(데모) 매장이면 무조건 차단 ────────────────
  // 영업 시연용 가짜 손님 데이터에 실제 발송 로직이 걸리는 사고를 막기 위한 방어코드.
  if (await isDemoStore(payload.storeId)) {
    return { allowed: false, reason: 'demo_store' }
  }

  // ── 1·2단계: 수신 동의 ────────────────────────────────────
  // 채널 친구추가 기록이 아니라, 게임 후 카카오 전화번호 동의를 본다.
  // 전화번호가 저장돼 있으면 이미 "알림 수신용"에 동의한 손님이다.
  const { data: consent } = await supabase
    .from('message_consent')
    .select('consented')
    .eq('store_id',      payload.storeId)
    .eq('kakao_user_id', payload.kakaoUserId)
    .maybeSingle()

  if (consent && !consent.consented) return { allowed: false, reason: 'consented_false' }

  if (!consent?.consented) {
    const { data: loyalty } = await supabase
      .from('customer_loyalty')
      .select('phone_encrypted')
      .eq('store_id', payload.storeId)
      .eq('kakao_user_id', payload.kakaoUserId)
      .maybeSingle()

    if (!loyalty?.phone_encrypted) return { allowed: false, reason: 'no_consent_record' }

    await grantConsent(payload.storeId, payload.kakaoUserId).catch((err) => {
      console.error('[alimtalk] 전화번호 동의 기록 실패:', err)
    })
  }

  // 실제 솔라피 발송 성공(sent)만 횟수에 넣는다.
  // pending은 게임 당첨 기록처럼 아직 나가지 않은 줄도 있어서, 넣으면 하루 1회에 잘못 걸린다.
  const now = new Date()

  // ── 3단계: 오늘 발송 여부 (KST 00:00 기준) ────────────────
  const kstOffsetMs = 9 * 60 * 60 * 1000
  const kstMidnight = new Date(
    Math.floor((now.getTime() + kstOffsetMs) / 86_400_000) * 86_400_000 - kstOffsetMs
  )

  const { count: todayCount } = await supabase
    .from('message_log')
    .select('id', { count: 'exact', head: true })
    .eq('store_id',      payload.storeId)
    .eq('kakao_user_id', payload.kakaoUserId)
    .eq('status', 'sent')
    .gte('created_at',   kstMidnight.toISOString())

  if ((todayCount ?? 0) >= 1) return { allowed: false, reason: 'daily_limit' }

  // ── 4단계: 최근 7일 동일 매장 3회 초과 ───────────────────
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const { count: weeklyCount } = await supabase
    .from('message_log')
    .select('id', { count: 'exact', head: true })
    .eq('store_id',      payload.storeId)
    .eq('kakao_user_id', payload.kakaoUserId)
    .eq('status', 'sent')
    .gte('created_at',   sevenDaysAgo.toISOString())

  if ((weeklyCount ?? 0) >= 3) return { allowed: false, reason: 'weekly_limit' }

  // ── 5단계: 동일 타입 재발송 허용 간격 ───────────────────
  const intervalMinutes = RESEND_INTERVAL_MINUTES[payload.messageType]
  const intervalAgo = new Date(now.getTime() - intervalMinutes * 60 * 1000)

  const { count: typeCount } = await supabase
    .from('message_log')
    .select('id', { count: 'exact', head: true })
    .eq('store_id',      payload.storeId)
    .eq('kakao_user_id', payload.kakaoUserId)
    .eq('message_type',  payload.messageType)
    .eq('status', 'sent')
    .gte('created_at',   intervalAgo.toISOString())

  if ((typeCount ?? 0) >= 1) return { allowed: false, reason: 'resend_interval' }

  return { allowed: true }
}

export type SendResult =
  | { status: 'sent' }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string }

function formatKoreanDate(value: unknown): string {
  if (!value || typeof value !== 'string') return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' })
}

/** 만료 리마인드만 솔라피로 보낸다. 다른 종류는 기존처럼 기록만 남긴다. */
async function deliverExpiryReminder(
  payload: AlimtalkPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerClient()
  const { data: loyalty } = await supabase
    .from('customer_loyalty')
    .select('phone_encrypted')
    .eq('store_id', payload.storeId)
    .eq('kakao_user_id', payload.kakaoUserId)
    .maybeSingle()

  const phone = loyalty?.phone_encrypted ? decryptPhone(loyalty.phone_encrypted) : null
  if (!phone) return { ok: false, error: '손님 전화번호 없음' }

  const amount = payload.data.amount
  return sendSolapiAlimtalk({
    to: phone,
    variables: {
      '#{쿠폰명}': String(payload.data.label || '쿠폰'),
      '#{금액}': typeof amount === 'number' ? amount.toLocaleString('ko-KR') : String(amount ?? ''),
      '#{만료일}': formatKoreanDate(payload.data.validUntil),
      '#{쿠폰코드}': String(payload.data.shortCode || '-'),
    },
  })
}

/**
 * 알림톡 발송 메인 함수
 * 5단계 체크 → message_log 기록 → 만료 리마인드는 솔라피 발송
 */
export async function sendAlimtalk(payload: AlimtalkPayload): Promise<SendResult> {
  const supabase = createServerClient()

  const check = await checkSendPermission(payload)

  if (!check.allowed) {
    await supabase.from('message_log').insert({
      store_id:      payload.storeId,
      kakao_user_id: payload.kakaoUserId,
      message_type:  payload.messageType,
      payload:       payload.data,
      coupon_id:     payload.data.couponId ?? null,
      days_remaining: payload.data.daysRemaining ?? null,
      status:        'skipped',
      error_message: `차단 사유: ${check.reason}`,
    })
    return { status: 'skipped', reason: check.reason ?? 'unknown' }
  }

  const { data: logRow, error: logErr } = await supabase
    .from('message_log')
    .insert({
      store_id:      payload.storeId,
      kakao_user_id: payload.kakaoUserId,
      message_type:  payload.messageType,
      payload:       payload.data,
      coupon_id:     payload.data.couponId ?? null,
      days_remaining: payload.data.daysRemaining ?? null,
      status:        'pending',
    })
    .select('id')
    .single()

  if (logErr || !logRow) {
    console.error('[alimtalk] message_log 기록 실패:', logErr?.message)
    return { status: 'failed', reason: '발송 기록 저장 실패' }
  }

  if (payload.messageType !== 'expiry_reminder') {
    await supabase.from('message_log').update({
      status: 'skipped',
      error_message: '이 메시지 종류는 아직 실발송하지 않음',
    }).eq('id', logRow.id)
    return { status: 'skipped', reason: '이 메시지 종류는 아직 실발송하지 않음' }
  }

  if (!process.env.SOLAPI_API_KEY || !process.env.SOLAPI_PF_ID || !process.env.SOLAPI_TEMPLATE_ID) {
    await supabase.from('message_log').update({
      status: 'skipped',
      error_message: '솔라피 키 없음',
    }).eq('id', logRow.id)
    return { status: 'skipped', reason: '솔라피 키 없음' }
  }

  try {
    const result = await deliverExpiryReminder(payload)
    if (!result.ok) {
      await supabase.from('message_log').update({ status: 'failed', error_message: result.error }).eq('id', logRow.id)
      return { status: 'failed', reason: result.error }
    }
    await supabase.from('message_log').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', logRow.id)
    return { status: 'sent' }
  } catch (err) {
    const reason = err instanceof Error ? err.message : '발송 중 오류'
    await supabase.from('message_log').update({ status: 'failed', error_message: reason }).eq('id', logRow.id)
    return { status: 'failed', reason }
  }
}

/**
 * 수신 동의 등록/갱신.
 * 게임 후 카카오 전화번호 동의가 확인되면 consented=true로 upsert한다.
 */
export async function grantConsent(storeId: string, kakaoUserId: string): Promise<void> {
  const supabase = createServerClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('message_consent')
    .upsert(
      {
        store_id:      storeId,
        kakao_user_id: kakaoUserId,
        consented:     true,
        consented_at:  now,
        updated_at:    now,
      },
      { onConflict: 'store_id,kakao_user_id' },
    )

  if (error) {
    console.error('[alimtalk] 동의 등록 실패:', error.message)
    throw error
  }
}

/**
 * 동의 철회 (카카오 채널 차단/삭제 콜백에서 호출)
 */
export async function revokeConsent(storeId: string, kakaoUserId: string): Promise<void> {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('message_consent')
    .upsert(
      {
        store_id:      storeId,
        kakao_user_id: kakaoUserId,
        consented:     false,
        updated_at:    new Date().toISOString(),
      },
      { onConflict: 'store_id,kakao_user_id' },
    )

  if (error) console.error('[alimtalk] 동의 철회 실패:', error.message)
}
