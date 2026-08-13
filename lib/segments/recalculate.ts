/**
 * 고객 세그먼트 재계산 — TypeScript 래퍼
 *
 * recalculate_customer_segment PostgreSQL 함수를 호출한다.
 *
 * ⚠️ 구조적 한계 (인지하고 사용):
 *   게임 플레이 시점에만 호출 → 장기 미방문 손님의 AT_RISK/DORMANT는
 *   직접 재방문하기 전까지 갱신되지 않는다.
 *   → 추후 배치 스케줄러(pg_cron 또는 Vercel Cron)로 보완 예정.
 *
 * Silent Fail 원칙:
 *   호출부에서 .catch(() => {}) 로 처리. 세그먼트 계산 실패가
 *   게임 결과나 포인트 적립에 영향을 주면 절대 안 된다.
 */

import { createServerClient } from '@/lib/supabase/server'

export async function recalculateCustomerSegment(
  storeId: string,
  kakaoUserId: string,
): Promise<void> {
  const supabase = createServerClient()

  const { error } = await supabase.rpc('recalculate_customer_segment', {
    p_store_id:      storeId,
    p_kakao_user_id: kakaoUserId,
  })

  if (error) {
    console.error('[segments] recalculate_customer_segment 실패:', error.message)
  }
}

/** 세그먼트 한글 레이블 */
export const SEGMENT_LABELS: Record<string, string> = {
  NEW:      '신규',
  ACTIVE:   '활성',
  AT_RISK:  '이탈 위험',
  DORMANT:  '휴면',
  RETURNED: '복귀',
}

/** 세그먼트 색상 (Tailwind) */
export const SEGMENT_COLORS: Record<string, string> = {
  NEW:      'bg-blue-100 text-blue-700',
  ACTIVE:   'bg-green-100 text-green-700',
  AT_RISK:  'bg-yellow-100 text-yellow-700',
  DORMANT:  'bg-gray-100 text-gray-500',
  RETURNED: 'bg-purple-100 text-purple-700',
}
