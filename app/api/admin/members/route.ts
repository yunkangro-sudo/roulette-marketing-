import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'
import { decryptPhone } from '@/lib/crypto/phoneEncryption'
import { maskPhoneLast4 } from '@/lib/admin/maskPhone'
import { resolveDashboardRange, enumerateKstDates, toKstDateLabel, type DashboardRange } from '@/lib/admin/dateRange'

const MEMBER_LIST_LIMIT = 200

/**
 * GET /api/admin/members?range=today|week|month|custom&from=&to=
 * advertiser 전용(자기 매장만). 전화번호는 절대 평문으로 내려주지 않고 뒷 4자리만 마스킹한다.
 * 엑셀 등 대량 다운로드 기능은 의도적으로 제공하지 않는다.
 */
export async function GET(request: Request) {
  const account = await requireAdminAuth()
  if (account.role !== 'advertiser' || !account.storeId) {
    return NextResponse.json({ error: '광고주 계정만 조회할 수 있습니다' }, { status: 403 })
  }
  const storeId = account.storeId

  const { searchParams } = new URL(request.url)
  const range = (searchParams.get('range') ?? 'month') as DashboardRange
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const { startUtc, endUtcExclusive, startDateLabel, endDateLabel } = resolveDashboardRange(range, from, to)

  const supabase = createServerClient()

  const [
    totalMembersResult,
    newMembersInRangeResult,
    kakaoLoginResult,
    daangnClickCountResult,
    newSignupsRaw,
    memberListResult,
    daangnClickedUsersResult,
  ] = await Promise.all([
    supabase
      .from('customer_loyalty')
      .select('kakao_user_id', { count: 'exact', head: true })
      .eq('store_id', storeId),
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
      .from('customer_loyalty')
      .select('kakao_first_login_at')
      .eq('store_id', storeId)
      .gte('kakao_first_login_at', startUtc)
      .lt('kakao_first_login_at', endUtcExclusive),
    supabase
      .from('customer_loyalty')
      .select('kakao_user_id, phone_encrypted, first_seen_at, last_visit_at, visit_count, kakao_first_login_at, segment')
      .eq('store_id', storeId)
      .order('last_visit_at', { ascending: false })
      .limit(MEMBER_LIST_LIMIT),
    supabase
      .from('activity_log')
      .select('kakao_user_id')
      .eq('store_id', storeId)
      .eq('event_type', 'daangn_click'),
  ])

  const daangnClickedUserSet = new Set((daangnClickedUsersResult.data ?? []).map((r) => r.kakao_user_id))

  // 일별 신규가입 라인차트
  const dateBuckets = new Map<string, number>()
  for (const d of enumerateKstDates(startDateLabel, endDateLabel)) dateBuckets.set(d, 0)
  for (const row of newSignupsRaw.data ?? []) {
    if (!row.kakao_first_login_at) continue
    const label = toKstDateLabel(row.kakao_first_login_at)
    dateBuckets.set(label, (dateBuckets.get(label) ?? 0) + 1)
  }
  const dailySignups = [...dateBuckets.entries()].map(([date, count]) => ({
    date: date.slice(5).replace('-', '/'),
    count,
  }))

  const members = (memberListResult.data ?? []).map((m) => {
    const decrypted = m.phone_encrypted ? decryptPhone(m.phone_encrypted) : null
    return {
      maskedPhone: maskPhoneLast4(decrypted),
      firstSeenAt: m.first_seen_at,
      lastVisitAt: m.last_visit_at,
      visitCount: m.visit_count,
      kakaoLinked: !!m.kakao_first_login_at,
      daangnClicked: daangnClickedUserSet.has(m.kakao_user_id),
      segment: m.segment,
    }
  })

  return NextResponse.json({
    range, startDate: startDateLabel, endDate: endDateLabel,
    kpi: {
      newMembers: newMembersInRangeResult.count ?? 0,
      totalMembers: totalMembersResult.count ?? 0,
      kakaoLogins: kakaoLoginResult.count ?? 0,
      daangnClicks: daangnClickCountResult.count ?? 0,
    },
    dailySignups,
    members,
    memberListLimited: (memberListResult.data ?? []).length >= MEMBER_LIST_LIMIT,
  })
}
