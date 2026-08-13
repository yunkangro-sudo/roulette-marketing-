/**
 * Win-back 이탈 위험 감지 — TypeScript 래퍼
 *
 * process_churn_risk PostgreSQL 함수를 호출해 risk_level을 반환받고,
 * 감지된 경우 8-1 발송 규칙(sendAlimtalk)에 따라 winback 메시지 시도.
 *
 * ⚠️ 구조적 한계 (v2.1 4절에 기록됨):
 *   현재는 "복귀 시점 이력 기록" 용도 — 직전 두 방문의 간격이 기준 초과 시 기록.
 *   미방문 중인 사용자의 실시간 AT_RISK/DORMANT 탐지는 Phase 2 배치 작업 예정.
 *
 * Silent Fail 원칙:
 *   실패해도 게임 결과에 영향 없음. 호출부에서 .catch(() => {}) 처리.
 */

import { createServerClient } from '@/lib/supabase/server'
import { sendAlimtalk, type MessageType } from '@/lib/alimtalk/send'

const RISK_TO_MESSAGE: Record<string, MessageType> = {
  interested: 'winback_interested',
  at_risk:    'winback_at_risk',
  dormant:    'winback_dormant',
}

export async function processChurnRisk(
  storeId:     string,
  kakaoUserId: string,
): Promise<void> {
  const supabase = createServerClient()

  // RPC 호출 — 감지된 risk_level 또는 null 반환
  const { data: riskLevel, error } = await supabase.rpc('process_churn_risk', {
    p_store_id:      storeId,
    p_kakao_user_id: kakaoUserId,
  })

  if (error) {
    console.error('[churnRisk] process_churn_risk 실패:', error.message)
    return
  }

  if (!riskLevel) return  // 이탈 위험 없음

  // 8-1 발송 규칙 통해 winback 알림 시도
  const messageType = RISK_TO_MESSAGE[riskLevel as string]
  if (!messageType) return

  // reminder_sent_at 업데이트를 위해 최근 생성된 alert id 조회
  const { data: alert } = await supabase
    .from('churn_risk_alerts')
    .select('id')
    .eq('store_id', storeId)
    .eq('kakao_user_id', kakaoUserId)
    .eq('risk_level', riskLevel)
    .order('flagged_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // sendAlimtalk: 8-1 동의/빈도 규칙 통과 시에만 발송 (현재 stub — 로그만)
  try {
    await sendAlimtalk({
      storeId,
      kakaoUserId,
      messageType,
      data: { riskLevel },
    })

    // 발송 시도 성공 시 reminder_sent_at 기록
    if (alert?.id) {
      await supabase
        .from('churn_risk_alerts')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', alert.id)
    }
  } catch (err) {
    console.error('[churnRisk] winback 알림 실패 (무시):', err)
  }
}
