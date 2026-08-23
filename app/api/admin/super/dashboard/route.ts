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

  const supabase = createServerClient()

  const [
    { data: stores },
    { data: subscriptions },
    participantsResult,
    couponsResult,
    revenueResult,
    dailyParticipantsRaw,
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
      .select('amount')
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
    },
    expiringSoon,
    dailyParticipants,
    topStores,
  })
}
