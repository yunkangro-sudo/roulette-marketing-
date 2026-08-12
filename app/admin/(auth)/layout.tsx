import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/session'
import AdminNav from './AdminNav'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session.account) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav account={session.account} />
      <main>{children}</main>
    </div>
  )
}
