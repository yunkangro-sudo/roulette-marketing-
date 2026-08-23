import { requireAdminAuth } from '@/lib/admin/session'
import { redirect } from 'next/navigation'
import SuperDashboardClient from './SuperDashboardClient'

/** 전체 대시보드 (전체 매장 합산) — super_admin/agency 전용. 대리접속 중엔 effective role이 advertiser가 되어 자동으로 여기서 빠진다 */
export default async function SuperDashboardPage() {
  const account = await requireAdminAuth()
  if (!['super_admin', 'agency'].includes(account.role)) redirect('/admin/events')

  return <SuperDashboardClient />
}
