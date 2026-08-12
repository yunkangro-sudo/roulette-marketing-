import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/session'
import StaffClient from './StaffClient'

/**
 * 계산대 페이지 — staff 또는 advertiser 역할만 접근 가능
 * 미로그인 → /admin/login?redirect=/staff
 */
export default async function StaffPage() {
  const session = await getAdminSession()

  if (!session.account) {
    redirect('/admin/login?redirect=/staff')
  }

  const { role, storeId } = session.account
  if (!['staff', 'advertiser'].includes(role)) {
    redirect('/admin/events')
  }

  if (!storeId) {
    // staff/advertiser는 반드시 store_id가 있어야 함
    redirect('/admin/login?redirect=/staff')
  }

  return <StaffClient storeId={storeId} role={role} />
}
