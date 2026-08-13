/**
 * Win-back 이탈 위험 감지 — TypeScript 래퍼
 *
 * process_churn_risk PostgreSQL 함수를 호출해 복귀 이력을 기록한다.
 *
 * ── 이 함수가 하는 것 ───────────────────────────────────────
 * 직전 두 방문 간격이 기준 배수를 초과한 경우, churn_risk_alerts에
 * recovered=true로 이력을 남긴다 (복귀율 계산용 데이터).
 *
 * ── 이 함수가 하지 않는 것 ─────────────────────────────────
 * sendAlimtalk를 호출하지 않는다.
 * 이유: 이 흐름에서 recovered=true 기록은 "방금 복귀한 손님"을 뜻하므로
 * 복귀 유도 메시지를 보내는 것은 논리적으로 맞지 않는다.
 * "아직 돌아오지 않은 손님"에게 발송하는 로직은 Phase 2 배치 작업에서
 * churn_risk_alerts의 recovered=false 레코드를 기반으로 처리 예정.
 *
 * ⚠️ 구조적 한계 (v2.1 4절에 기록됨):
 *   미방문 중인 사용자의 실시간 AT_RISK/DORMANT 탐지 및 발송은
 *   Phase 2 배치 작업(pg_cron 또는 Vercel Cron)에서 처리 예정.
 *
 * Silent Fail 원칙:
 *   실패해도 게임 결과에 영향 없음. 호출부에서 .catch(() => {}) 처리.
 */

import { createServerClient } from '@/lib/supabase/server'

export async function processChurnRisk(
  storeId:     string,
  kakaoUserId: string,
): Promise<void> {
  const supabase = createServerClient()

  // RPC 호출 — 복귀 이력 기록 (recovered=true), 발송 없음
  const { error } = await supabase.rpc('process_churn_risk', {
    p_store_id:      storeId,
    p_kakao_user_id: kakaoUserId,
  })

  if (error) {
    console.error('[churnRisk] process_churn_risk 실패:', error.message)
  }
}
