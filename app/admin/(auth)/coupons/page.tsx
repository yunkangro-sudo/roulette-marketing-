import { Suspense } from 'react'
import { requireAdminAuth } from '@/lib/admin/session'
import { redirect } from 'next/navigation'
import CouponsTabsClient from './CouponsTabsClient'

/**
 * 쿠폰 관리 (발급 + 발급·사용 현황 탭) — super_admin / agency 접근 가능
 * advertiser(대리접속 포함, requireAdminAuth가 role='advertiser'로 스왑)는 대시보드 "쿠폰 현황" 탭으로 통합됐으므로
 * 옛 북마크/링크 보호를 위해 대시보드 탭 경로로 리다이렉트한다.
 */
export default async function CouponsPage() {
  const account = await requireAdminAuth()
  if (account.role === 'advertiser') {
    redirect('/admin/dashboard?tab=coupons')
  }
  if (!['super_admin', 'agency'].includes(account.role)) {
    redirect('/admin/events')
  }
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8 text-gray-400">로딩 중...</div>}>
      <CouponsTabsClient role={account.role} storeId={account.storeId} />
    </Suspense>
  )
}
