import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/report?store_id=xxx&year=2026&month=8
 *
 * 월별 성과 퍼널 데이터 반환:
 *   광고비 → 참여자수 → 쿠폰발급 → 쿠폰사용 → 재방문 → 추가매출(실측/추정) → ROI
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('store_id')
  const year = parseInt(searchParams.get('year') ?? '')
  const month = parseInt(searchParams.get('month') ?? '')

  if (!storeId || isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'store_id, year, month 파라미터가 필요합니다' }, { status: 400 })
  }

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const supabase = createServerClient()

  const [
    settingsResult,
    participantsResult,
    couponsIssuedResult,
    couponsUsedResult,
    paymentResult,
    allParticipantsResult,
  ] = await Promise.all([
    // 매장 설정 (광고비, 객단가)
    supabase
      .from('store_settings')
      .select('store_name, monthly_ad_budget, average_order_value')
      .eq('store_id', storeId)
      .maybeSingle(),

    // 이번 달 참여자 수 (daily_participation_log)
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

    // 이번 달 payment_logs 합계
    supabase
      .from('payment_logs')
      .select('amount')
      .eq('store_id', storeId)
      .gte('recorded_at', monthStart)
      .lt('recorded_at', monthEnd),

    // 재방문 계산용: 이번 달 참여자 전체 목록 (kakao_user_id)
    supabase
      .from('daily_participation_log')
      .select('kakao_user_id')
      .eq('store_id', storeId)
      .gte('date', monthStart)
      .lt('date', monthEnd),
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
  const participants = participantsResult.count ?? 0
  const couponsIssued = couponsIssuedResult.count ?? 0
  const couponsUsed = couponsUsedResult.count ?? 0

  const payments = paymentResult.data ?? []
  const paymentSampleCount = payments.length
  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)

  const adBudget = settings?.monthly_ad_budget ?? 0
  const avgOrderValue = settings?.average_order_value ?? 0

  // 추가 매출: 실측(payment_logs 있음) vs 추정(객단가 × 재방문)
  const isActual = paymentSampleCount > 0
  const additionalRevenue = isActual
    ? paymentTotal
    : avgOrderValue * returningVisitors

  // ROI = 추가매출 ÷ 광고비 (광고비 0이면 null)
  const roi = adBudget > 0 ? Math.round((additionalRevenue / adBudget) * 10) / 10 : null

  return NextResponse.json({
    storeId,
    storeName: settings?.store_name ?? storeId,
    year,
    month,
    adBudget,
    avgOrderValue,
    participants,
    couponsIssued,
    couponsUsed,
    returningVisitors,
    paymentSampleCount,
    paymentTotal,
    additionalRevenue: {
      value: additionalRevenue,
      isActual,
      sampleCount: paymentSampleCount,
    },
    roi,
  })
}
