import { requireAdminAuth } from '@/lib/admin/session'
import { redirect } from 'next/navigation'
import CompanyForm from '../CompanyForm'

export default async function NewCompanyPage() {
  const account = await requireAdminAuth()
  if (!['agency', 'super_admin'].includes(account.role)) redirect('/admin/events')

  return <CompanyForm mode="create" />
}
