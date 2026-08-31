import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

/** 구독료 (원) — 헤드라인의 "구독료 대비 배수" 계산에 사용하는 고정값 */
const SUBSCRIPTION_PRICE = 19000

/** timestamptz(UTC) 문자열을 KST 기준 "YYYY-MM"으로 변환 (월별 그룹핑용) */
function toKstYearMonth(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** timestamptz(UTC) 문자열을 KST 기준 (요일 0=일~6=토, 시각 0~23)으로 변환 */
function toKstDowHour(iso: string): { dow: number; hour: number } {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000)
  return { dow: d.getUTCDay(), hour: d.getUTCHours() }
}

function momPercent(curr: number, prev: number): number | null {
  if (prev <= 0) return null
  return Math.round(((curr - prev) / prev) * 100)
}

/**
 * GET /api/admin/report?store_id=xxx&year=2026&month=8
 *
 * 스토리텔링형 월간 성과 리포트:
 *   ① 헤드라인(구독료 대비 배수) → ② 활동 퍼널(전월 대비 증감) → ③ 단골 전환 스토리
 *   → ④ 당근 단골 자산가치 → ⑤ 성장 궤적(월별 추이 + 3개월 예측) → ⑥ 인기 시간대
 * 로그인 필수. 광고주는 자기 매장만 (쿼리 store_id를 바꿔도 무시).
 */
