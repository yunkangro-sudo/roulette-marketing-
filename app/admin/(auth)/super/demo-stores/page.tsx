import { requireAdminAuth } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DemoStoresClient, { type DemoStoreItem } from './DemoStoresClient'

/**
 * 슈퍼관리자 "샘플 레퍼런스" — 영업 시연용 샘플(데모) 매장 10곳의 현황을 한눈에 보고,
 * 필요하면 가상 활동데이터를 초기화 후 재생성한다. 목록은 store_contracts.is_demo=true만
 * 조회하므로 실제 매장과는 절대 섞이지 않는다 (docs/migrations/053_demo_store_isolation.sql).
 */
export default async function DemoStoresPage() {
  const account = await requireAdminAuth()
  if (account.role !== 'super_admin') redirect('/admin/super/dashboard')

  const supabase = createServerClient()

  const { data: contracts } = await supabase
    .from('store_contracts')
    .select('store_id, store_name, business_type, created_at')
    .eq('is_demo', true)
    .order('store_id')

  const storeIds = (contracts ?? []).map((c) => c.store_id)

  const [{ data: loyaltyRows }, { data: couponRows }] = await Promise.all([
    storeIds.length > 0
      ? supabase.from('customer_loyalty').select('store_id, segment').in('store_id', storeIds)
      : Promise.resolve({ data: [] as { store_id: string; segment: string }[] }),
    storeIds.length > 0
      ? supabase.from('coupons').select('store_id, status').in('store_id', storeIds)
      : Promise.resolve({ data: [] as { store_id: string; status: string }[] }),
  ])

  const items: DemoStoreItem[] = (contracts ?? []).map((c) => {
    const loyalty = (loyaltyRows ?? []).filter((r) => r.store_id === c.store_id)
    const coupons = (couponRows ?? []).filter((r) => r.store_id === c.store_id)
    const segmentCounts: Record<string, number> = {}
    for (const r of loyalty) segmentCounts[r.segment] = (segmentCounts[r.segment] ?? 0) + 1
    return {
      storeId: c.store_id,
      storeName: c.store_name,
      businessType: c.business_type ?? 'service',
      createdAt: c.created_at,
      customerCount: loyalty.length,
      segmentCounts,
      couponCount: coupons.length,
      couponUsedCount: coupons.filter((r) => r.status === 'used').length,
    }
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">샘플 레퍼런스</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          영업 시연용 샘플(데모) 매장 {items.length}곳 — 대시보드/회원관리/성과리포트/홈페이지가 전부
          실제 운영 매장처럼 보이도록 콘텐츠와 가상 활동데이터가 채워져 있습니다. 이 매장들은
          <span className="font-semibold text-purple-600"> is_demo=true</span>로 표시되어 슈퍼관리자
          전체 집계·사이트맵·알림톡 발송에서 자동 제외됩니다.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-lg">샘플 매장이 없습니다</p>
          <p className="text-sm text-gray-400 mt-2">
            로컬에서 <code className="bg-gray-100 px-1.5 py-0.5 rounded">node scripts/seed-demo-stores.mjs</code> 실행 후
            <code className="bg-gray-100 px-1.5 py-0.5 rounded ml-1">node scripts/seed-demo-activity.mjs</code>를 실행하세요.
          </p>
        </div>
      ) : (
        <DemoStoresClient items={items} />
      )}
    </div>
  )
}
