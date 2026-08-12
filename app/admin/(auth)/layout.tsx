import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/session'
import AdminNav from './AdminNav'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session.account) redirect('/admin/login')

  // staff 역할은 관리자 패널이 아니라 계산대(/staff)만 사용
  if (session.account.role === 'staff') redirect('/staff')

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav account={session.account} />
      <main>{children}</main>
    </div>
  )
}
