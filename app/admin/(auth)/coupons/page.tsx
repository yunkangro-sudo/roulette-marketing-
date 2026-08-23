import { Suspense } from 'react'
import { requireAdminAuth } from '@/lib/admin/session'
import { redirect } from 'next/navigation'
import CouponsTabsClient from './CouponsTabsClient'

/** 쿠폰 관리 (발급 + 발급·사용 현황 탭) — advertiser / super_admin / agency 접근 가능 */
export default async function CouponsPage() {
  const account = await requireAdminAuth()
  if (!['advertiser', 'super_admin', 'agency'].includes(account.role)) {
    redirect('/admin/events')
  }
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8 text-gray-400">로딩 중...</div>}>
      <CouponsTabsClient role={account.role} storeId={account.storeId} />
    </Suspense>
  )
}
