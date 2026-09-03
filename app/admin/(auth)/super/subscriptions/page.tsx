import { requireAdminAuth } from '@/lib/admin/session'
import { getStoreAddonsBulk } from '@/lib/admin/storeAddons'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionsListClient, { type SubscriptionListItem } from './SubscriptionsListClient'
import type { Subscription } from '../../companies/CompanySubscriptionsPanel'

export default async function SuperSubscriptionsPage() {
  const account = await requireAdminAuth()
  if (!['agency', 'super_admin'].includes(account.role)) redirect('/admin/events')

  const supabase = createServerClient()
  // 실제 입금 확인용 화면이라 샘플(데모) 매장은 제외 — 가짜 결제 기록이 섞이면 헷갈림
  const [{ data: companies }, { data: subscriptions }] = await Promise.all([
    supabase.from('store_contracts').select('id, store_id, store_name').eq('is_demo', false),
    supabase
      .from('subscriptions')
      .select('id, store_id, plan_name, amount_paid, start_date, end_date, memo, created_at, payment_date, payment_status')
      .order('end_date', { ascending: false }),
  ])

  // store_id별로 묶는다. 조회가 이미 end_date 내림차순이므로 각 배열의 첫 원소가 "현재 구독"
  const subsByStore = new Map<string, Subscription[]>()
  for (const s of subscriptions ?? []) {
    const list = subsByStore.get(s.store_id) ?? []
    list.push(s)
    subsByStore.set(s.store_id, list)
  }

  const addonsByStore = await getStoreAddonsBulk((companies ?? []).map((c) => c.store_id))

  const items: SubscriptionListItem[] = (companies ?? []).map((c) => {
    const history = subsByStore.get(c.store_id) ?? []
    const addons = addonsByStore.get(c.store_id)
    return {
      companyId: c.id,
      storeId: c.store_id,
      storeName: c.store_name,
      latest: history[0] ?? null,
      history,
      homepageFeatureEnabled: addons?.homepageFeatureEnabled ?? false,
      homepageFeatureEnabledAt: addons?.homepageFeatureEnabledAt ?? null,
    }
  })

  items.sort((a, b) => {
    const aEnd = a.latest?.end_date ?? ''
    const bEnd = b.latest?.end_date ?? ''
    return aEnd < bEnd ? -1 : aEnd > bEnd ? 1 : 0
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">업체 구독관리</h1>
        <p className="text-sm text-gray-500 mt-0.5">구독료 결제 현황과 입금 확인 상태를 관리하세요 (계좌이체 등 수동 결제 확인용)</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-lg">등록된 업체가 없습니다</p>
        </div>
      ) : (
        <SubscriptionsListClient items={items} />
      )}
    </div>
  )
}
