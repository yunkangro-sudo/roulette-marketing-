import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'
import { classifySubscription } from '@/lib/admin/subscription'
import { resolveDashboardRange, enumerateKstDates, toKstDateLabel, type DashboardRange } from '@/lib/admin/dateRange'

const TOP_STORES_LIMIT = 10
const EXPIRING_SOON_DAYS = 7

function daysUntil(dateStr: string): number {
  const diff = new Date(`${dateStr}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / 86400000)
}

/** reward_catalog.reward_type enum → 화면 표시용 한글 라벨 */
const REWARD_TYPE_LABELS: Record<string, string> = {
  free_item: '무료상품',
  discount: '할인쿠폰',
  points: '포인트추가',
  experience: '체험서비스',
  special_coupon: '스페셜쿠폰',
  vip_reward: 'VIP리워드',
}

/**
 * GET /api/admin/super/dashboard?range=today|week|month
 * super_admin/agency 전용 — 전체 매장 합산 KPI. 대리접속 중(=effective role이 advertiser로
 * 스왑된 상태)에는 접근할 이유가 없으므로 실제 role 기준으로만 허용한다.
 */
export async function GET(request: Request) {
  const account = await requireAdminAuth()
  if (!['super_admin', 'agency'].includes(account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const range = (searchParams.get('range') ?? 'today') as DashboardRange
  const { startUtc, endUtcExclusive, startDateLabel, endDateLabel } = resolveDashboardRange(range)

  // 재방문 코호트 계산용 "직전 동일 길이 기간" — 이번 구간 길이만큼 앞으로 당긴 구간
  const rangeLengthMs = new Date(endUtcExclusive).getTime() - new Date(startUtc).getTime()
  const prevStartUtc = new Date(new Date(startUtc).getTime() - rangeLengthMs).toISOString()
  const prevEndUtcExclusive = startUtc

  const supabase = createServerClient()

  const [
    { data: stores },
    { data: subscriptions },
    participantsResult,
    couponsResult,
    revenueResult,
    dailyParticipantsRaw,
    newMembersResult,
    daangnClicksResult,
    rewardCatalogResult,
    couponsUsedRangeResult,
    cohortResult,
    convertedResult,
  ] = await Promise.all([
    supabase.from('store_contracts').select('id, store_id, store_name, created_at'),
    supabase
      .from('subscriptions')
      .select('store_id, start_date, end_date, amount_paid, created_at')
      .order('end_date', { ascending: false }),
    supabase
      .from('activity_log')
      .select('store_id')
      .eq('event_type', 'game_start')
      .gte('occurred_at', startUtc)
      .lt('occurred_at', endUtcExclusive),
    supabase
      .from('coupons')
      .select('amount, issued_at')
      .gte('issued_at', startUtc)
      .lt('issued_at', endUtcExclusive),
    supabase
      .from('subscriptions')
      .select('amount_paid')
      .gte('created_at', startUtc)
      .lt('created_at', endUtcExclusive),
    supabase
      .from('activity_log')
      .select('occurred_at')
      .eq('event_type', 'game_start')
      .gte('occurred_at', startUtc)
      .lt('occurred_at', endUtcExclusive),

    // 전체 가입 회원수 (신규 카카오 인증 완료 기준, 매장 합산)
    supabase
      .from('customer_loyalty')
      .select('store_id', { count: 'exact', head: true })
      .gte('kakao_first_login_at', startUtc)
      .lt('kakao_first_login_at', endUtcExclusive),

    // 당근 단골 클릭수 (전체 합산, 클릭 기준 — 실제 단골추가 확정 아님)
    supabase
      .from('activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'daangn_click')
      .gte('occurred_at', startUtc)
      .lt('occurred_at', endUtcExclusive),

    // 리워드 유형별 등록 비율 (전체 매장, 활성 리워드 기준 — 기간 무관 스냅샷)
    supabase.from('reward_catalog').select('reward_type').eq('active', true),

    // 쿠폰 사용통계: 이번 구간에 "사용 처리"된 쿠폰
    supabase
      .from('coupons')
      .select('used_at')
      .eq('status', 'used')
      .gte('used_at', startUtc)
      .lt('used_at', endUtcExclusive),

    // 재방문 통계: 직전 동일기간에 신규 유입된 코호트
    supabase
      .from('customer_loyalty')
      .select('store_id', { count: 'exact', head: true })
      .gte('first_seen_at', prevStartUtc)
      .lt('first_seen_at', prevEndUtcExclusive),

    // 그 코호트 중 이번 구간에 재방문(방문기록 갱신)한 수
    supabase
      .from('customer_loyalty')
      .select('store_id', { count: 'exact', head: true })
      .gte('first_seen_at', prevStartUtc)
      .lt('first_seen_at', prevEndUtcExclusive)
      .gte('last_visit_at', startUtc)
      .lt('last_visit_at', endUtcExclusive),
  ])

  const allStores = stores ?? []

  // 매장별 최신 구독(end_date가 가장 최근인 row)만 남긴다 — subscriptions가 "이용기간"의 진실 원천
  const latestSubByStore = new Map<string, { start_date: string; end_date: string }>()
  for (const s of subscriptions ?? []) {
    if (!latestSubByStore.has(s.store_id)) latestSubByStore.set(s.store_id, s)
  }

  // 매장 상태 분해 (정상/유예/만료/체험)
  const statusBreakdown = { active: 0, grace: 0, expired: 0, trial: 0 }
  const expiringSoon: Array<{ storeId: string; storeName: string; endDate: string; status: string; graceDaysLeft: number | null }> = []

  for (const store of allStores) {
    const sub = latestSubByStore.get(store.store_id)
    const classified = classifySubscription(sub?.start_date ?? null, sub?.end_date ?? null)
    statusBreakdown[classified.status] += 1

    if (classified.status === 'grace') {
      expiringSoon.push({
        storeId: store.store_id,
        storeName: store.store_name,
        endDate: classified.endDate!,
        status: 'grace',
        graceDaysLeft: classified.graceDaysLeft,
      })
    } else if (classified.status === 'active' && classified.endDate) {
      const d = daysUntil(classified.endDate)
      if (d >= 0 && d <= EXPIRING_SOON_DAYS) {
        expiringSoon.push({
          storeId: store.store_id,
          storeName: store.store_name,
          endDate: classified.endDate,
          status: 'active',
          graceDaysLeft: null,
        })
      }
    }
  }
  // 유예기간(이미 만료) 먼저, 그 다음 종료일 임박순
  expiringSoon.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'grace' ? -1 : 1
    return a.endDate < b.endDate ? -1 : a.endDate > b.endDate ? 1 : 0
  })

  const newStoresInRange = allStores.filter(
    (s) => s.created_at >= startUtc && s.created_at < endUtcExclusive
  ).length

  const couponAmountSum = (couponsResult.data ?? []).reduce((sum, c) => sum + (c.amount ?? 0), 0)
  const subscriptionRevenueSum = (revenueResult.data ?? []).reduce((sum, s) => sum + (s.amount_paid ?? 0), 0)

  // 일별 전체 참여자 추이 (전 매장 합산)
  const dateBuckets = new Map<string, number>()
  for (const d of enumerateKstDates(startDateLabel, endDateLabel)) dateBuckets.set(d, 0)
  for (const row of dailyParticipantsRaw.data ?? []) {
    const label = toKstDateLabel(row.occurred_at)
    dateBuckets.set(label, (dateBuckets.get(label) ?? 0) + 1)
  }
  const dailyParticipants = [...dateBuckets.entries()].map(([date, count]) => ({
    date: date.slice(5).replace('-', '/'),
    count,
  }))

  // 매장별 참여자 Top 10
  const storeNameById = new Map(allStores.map((s) => [s.store_id, s.store_name]))
  const participantsByStore = new Map<string, number>()
  for (const row of participantsResult.data ?? []) {
    participantsByStore.set(row.store_id, (participantsByStore.get(row.store_id) ?? 0) + 1)
  }
  const topStores = [...participantsByStore.entries()]
    .map(([storeId, count]) => ({ storeId, storeName: storeNameById.get(storeId) ?? storeId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_STORES_LIMIT)

  // 업체 가입현황 추이 (일별, store_contracts.created_at 기준)
  const signupBuckets = new Map<string, number>()
  for (const d of enumerateKstDates(startDateLabel, endDateLabel)) signupBuckets.set(d, 0)
  for (const s of allStores) {
    if (s.created_at < startUtc || s.created_at >= endUtcExclusive) continue
    const label = toKstDateLabel(s.created_at)
    if (signupBuckets.has(label)) signupBuckets.set(label, (signupBuckets.get(label) ?? 0) + 1)
  }
  const signupTrend = [...signupBuckets.entries()].map(([date, count]) => ({
    date: date.slice(5).replace('-', '/'),
    count,
  }))

  // 리워드 유형별 등록 비율
  const rewardTypeCounts = new Map<string, number>()
  for (const row of rewardCatalogResult.data ?? []) {
    rewardTypeCounts.set(row.reward_type, (rewardTypeCounts.get(row.reward_type) ?? 0) + 1)
  }
  const rewardTotal = [...rewardTypeCounts.values()].reduce((sum, n) => sum + n, 0)
  const rewardStats = [...rewardTypeCounts.entries()]
    .map(([type, count]) => ({
      type,
      label: REWARD_TYPE_LABELS[type] ?? type,
      count,
      percent: rewardTotal > 0 ? Math.round((count / rewardTotal) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // 쿠폰 발급 대비 사용률 (이번 구간 발급 건 기준 모수, 사용은 상태 전환된 건 기준)
  const couponsIssuedCount = (couponsResult.data ?? []).length
  const couponsUsedCount = (couponsUsedRangeResult.data ?? []).length
  const couponUsageRate = couponsIssuedCount > 0 ? Math.round((couponsUsedCount / couponsIssuedCount) * 100) : null

  // 재방문 통계 (직전 동일기간 신규 코호트 중 이번 구간 재방문 비율)
  const revisitCohortCount = cohortResult.count ?? 0
  const revisitConvertedCount = convertedResult.count ?? 0
  const revisitRate = revisitCohortCount > 0 ? Math.round((revisitConvertedCount / revisitCohortCount) * 100) : null

  return NextResponse.json({
    range,
    startDate: startDateLabel,
    endDate: endDateLabel,
    kpi: {
      totalStores: allStores.length,
      statusBreakdown,
      totalParticipants: participantsResult.data?.length ?? 0,
      totalCouponAmount: couponAmountSum,
      subscriptionRevenue: subscriptionRevenueSum,
      newStores: newStoresInRange,
      newMembers: newMembersResult.count ?? 0,
      daangnClicks: daangnClicksResult.count ?? 0,
    },
    expiringSoon,
    dailyParticipants,
    topStores,
    signupTrend,
    rewardStats,
    couponStats: {
      issued: couponsIssuedCount,
      used: couponsUsedCount,
      usageRate: couponUsageRate,
    },
    revisit: {
      cohortCount: revisitCohortCount,
      convertedCount: revisitConvertedCount,
      rate: revisitRate,
      hasEnoughData: revisitCohortCount > 0,
    },
  })
}
