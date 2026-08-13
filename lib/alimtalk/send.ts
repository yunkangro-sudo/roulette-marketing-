/**
 * 알림톡 발송 유틸리티
 *
 * ── 발송 전 5단계 체크 (v2.1 8-1단계, 결정 D: 카카오 채널 친구추가 = 동의) ──
 *  1. message_consent 레코드 없음 → 차단
 *  2. consented = false → 차단
 *  3. 오늘 이미 발송 있음 → 차단 (하루 1회 제한, KST 기준)
 *  4. 최근 7일 내 동일 매장 3회 초과 → 차단
 *  5. 동일 message_type 재발송 허용 간격 이내 → 차단
 *  → 5단계 모두 통과 시에만 실제 발송 + message_log INSERT
 *
 * 현재 상태: 실제 발송 없이 message_log 기록만 (stub)
 * 실제 발송 연동 방법:
 *   KAKAO_ALIMTALK_SENDER_KEY 입력 후 sendKakaoAlimtalk() 내 주석 해제
 */

import { createServerClient } from '@/lib/supabase/server'

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

  // ── 1·2단계: 동의 여부 ────────────────────────────────────
  const { data: consent } = await supabase
    .from('message_consent')
    .select('consented')
    .eq('store_id',      payload.storeId)
    .eq('kakao_user_id', payload.kakaoUserId)
    .maybeSingle()

  if (!consent)                    return { allowed: false, reason: 'no_consent_record' }
  if (!consent.consented)          return { allowed: false, reason: 'consented_false' }

  // 이하 체크는 status IN ('sent', 'pending') 만 카운트
  // skipped / failed 는 실제 발송 아니므로 제외
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
    .in('status', ['sent', 'pending'])
    .gte('created_at',   kstMidnight.toISOString())

  if ((todayCount ?? 0) >= 1) return { allowed: false, reason: 'daily_limit' }

  // ── 4단계: 최근 7일 동일 매장 3회 초과 ───────────────────
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const { count: weeklyCount } = await supabase
    .from('message_log')
    .select('id', { count: 'exact', head: true })
    .eq('store_id',      payload.storeId)
    .eq('kakao_user_id', payload.kakaoUserId)
    .in('status', ['sent', 'pending'])
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
    .in('status', ['sent', 'pending'])
    .gte('created_at',   intervalAgo.toISOString())

  if ((typeCount ?? 0) >= 1) return { allowed: false, reason: 'resend_interval' }

  return { allowed: true }
}

/**
 * 알림톡 발송 메인 함수
 * 5단계 체크 → message_log 기록 → 실제 발송(stub)
 */
export async function sendAlimtalk(payload: AlimtalkPayload): Promise<void> {
  const supabase = createServerClient()

  // ── 5단계 체크 ───────────────────────────────────────────
  const check = await checkSendPermission(payload)

  if (!check.allowed) {
    await supabase.from('message_log').insert({
      store_id:      payload.storeId,
      kakao_user_id: payload.kakaoUserId,
      message_type:  payload.messageType,
      payload:       payload.data,
      status:        'skipped',
      error_message: `차단 사유: ${check.reason}`,
    })
    console.log(`[alimtalk] 발송 차단 (${check.reason}): ${payload.kakaoUserId}@${payload.storeId}`)
    return
  }

  // ── message_log 기록 ─────────────────────────────────────
  const { data: logRow, error: logErr } = await supabase
    .from('message_log')
    .insert({
      store_id:      payload.storeId,
      kakao_user_id: payload.kakaoUserId,
      message_type:  payload.messageType,
      payload:       payload.data,
      status:        'pending',
    })
    .select('id')
    .single()

  if (logErr || !logRow) {
    console.error('[alimtalk] message_log 기록 실패:', logErr?.message)
    return
  }

  // ── 실제 발송 (stub — KAKAO_ALIMTALK_SENDER_KEY 설정 후 아래 활성화) ──
  const senderKey = process.env.KAKAO_ALIMTALK_SENDER_KEY
  if (!senderKey) {
    console.log(
      `[alimtalk STUB] ${payload.messageType} → ${payload.kakaoUserId} | 데이터:`,
      payload.data,
    )
    // pending 유지 (대행사 미연결)
    return
  }

  // TODO: 대행사 연동 시 아래 주석 해제
  // try {
  //   await callAlimtalkProviderApi(senderKey, payload)
  //   await supabase.from('message_log')
  //     .update({ status: 'sent', sent_at: new Date().toISOString() })
  //     .eq('id', logRow.id)
  // } catch (err) {
  //   await supabase.from('message_log')
  //     .update({ status: 'failed', error_message: String(err) })
  //     .eq('id', logRow.id)
  // }
}

/**
 * 동의 등록/갱신 (카카오 채널 친구추가 완료 콜백에서 호출)
 * consented=true로 upsert
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
