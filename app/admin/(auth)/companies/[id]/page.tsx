import { requireAdminAuth } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CompanyForm from '../CompanyForm'

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const account = await requireAdminAuth()
  if (!['agency', 'super_admin'].includes(account.role)) redirect('/admin/events')

  const supabase = createServerClient()
  const { data } = await supabase.from('store_contracts').select('*').eq('id', id).single()
  if (!data) notFound()

  return <CompanyForm mode="edit" initial={data} />
}
