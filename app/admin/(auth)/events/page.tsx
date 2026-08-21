import { requireAdminAuth, getAllowedStoreId } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EventCard from './EventCard'

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ store_id?: string }> }) {
  const account = await requireAdminAuth()
  const params = await searchParams
  const allowedStoreId = getAllowedStoreId(account)
  const filterStoreId = allowedStoreId ?? params.store_id

  const supabase = createServerClient()
  let query = supabase
    .from('events')
    .select('id, store_id, name, status, display_start_date, display_end_date, prize_tiers(label, amount, total_quantity, computed_probability, requires_verification)')
    .order('created_at', { ascending: false })

  if (filterStoreId) query = query.eq('store_id', filterStoreId)

  const { data: events } = await query

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">이벤트 관리</h1>
          {filterStoreId && <p className="text-sm text-gray-500 mt-0.5">매장: {filterStoreId}</p>}
        </div>
        <Link
          href="/admin/events/new"
          className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-lg text-sm text-center transition-colors"
        >
          + 새 이벤트 등록
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-lg mb-2">등록된 이벤트가 없습니다</p>
          <p className="text-gray-400 text-sm">우측 상단 버튼으로 첫 이벤트를 등록해보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      )}
    </div>
  )
}
