import { requireAdminAuth } from '@/lib/admin/session'
import { redirect } from 'next/navigation'
import CouponIssueClient from './CouponIssueClient'

/** 수동 쿠폰 발급 — advertiser / super_admin / agency 접근 가능 */
export default async function CouponIssuePage() {
  const account = await requireAdminAuth()

  if (!['advertiser', 'super_admin', 'agency'].includes(account.role)) {
    redirect('/admin/events')
  }

  return <CouponIssueClient role={account.role} storeId={account.storeId} />
}
