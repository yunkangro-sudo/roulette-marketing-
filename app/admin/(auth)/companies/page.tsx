import { requireAdminAuth } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import { classifySubscription } from '@/lib/admin/subscription'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CompaniesListClient, { type CompanyListItem } from './CompaniesListClient'

export default async function CompaniesPage() {
  const account = await requireAdminAuth()
  if (!['agency', 'super_admin'].includes(account.role)) redirect('/admin/events')

  const supabase = createServerClient()
  const [{ data: companies }, { data: subscriptions }] = await Promise.all([
    supabase.from('store_contracts').select('*'),
    supabase
      .from('subscriptions')
      .select('store_id, start_date, end_date')
      .order('end_date', { ascending: false }),
  ])

  // 매장별 최신 구독(end_date가 가장 최근인 row) 1건만 남긴다 — subscriptions가
  // "이용기간"의 진실의 원천이므로, 목록의 상태 배지도 여기 기준으로 계산한다.
  const latestSubByStore = new Map<string, { start_date: string; end_date: string }>()
  for (const s of subscriptions ?? []) {
    if (!latestSubByStore.has(s.store_id)) latestSubByStore.set(s.store_id, s)
  }

  const items: CompanyListItem[] = (companies ?? []).map((c) => {
    const sub = latestSubByStore.get(c.store_id)
    const classified = classifySubscription(sub?.start_date ?? null, sub?.end_date ?? null)
    return {
      id: c.id,
      store_id: c.store_id,
      store_name: c.store_name,
      ad_amount: c.ad_amount,
      manager_name: c.manager_name,
      contractor_name: c.contractor_name,
      subscriptionEndDate: classified.endDate,
      status: classified.status,
      is_demo: c.is_demo === true,
    }
  })

  items.sort((a, b) => {
    const aEnd = a.subscriptionEndDate ?? ''
    const bEnd = b.subscriptionEndDate ?? ''
    return aEnd < bEnd ? -1 : aEnd > bEnd ? 1 : 0
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">업체 리스트</h1>
          <p className="text-sm text-gray-500 mt-0.5">계약 현황 및 담당자 관리</p>
        </div>
        <Link
          href="/admin/companies/new"
          className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-lg text-sm text-center transition-colors"
        >
          + 업체 등록
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-lg mb-2">등록된 업체가 없습니다</p>
          <p className="text-gray-400 text-sm">우측 상단 버튼으로 첫 업체를 등록해보세요.</p>
        </div>
      ) : (
        <CompaniesListClient companies={items} />
      )}
    </div>
  )
}
