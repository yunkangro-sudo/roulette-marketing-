import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'
import { getSubscriptionStatus } from '@/lib/admin/subscription'
import { resolveDashboardRange, enumerateKstDates, toKstDateLabel, type DashboardRange } from '@/lib/admin/dateRange'

/**
 * GET /api/admin/dashboard/summary?range=today|week|month|custom&from=&to=&storeId=
 * advertiser(또는 대리접속 중인 super_admin/agency) 전용 — 로그인한 계정의 매장(store_id) 데이터만 집계한다.
 * 예외적으로 super_admin/agency는 대리접속 없이도 `storeId` 쿼리로 특정 매장의 요약을
 * 읽기 전용으로 조회할 수 있다 (업체 상세 "요약 현황" 탭에서 사용).
 * 기존 다매장 집계용 /api/admin/dashboard(super_admin/agency 전용)는 건드리지 않는다.
 */
export async function GET(request: Request) {
  const account = await requireAdminAuth()
  const { searchParams } = new URL(request.url)
  const queryStoreId = searchParams.get('storeId')

  let storeId: string
  if (account.role === 'advertiser' && account.storeId) {
    storeId = account.storeId
  } else if (['super_admin', 'agency'].includes(account.role) && queryStoreId) {
    storeId = queryStoreId
  } else {
    return NextResponse.json({ error: '조회 권한이 없습니다' }, { status: 403 })
  }

  const range = (searchParams.get('range') ?? 'today') as DashboardRange
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const { startUtc, endUtcExclusive, startDateLabel, endDateLabel } = resolveDashboardRange(range, from, to)

  const supabase = createServerClient()

  const [
    subscriptionStatus,
    activeEventResult,
    participantsResult,
    couponsResult,
    newMembersResult,
    kakaoLoginResult,
    daangnClickResult,
    dailyParticipantsRaw,
    winningCouponsResult,
  ] = await Promise.all([
    getSubscriptionStatus(storeId),
    supabase
      .from('events')
      .select('id, name')
      .eq('store_id', storeId)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('event_type', 'game_start')
      .gte('occurred_at', startUtc)
      .lt('occurred_at', endUtcExclusive),
    supabase
      .from('coupons')
      .select('amount')
      .eq('store_id', storeId)
      .gte('issued_at', startUtc)
      .lt('issued_at', endUtcExclusive),
    supabase
      .from('customer_loyalty')
      .select('kakao_user_id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('kakao_first_login_at', startUtc)
      .lt('kakao_first_login_at', endUtcExclusive),
    supabase
      .from('activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('event_type', 'kakao_login')
      .gte('occurred_at', startUtc)
      .lt('occurred_at', endUtcExclusive),
    supabase
      .from('activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('event_type', 'daangn_click')
      .gte('occurred_at', startUtc)
      .lt('occurred_at', endUtcExclusive),
    supabase
      .from('activity_log')
      .select('occurred_at')
      .eq('store_id', storeId)
      .eq('event_type', 'game_start')
      .gte('occurred_at', startUtc)
      .lt('occurred_at', endUtcExclusive),
    supabase
      .from('coupons')
      .select('label, amount')
      .eq('store_id', storeId)
      .gte('issued_at', startUtc)
      .lt('issued_at', endUtcExclusive),
  ])

  const couponAmountSum = (couponsResult.data ?? []).reduce((sum, c) => sum + (c.amount ?? 0), 0)

  // 일별 참여자 라인차트 (기간 내 날짜별 카운트, 데이터 없는 날은 0)
  const dateBuckets = new Map<string, number>()
  for (const d of enumerateKstDates(startDateLabel, endDateLabel)) dateBuckets.set(d, 0)
  for (const row of dailyParticipantsRaw.data ?? []) {
    const label = toKstDateLabel(row.occurred_at)
    dateBuckets.set(label, (dateBuckets.get(label) ?? 0) + 1)
  }
  const dailyParticipants = [...dateBuckets.entries()].map(([date, count]) => ({
    date: date.slice(5).replace('-', '/'), // MM/DD
    count,
  }))

  // 티어별 당첨 분포 (label 없으면 "N원 쿠폰"으로 대체 표기)
  const tierCounts = new Map<string, number>()
  for (const c of winningCouponsResult.data ?? []) {
    const key = c.label || `${c.amount.toLocaleString()}원 쿠폰`
    tierCounts.set(key, (tierCounts.get(key) ?? 0) + 1)
  }
  const tierDistribution = [...tierCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))

  return NextResponse.json({
    range,
    startDate: startDateLabel,
    endDate: endDateLabel,
    subscriptionStatus,
    hasActiveEvent: !!activeEventResult.data,
    activeEventName: activeEventResult.data?.name ?? null,
    kpi: {
      participants: participantsResult.count ?? 0,
      couponAmount: couponAmountSum,
      newMembers: newMembersResult.count ?? 0,
      kakaoLogins: kakaoLoginResult.count ?? 0,
      daangnClicks: daangnClickResult.count ?? 0,
    },
    dailyParticipants,
    tierDistribution,
  })
}
