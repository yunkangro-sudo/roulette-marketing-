import { requireAdminAuth, getAllowedStoreId } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:    { label: '진행중', color: 'bg-green-100 text-green-700' },
  scheduled: { label: '예정됨', color: 'bg-blue-100 text-blue-700' },
  paused:    { label: '일시중지', color: 'bg-yellow-100 text-yellow-700' },
  ended:     { label: '종료됨', color: 'bg-gray-100 text-gray-500' },
  draft:     { label: '초안', color: 'bg-gray-100 text-gray-400' },
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ store_id?: string }> }) {
  const account = await requireAdminAuth()
  const params = await searchParams
  const allowedStoreId = getAllowedStoreId(account)
  const filterStoreId = allowedStoreId ?? params.store_id

  const supabase = createServerClient()
  let query = supabase
    .from('events')
    .select('id, store_id, name, status, display_start_date, display_end_date, created_at')
    .order('created_at', { ascending: false })

  if (filterStoreId) query = query.eq('store_id', filterStoreId)

  const { data: events } = await query

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">이벤트 관리</h1>
          {filterStoreId && <p className="text-sm text-gray-500 mt-0.5">매장: {filterStoreId}</p>}
        </div>
        <Link
          href="/admin/events/new"
          className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          + 새 이벤트 등록
        </Link>
      </div>

      {/* 이벤트 목록 */}
      {!events || events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-lg mb-2">등록된 이벤트가 없습니다</p>
          <p className="text-gray-400 text-sm">우측 상단 버튼으로 첫 이벤트를 등록해보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const s = STATUS_LABEL[ev.status] ?? { label: ev.status, color: 'bg-gray-100 text-gray-500' }
            return (
              <div key={ev.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    <span className="text-xs text-gray-400">{ev.store_id}</span>
                  </div>
                  <p className="font-semibold text-gray-900 truncate">{ev.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ev.display_start_date} ~ {ev.display_end_date}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <Link
                    href={`/admin/events/${ev.id}`}
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    수정 / 상세
                  </Link>
                  <Link
                    href={`/play/${ev.store_id}`}
                    target="_blank"
                    className="text-xs text-orange-500 hover:underline"
                  >
                    미리보기 →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
