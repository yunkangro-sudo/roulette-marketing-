/**
 * 매장 홈페이지(/b/{slug}) "오늘·이번달, 우리 매장" 섹션 집계.
 *
 * 참여자 수가 적을 때 텅 빈 숫자를 그대로 보여주면 오히려 역효과라는 걸
 * 성과리포트(/admin/report) 작업에서 이미 확인한 원칙을 그대로 적용한다 —
 * "이번 달" 기준 참여자 수가 MIN_PARTICIPANTS_TO_SHOW 미만이면 섹션 자체를 숨긴다
 * (오늘/이번달 토글은 섹션이 노출된 다음에야 의미가 있고, "오늘" 숫자만으로
 * 노출 여부를 판단하면 항상 숨겨지는 매장이 대부분이라 "이번 달" 기준으로 판단).
 *
 * 관리자 대시보드(/admin/dashboard 등)의 기간 토글 UI를 그대로 재사용하지 않는다 —
 * 그 화면들은 구독료/매출 같은 민감 데이터와 같은 화면에 섞여 있어서, 공개 페이지에
 * 그대로 옮기면 안 된다. 계산 로직만 이 모듈로 분리해서 재사용한다.
 */
import { createServerClient } from '@/lib/supabase/server'

export const MIN_PARTICIPANTS_TO_SHOW = 10

export type PeriodRange = 'today' | 'month'

export interface PeriodStats {
  participantCount: number
  /** 0~100 정수. 해당 기간 참여자 중 그 이전에도 참여 기록이 있는 사람의 비율 */
  revisitRate: number
  /** 해당 기간에 발급된 쿠폰(게임당첨+리워드교환+스탬프리워드 등) 수 — "지급된 혜택 수" */
  issuedCount: number
}

export interface LiveStats {
  today: PeriodStats
  month: PeriodStats
  /** "이번 달" 참여자 수가 임계값 미만이면 true — 섹션 전체를 숨겨야 함 */
  belowThreshold: boolean
}

function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

function dateRangeFor(range: PeriodRange): { start: string; end: string } {
  const now = kstNow()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const d = now.getUTCDate()

  if (range === 'today') {
    const start = new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10)
    const end = new Date(Date.UTC(y, m, d + 1)).toISOString().slice(0, 10)
    return { start, end }
  }
  const start = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)
  const end = new Date(Date.UTC(y, m + 1, 1)).toISOString().slice(0, 10)
  return { start, end }
}

async function computePeriodStats(storeId: string, range: PeriodRange): Promise<PeriodStats> {
  const supabase = createServerClient()
  const { start, end } = dateRangeFor(range)

  const [participantsRes, issuedRes] = await Promise.all([
    supabase
      .from('daily_participation_log')
      .select('kakao_user_id')
      .eq('store_id', storeId)
      .gte('date', start)
      .lt('date', end),
    supabase
      .from('coupons')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('issued_at', `${start}T00:00:00+09:00`)
      .lt('issued_at', `${end}T00:00:00+09:00`),
  ])

  const userIds = [...new Set((participantsRes.data ?? []).map((r) => r.kakao_user_id))]
  const participantCount = userIds.length

  let returningVisitors = 0
  if (userIds.length > 0) {
    const { count } = await supabase
      .from('daily_participation_log')
      .select('kakao_user_id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .lt('date', start)
      .in('kakao_user_id', userIds)
    returningVisitors = count ?? 0
  }

  return {
    participantCount,
    revisitRate: participantCount > 0 ? Math.round((returningVisitors / participantCount) * 100) : 0,
    issuedCount: issuedRes.count ?? 0,
  }
}

/** today/month 통계를 한 번에 계산하고, "이번 달" 참여자 수로 노출 여부를 판단한다 */
export async function getLiveStats(storeId: string): Promise<LiveStats> {
  const [today, month] = await Promise.all([
    computePeriodStats(storeId, 'today'),
    computePeriodStats(storeId, 'month'),
  ])
  return { today, month, belowThreshold: month.participantCount < MIN_PARTICIPANTS_TO_SHOW }
}
