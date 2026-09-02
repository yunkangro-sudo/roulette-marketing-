'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

export interface CompanyListItem {
  id: string
  store_id: string
  store_name: string
  ad_amount: number
  manager_name: string | null
  contractor_name: string | null
  subscriptionEndDate: string | null
  status: 'trial' | 'active' | 'grace' | 'expired'
  is_demo: boolean
}

type FilterValue = 'all' | CompanyListItem['status'] | 'demo'

const STATUS_FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all',     label: '전체' },
  { value: 'active',  label: '정상' },
  { value: 'grace',   label: '유예' },
  { value: 'expired', label: '만료' },
  { value: 'trial',   label: '체험' },
  { value: 'demo',    label: '샘플' },
]

const STATUS_BADGE: Record<CompanyListItem['status'], { label: string; className: string }> = {
  trial:   { label: '무제한 체험',   className: 'bg-blue-100 text-blue-600' },
  active:  { label: '정상',          className: 'bg-green-100 text-green-600' },
  grace:   { label: '유예기간',      className: 'bg-orange-100 text-orange-600' },
  expired: { label: '이용기간 만료', className: 'bg-red-100 text-red-600' },
}

export default function CompaniesListClient({ companies }: { companies: CompanyListItem[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all')

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      // "샘플" 탭에서만 데모 매장 노출 — 그 외 모든 탭(전체 포함)에서는 숨긴다
      if (statusFilter === 'demo') {
        if (!c.is_demo) return false
      } else {
        if (c.is_demo) return false
        if (statusFilter !== 'all' && c.status !== statusFilter) return false
      }
      if (search.trim() && !c.store_name.toLowerCase().includes(search.trim().toLowerCase())) return false
      return true
    })
  }, [companies, search, statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="업체명 검색"
          className="w-full sm:max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
        />
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                statusFilter === f.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-lg mb-2">조건에 맞는 업체가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const badge = STATUS_BADGE[c.status]
            return (
              <Link
                key={c.id}
                href={`/admin/companies/${c.id}`}
                className={`block bg-white rounded-xl border px-5 py-4 hover:shadow-md transition-shadow ${
                  c.status === 'expired' ? 'border-red-200 bg-red-50' : c.status === 'grace' ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className="font-bold text-gray-900">{c.store_name}</span>
                      <span className="text-xs text-gray-400 font-mono">{c.store_id}</span>
                      {c.is_demo && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">샘플</span>
                      )}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      이용기간: {c.subscriptionEndDate ? `~ ${c.subscriptionEndDate}` : '설정된 구독 없음 (무제한 체험)'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      담당자: {c.manager_name || '-'} · 계약자: {c.contractor_name || '-'}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-lg font-black text-gray-900">{c.ad_amount.toLocaleString()}원</p>
                    <p className="text-xs text-gray-400">월 구독료</p>
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
