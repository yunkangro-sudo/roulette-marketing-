import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/dashboard?year=2026&month=8
 * 모든 매장의 월별 핵심 지표(참여자수, 재방문수, ROI)를 한 번에 반환.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') ?? '')
  const month = parseInt(searchParams.get('month') ?? '')

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'year, month 파라미터가 필요합니다' }, { status: 400 })
  }

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const supabase = createServerClient()

  // 전체 매장 목록
  const { data: eventsData } = await supabase
    .from('events')
    .select('store_id')
    .neq('status', 'draft')

  const storeIds = [...new Set((eventsData ?? []).map((e) => e.store_id))]
  if (storeIds.length === 0) {
    return NextResponse.json({ stores: [], averageRoi: null })
  }

  // 매장 설정
  const { data: settingsData } = await supabase
    .from('store_settings')
    .select('store_id, store_name, monthly_ad_budget, average_order_value')
    .in('store_id', storeIds)

  const settingsMap = Object.fromEntries(
    (settingsData ?? []).map((s) => [s.store_id, s])
  )

  // 각 매장별 집계
  const results = await Promise.all(
    storeIds.map(async (storeId) => {
      const settings = settingsMap[storeId] ?? {}

      const [participantsRes, couponsUsedRes, paymentRes, thisMonthUsersRes] = await Promise.all([
        supabase
          .from('daily_participation_log')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .gte('date', monthStart)
          .lt('date', monthEnd),
        supabase
          .from('coupons')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('status', 'used')
          .gte('used_at', monthStart)
          .lt('used_at', monthEnd),
        supabase
          .from('payment_logs')
          .select('amount')
          .eq('store_id', storeId)
          .gte('recorded_at', monthStart)
          .lt('recorded_at', monthEnd),
        supabase
          .from('daily_participation_log')
          .select('kakao_user_id')
          .eq('store_id', storeId)
          .gte('date', monthStart)
          .lt('date', monthEnd),
      ])

      const participants = participantsRes.count ?? 0
      const couponsUsed = couponsUsedRes.count ?? 0
      const payments = paymentRes.data ?? []
      const paymentTotal = payments.reduce((s, p) => s + p.amount, 0)
      const paymentCount = payments.length

      // 재방문 계산
      const thisMonthUserIds = [
        ...new Set((thisMonthUsersRes.data ?? []).map((r) => r.kakao_user_id)),
      ]
      let returningVisitors = 0
      if (thisMonthUserIds.length > 0) {
        const { count } = await supabase
          .from('daily_participation_log')
          .select('kakao_user_id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .lt('date', monthStart)
          .in('kakao_user_id', thisMonthUserIds)
        returningVisitors = count ?? 0
      }

      const adBudget = settings.monthly_ad_budget ?? 0
      const avgOrderValue = settings.average_order_value ?? 0
      const isActual = paymentCount > 0
      const additionalRevenue = isActual ? paymentTotal : avgOrderValue * returningVisitors
      const roi = adBudget > 0 ? Math.round((additionalRevenue / adBudget) * 10) / 10 : null

      return {
        storeId,
        storeName: settings.store_name ?? storeId,
        participants,
        couponsUsed,
        returningVisitors,
        isActual,
        paymentCount,
        additionalRevenue,
        adBudget,
        roi,
      }
    })
  )

  const roisWithValue = results.filter((r) => r.roi !== null).map((r) => r.roi as number)
  const averageRoi =
    roisWithValue.length > 0
      ? Math.round((roisWithValue.reduce((a, b) => a + b, 0) / roisWithValue.length) * 10) / 10
      : null

  return NextResponse.json({ stores: results, averageRoi, year, month })
}
