import { Suspense } from 'react'
import { requireAdminAuth } from '@/lib/admin/session'
import { redirect } from 'next/navigation'
import AdvertiserDashboardClient from './AdvertiserDashboardClient'

/**
 * 매장 1곳 전용 대시보드 — advertiser 또는 대리접속 중인 super_admin/agency
 * (requireAdminAuth가 이 경우 role='advertiser'로 스왑해서 반환한다).
 *
 * 대리접속 없는 super_admin/agency는 middleware.ts가 이 경로 자체를 /admin/companies로
 * 리다이렉트하므로 이 지점에 도달하지 않는다. 전체 매장 집계는 /admin/super/dashboard 참고.
 */
export default async function DashboardPage() {
  const account = await requireAdminAuth()
  if (account.role !== 'advertiser') redirect('/admin/companies')
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8 text-gray-400">로딩 중...</div>}>
      <AdvertiserDashboardClient storeId={account.storeId} />
    </Suspense>
  )
}
