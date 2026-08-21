import { requireAdminAuth } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / 86400000)
}

export default async function CompaniesPage() {
  const account = await requireAdminAuth()
  if (!['agency', 'super_admin'].includes(account.role)) redirect('/admin/events')

  const supabase = createServerClient()
  const { data: companies } = await supabase
    .from('store_contracts')
    .select('*')
    .order('contract_end_date', { ascending: true })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">업체 리스트</h1>
          <p className="text-sm text-gray-500 mt-0.5">계약 현황 및 담당자 관리</p>
        </div>
        <Link
          href="/admin/companies/new"
          className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-lg text-sm text-center transition-colors"
        >
          + 업체 등록
        </Link>
      </div>

      {!companies || companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-lg mb-2">등록된 업체가 없습니다</p>
          <p className="text-gray-400 text-sm">우측 상단 버튼으로 첫 업체를 등록해보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((c) => {
            const days = daysUntil(c.contract_end_date)
            const isExpiringSoon = days >= 0 && days <= 30
            const isExpired = days < 0

            return (
              <Link
                key={c.id}
                href={`/admin/companies/${c.id}`}
                className={`block bg-white rounded-xl border px-5 py-4 hover:shadow-md transition-shadow ${
                  isExpired
                    ? 'border-red-200 bg-red-50'
                    : isExpiringSoon
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className="font-bold text-gray-900">{c.store_name}</span>
                      <span className="text-xs text-gray-400 font-mono">{c.store_id}</span>
                      {isExpired && (
                        <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                          계약 만료
                        </span>
                      )}
                      {isExpiringSoon && !isExpired && (
                        <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">
                          D-{days} 만료임박
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      계약: {c.contract_start_date} ~ {c.contract_end_date}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      담당자: {c.manager_name || '-'} · 계약자: {c.contractor_name || '-'}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-lg font-black text-gray-900">
                      {c.ad_amount.toLocaleString()}원
                    </p>
                    <p className="text-xs text-gray-400">월 광고비</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
