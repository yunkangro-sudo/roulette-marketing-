import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/session'
import ParticipantsClient from './ParticipantsClient'

export default async function SuperParticipantsPage() {
  const session = await getAdminSession()
  if (!session.account) redirect('/admin/login')
  if (session.account.role !== 'super_admin') redirect('/admin/super/dashboard')

  return <ParticipantsClient />
}
