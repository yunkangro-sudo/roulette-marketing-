import { requireAdminAuth } from '@/lib/admin/session'
import { redirect } from 'next/navigation'
import MembersClient from './MembersClient'

/** 회원 관리 — advertiser 전용 (자기 매장 회원만) */
export default async function MembersPage() {
  const account = await requireAdminAuth()
  if (account.role !== 'advertiser') redirect('/admin/events')
  return <MembersClient />
}
