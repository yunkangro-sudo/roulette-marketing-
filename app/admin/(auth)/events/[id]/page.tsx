import { requireAdminAuth, getAllowedStoreId } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditEventForm from './EditEventForm'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const account = await requireAdminAuth()
  const supabase = createServerClient()

  const { data: event } = await supabase
    .from('events')
    .select('*, prize_tiers(*)')
    .eq('id', id)
    .single()

  if (!event) notFound()

  // advertiser는 자기 매장만 접근 가능
  const allowedStoreId = getAllowedStoreId(account)
  if (allowedStoreId && event.store_id !== allowedStoreId) redirect('/admin/events')

  return <EditEventForm event={event} />
}
