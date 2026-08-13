/**
 * 미션 진행률 업데이트 — TypeScript 래퍼
 *
 * process_mission_progress PostgreSQL 함수를 호출한다.
 * 이 함수 내부에서 원자적으로:
 *   1. visit_count 타입 active 미션들의 current_value + 1
 *   2. target 달성 시 completed_at 기록 + 보상 지급 (중복 방어 포함)
 *
 * Silent Fail 원칙:
 *   호출부에서 .catch(() => {}) 로 처리. 이 함수가 실패해도
 *   게임 결과(쿠폰/포인트)는 절대 영향 받지 않는다.
 */

import { createServerClient } from '@/lib/supabase/server'

export async function processMissionProgress(
  storeId: string,
  kakaoUserId: string,
): Promise<void> {
  const supabase = createServerClient()

  const { error } = await supabase.rpc('process_mission_progress', {
    p_store_id:      storeId,
    p_kakao_user_id: kakaoUserId,
  })

  if (error) {
    console.error('[missions] process_mission_progress 실패:', error.message)
  }
}
