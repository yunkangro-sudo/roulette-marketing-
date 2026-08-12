import { requireAdminAuth } from '@/lib/admin/session'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

/** 전체 대시보드 — super_admin / agency 전용 */
export default async function DashboardPage() {
  const account = await requireAdminAuth()
  if (!['super_admin', 'agency'].includes(account.role)) {
    redirect('/admin/events')
  }
  return <DashboardClient />
}
