import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession, getAllowedStoreId } from '@/lib/admin/session'
import { resolveDashboardRange, type DashboardRange } from '@/lib/admin/dateRange'

const STATUS_FILTER_MAP: Record<string, string[] | null> = {
  all:        null,
  unused:     ['issued', 'pending_verify'],
  used:       ['used'],
  expired:    ['expired'],
  unverified: ['unverified'],
}

/**
 * GET /api/admin/coupons?range=&from=&to=&status=&store_id=
 * advertiser는 자기 매장만, agency/super_admin은 store_id 파라미터로 필터(선택).
 * 전화번호는 이 테이블에 저장되지 않으므로(kakao_user_id만 보유) 별도 마스킹 불필요.
 */
export async function GET(request: Request) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['advertiser', 'agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const range = (searchParams.get('range') ?? 'month') as DashboardRange
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const statusFilter = searchParams.get('status') ?? 'all'
  const { startUtc, endUtcExclusive, startDateLabel, endDateLabel } = resolveDashboardRange(range, from, to)

  const allowedStoreId = getAllowedStoreId(session.account)
  const storeId = allowedStoreId ?? searchParams.get('store_id')
  if (!storeId) return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })

  const supabase = createServerClient()

  let query = supabase
    .from('coupons')
    .select('id, label, amount, status, issued_at, used_at, valid_until, verified_by_staff_id, source_type')
    .eq('store_id', storeId)
    .gte('issued_at', startUtc)
    .lt('issued_at', endUtcExclusive)
    .order('issued_at', { ascending: false })

  const statuses = STATUS_FILTER_MAP[statusFilter]
  if (statuses) query = query.in('status', statuses)

  const { data: coupons, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const staffIds = [...new Set((coupons ?? []).map((c) => c.verified_by_staff_id).filter(Boolean))]
  const staffEmailMap = new Map<string, string>()
  if (staffIds.length > 0) {
    const { data: staffAccounts } = await supabase
      .from('store_accounts')
      .select('id, email')
      .in('id', staffIds as string[])
    for (const s of staffAccounts ?? []) staffEmailMap.set(s.id, s.email)
  }

  const result = (coupons ?? []).map((c) => ({
    id: c.id,
    label: c.label || `${c.amount.toLocaleString()}원 쿠폰`,
    amount: c.amount,
    status: c.status,
    issuedAt: c.issued_at,
    usedAt: c.used_at,
    validUntil: c.valid_until,
    verifiedByEmail: c.verified_by_staff_id ? (staffEmailMap.get(c.verified_by_staff_id) ?? '-') : null,
    sourceType: c.source_type,
  }))

  return NextResponse.json({ range, startDate: startDateLabel, endDate: endDateLabel, coupons: result })
}
