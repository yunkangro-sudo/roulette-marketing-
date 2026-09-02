/**
 * 매장 홈페이지(/b/{slug}) "신뢰지표" 섹션 집계.
 *
 * 참여자 수가 적을 때 텅 빈 숫자를 그대로 보여주면 오히려 역효과라는 걸
 * 성과리포트(/admin/report) 작업에서 이미 확인한 원칙을 그대로 적용한다 —
 * MIN_PARTICIPANTS 미만이면 null을 반환해 섹션 자체를 숨긴다.
 */
import { createServerClient } from '@/lib/supabase/server'

export const MIN_PARTICIPANTS_TO_SHOW = 10

export interface TrustMetrics {
  participantCount: number
  /** 0~100 정수. 이번 달 참여자 중 이전에도 참여 기록이 있는 사람의 비율 */
  revisitRate: number
}

function monthRangeKst(): { monthStart: string; monthEnd: string } {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000) // KST
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const monthStart = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)
  const monthEnd = new Date(Date.UTC(y, m + 1, 1)).toISOString().slice(0, 10)
  return { monthStart, monthEnd }
}

/** 참여자 수가 임계값 미만이면 null (섹션 숨김) */
export async function getTrustMetrics(storeId: string): Promise<TrustMetrics | null> {
  const supabase = createServerClient()
  const { monthStart, monthEnd } = monthRangeKst()

  const { data: participants } = await supabase
    .from('daily_participation_log')
    .select('kakao_user_id')
    .eq('store_id', storeId)
    .gte('date', monthStart)
    .lt('date', monthEnd)

  const thisMonthUserIds = [...new Set((participants ?? []).map((r) => r.kakao_user_id))]
  const participantCount = thisMonthUserIds.length

  if (participantCount < MIN_PARTICIPANTS_TO_SHOW) return null

  let returningVisitors = 0
  const { count } = await supabase
    .from('daily_participation_log')
    .select('kakao_user_id', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .lt('date', monthStart)
    .in('kakao_user_id', thisMonthUserIds)
  returningVisitors = count ?? 0

  return {
    participantCount,
    revisitRate: Math.round((returningVisitors / participantCount) * 100),
  }
}
