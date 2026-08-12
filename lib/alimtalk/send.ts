/**
 * 알림톡 발송 유틸리티 (stub 버전)
 *
 * 현재 상태: 실제 발송 없이 message_log 테이블에 기록만 함
 *
 * 실제 발송 연동 방법 (대행사 가입 후):
 * 1. KAKAO_ALIMTALK_SENDER_KEY 환경변수에 실제 발송 키 입력
 * 2. sendKakaoAlimtalk() 함수 내부에 대행사 API 호출 코드 추가
 * 3. status를 'pending' → 'sent'/'failed' 로 업데이트
 *
 * 지원 message_type:
 * - 'coupon_issued'   : 게임 쿠폰 발급
 * - 'reward_issued'   : 포인트 리워드 교환
 * - 'points_earned'   : 포인트 적립 (필요 시)
 */

import { createServerClient } from '@/lib/supabase/server'

export type MessageType = 'coupon_issued' | 'reward_issued' | 'points_earned'

export interface AlimtalkPayload {
  storeId:      string
  kakaoUserId:  string
  messageType:  MessageType
  data:         Record<string, unknown>  // 발송 내용 (쿠폰코드, 금액 등)
}

interface MessageLogCheck {
  storeId:     string
  kakaoUserId: string
  messageType: MessageType
}

/**
 * 발송 가능 여부 체크 (빈도 제한)
 *
 * message_log 규칙:
 * - 동일 사용자·동일 유형: 1시간 내 재발송 금지
 * - 나중에 정교한 빈도 제한 추가 가능 (오늘 N회 제한 등)
 */
async function canSendMessage(check: MessageLogCheck): Promise<boolean> {
  const supabase = createServerClient()

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { count } = await supabase
    .from('message_log')
    .select('id', { count: 'exact', head: true })
    .eq('store_id',      check.storeId)
    .eq('kakao_user_id', check.kakaoUserId)
    .eq('message_type',  check.messageType)
    .neq('status',       'skipped')
    .gte('created_at',   oneHourAgo)

  return (count ?? 0) === 0
}

/**
 * 알림톡 발송 메인 함수
 *
 * 1. 발송 가능 여부 체크
 * 2. message_log 기록 (status: pending)
 * 3. 실제 발송 (KAKAO_ALIMTALK_SENDER_KEY 설정 시 — 현재는 stub)
 */
export async function sendAlimtalk(payload: AlimtalkPayload): Promise<void> {
  const supabase = createServerClient()

  // ── 발송 조건 체크 ───────────────────────────────────────────
  const canSend = await canSendMessage({
    storeId:     payload.storeId,
    kakaoUserId: payload.kakaoUserId,
    messageType: payload.messageType,
  })

  if (!canSend) {
    // 빈도 제한 — skipped로 기록
    await supabase.from('message_log').insert({
      store_id:      payload.storeId,
      kakao_user_id: payload.kakaoUserId,
      message_type:  payload.messageType,
      payload:       payload.data,
      status:        'skipped',
      error_message: '빈도 제한 — 1시간 내 동일 유형 발송 이미 존재',
    })
    return
  }

  // ── message_log 기록 ─────────────────────────────────────────
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

  // ── 실제 발송 (현재: stub — 대행사 연결 후 아래 주석 해제) ───
  const senderKey = process.env.KAKAO_ALIMTALK_SENDER_KEY
  if (!senderKey) {
    console.log(
      `[alimtalk STUB] ${payload.messageType} → 사용자:${payload.kakaoUserId} | 데이터:`,
      payload.data,
    )
    // pending 상태 유지 (대행사 미연결)
    return
  }

  // TODO: 아래 주석 해제 후 실제 대행사 API 호출 코드 추가
  // try {
  //   await callAlimtalkProviderApi(senderKey, payload)
  //   await supabase.from('message_log').update({ status: 'sent' }).eq('id', logRow.id)
  // } catch (err) {
  //   await supabase.from('message_log').update({
  //     status: 'failed',
  //     error_message: String(err),
  //   }).eq('id', logRow.id)
  // }
}