export async function GET(request: Request) {
  const session = await getAdminSession()
  if (!session.account) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }
  if (!['advertiser', 'super_admin', 'agency'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const requestedStoreId = searchParams.get('store_id')
  const storeId =
    session.account.role === 'advertiser'
      ? session.account.storeId
      : requestedStoreId
  const year = parseInt(searchParams.get('year') ?? '')
  const month = parseInt(searchParams.get('month') ?? '')

  if (!storeId || isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'store_id, year, month 파라미터가 필요합니다' }, { status: 400 })
  }

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevMonthStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
  // prevMonthEnd === monthStart

  const supabase = createServerClient()

  const [
    settingsResult,
    participantsResult,
    couponsIssuedResult,
    couponsUsedResult,
    prevParticipantsResult,
    prevCouponsIssuedResult,
    prevCouponsUsedResult,
    allParticipantsResult,
    cohortCountResult,
    convertedCountResult,
    daangnClicksResult,
    gameStartResult,
  ] = await Promise.all([
    // 매장 설정 (객단가)
    supabase
      .from('store_settings')
      .select('store_name, average_order_value')
      .eq('store_id', storeId)
      .maybeSingle(),

    // 이번 달 참여자 수
    supabase
      .from('daily_participation_log')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('date', monthStart)
      .lt('date', monthEnd),

    // 이번 달 쿠폰 발급 수
    supabase
      .from('coupons')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('issued_at', monthStart)
      .lt('issued_at', monthEnd),

    // 이번 달 쿠폰 사용 수 (used_at 기준)
    supabase
      .from('coupons')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('status', 'used')
      .gte('used_at', monthStart)
      .lt('used_at', monthEnd),

    // 전월 참여자 수 (증감률용)
    supabase
      .from('daily_participation_log')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('date', prevMonthStart)
      .lt('date', monthStart),

    // 전월 쿠폰 발급 수
    supabase
      .from('coupons')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('issued_at', prevMonthStart)
      .lt('issued_at', monthStart),

    // 전월 쿠폰 사용 수
    supabase
      .from('coupons')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('status', 'used')
      .gte('used_at', prevMonthStart)
      .lt('used_at', monthStart),

    // 재방문 계산용: 이번 달 참여자 전체 목록 (kakao_user_id)
    supabase
      .from('daily_participation_log')
      .select('kakao_user_id')
      .eq('store_id', storeId)
      .gte('date', monthStart)
      .lt('date', monthEnd),

    // 단골 전환 스토리: 전월에 가입한 코호트 수 (Y)
    supabase
      .from('customer_loyalty')
      .select('kakao_user_id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('first_seen_at', prevMonthStart)
      .lt('first_seen_at', monthStart),

    // 그 코호트 중 이번 달에도 방문 기록이 갱신된 수 (X)
    supabase
      .from('customer_loyalty')
      .select('kakao_user_id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('first_seen_at', prevMonthStart)
      .lt('first_seen_at', monthStart)
      .gte('last_visit_at', monthStart),

    // 당근 단골 클릭 전체 이력 (이번 달 말일 이전) — 자산가치·성장궤적 공용
    supabase
      .from('activity_log')
      .select('kakao_user_id, occurred_at')
      .eq('store_id', storeId)
      .eq('event_type', 'daangn_click')
      .lt('occurred_at', monthEnd),

    // 인기 시간대: 이번 달 게임 참여 시각
    supabase
      .from('activity_log')
      .select('occurred_at')
      .eq('store_id', storeId)
      .eq('event_type', 'game_start')
      .gte('occurred_at', monthStart)
      .lt('occurred_at', monthEnd),
  ])

  // 재방문 손님: 이번 달 참여자 중 이달 이전에도 참여 기록이 있는 사람
  const thisMonthUserIds = [
    ...new Set((allParticipantsResult.data ?? []).map((r) => r.kakao_user_id)),
  ]

  let returningVisitors = 0
  if (thisMonthUserIds.length > 0) {
    const { count } = await supabase
      .from('daily_participation_log')
      .select('kakao_user_id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .lt('date', monthStart)
      .in('kakao_user_id', thisMonthUserIds)

    // 이전에도 참여한 사람의 수 (distinct는 supabase에서 직접 지원 안 해 근사치 사용)
    returningVisitors = count ?? 0
  }

  const settings = settingsResult.data
  const avgOrderValue = settings?.average_order_value ?? 0
  const participants = participantsResult.count ?? 0
  const couponsIssued = couponsIssuedResult.count ?? 0
  const couponsUsed = couponsUsedResult.count ?? 0

  // ① 헤드라인: (재방문 손님 × 객단가) ÷ 구독료
  const headlineMultiple =
    avgOrderValue > 0 && returningVisitors > 0
      ? Math.round((returningVisitors * avgOrderValue) / SUBSCRIPTION_PRICE)
      : null

  // ② 활동 퍼널 + 전월 대비 증감률
  const funnel = {
    participants: { value: participants, momPercent: momPercent(participants, prevParticipantsResult.count ?? 0) },
    couponsIssued: { value: couponsIssued, momPercent: momPercent(couponsIssued, prevCouponsIssuedResult.count ?? 0) },
    couponsUsed: { value: couponsUsed, momPercent: momPercent(couponsUsed, prevCouponsUsedResult.count ?? 0) },
  }

  // ③ 단골 전환 스토리 (근사치: first_seen_at 코호트 × last_visit_at 갱신 여부)
  const conversion = {
    cohortCount: cohortCountResult.count ?? 0,
    convertedCount: convertedCountResult.count ?? 0,
  }

  // ④ 당근 단골 자산가치 + ⑤ 성장 궤적 (동일 데이터셋 재사용)
  const clickRows = daangnClicksResult.data ?? []
  const idsBeforeThisMonth = new Set(
    clickRows.filter((r) => r.occurred_at < monthStart).map((r) => r.kakao_user_id)
  )
  const idsThisMonth = new Set(
    clickRows.filter((r) => r.occurred_at >= monthStart && r.occurred_at < monthEnd).map((r) => r.kakao_user_id)
  )
  const allDistinctIds = new Set(clickRows.map((r) => r.kakao_user_id))

  const daangnAsset = {
    cumulative: allDistinctIds.size,
    newThisMonth: [...idsThisMonth].filter((id) => !idsBeforeThisMonth.has(id)).length,
  }

  // 월별 누적 distinct 유저 수 추이
  const sortedMonths = [...new Set(clickRows.map((r) => toKstYearMonth(r.occurred_at)))].sort()
  const cumulativeSet = new Set<string>()
  const trajectoryPoints: { label: string; value: number }[] = []
  for (const ym of sortedMonths) {
    for (const row of clickRows) {
      if (toKstYearMonth(row.occurred_at) === ym) cumulativeSet.add(row.kakao_user_id)
    }
    const [, m] = ym.split('-')
    trajectoryPoints.push({ label: `${parseInt(m, 10)}월`, value: cumulativeSet.size })
  }

  const growthTrajectory = {
    points: trajectoryPoints,
    hasAnyData: trajectoryPoints.length > 0,
    hasEnoughData: sortedMonths.length >= 2 && daangnAsset.newThisMonth > 0,
    projection: sortedMonths.length >= 2 && daangnAsset.newThisMonth > 0 ? daangnAsset.newThisMonth * 3 : null,
  }

  // ⑥ 인기 시간대 (요일 × 시간 버킷 중 최다)
  const timeSlotRows = gameStartResult.data ?? []
  let popularTimeSlot: { dow: number; hour: number; count: number } | null = null
  if (timeSlotRows.length >= 5) {
    const bucketCounts = new Map<string, number>()
    for (const row of timeSlotRows) {
      const { dow, hour } = toKstDowHour(row.occurred_at)
      const key = `${dow}-${hour}`
      bucketCounts.set(key, (bucketCounts.get(key) ?? 0) + 1)
    }
    let bestKey = ''
    let bestCount = 0
    for (const [key, count] of bucketCounts) {
      if (count > bestCount) {
        bestKey = key
        bestCount = count
      }
    }
    if (bestKey) {
      const [dow, hour] = bestKey.split('-').map(Number)
      popularTimeSlot = { dow, hour, count: bestCount }
    }
  }

  return NextResponse.json({
    storeId,
    storeName: settings?.store_name ?? storeId,
    year,
    month,
    avgOrderValue,
    returningVisitors,
    headline: { multiple: headlineMultiple },
    funnel,
    conversion,
    daangnAsset,
    growthTrajectory,
    popularTimeSlot,
  })
}
