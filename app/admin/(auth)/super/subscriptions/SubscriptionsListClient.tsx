'use client'

import { useState, useMemo } from 'react'
import CompanySubscriptionsPanel, { type Subscription, type PaymentStatus } from '../../companies/CompanySubscriptionsPanel'

export interface SubscriptionListItem {
  companyId: string
  storeId: string
  storeName: string
  latest: Subscription | null
  history: Subscription[]
  homepageFeatureEnabled: boolean
  homepageFeatureEnabledAt: string | null
}

type SubscriptionFilterValue = 'all' | PaymentStatus | 'pending'

const STATUS_FILTERS: { value: SubscriptionFilterValue; label: string }[] = [
  { value: 'all',     label: '전체' },
  { value: 'pending', label: '승인대기' },
  { value: 'paid',    label: '입금확인' },
  { value: 'unpaid',  label: '미입금' },
  { value: 'overdue', label: '연체' },
]

const STATUS_BADGE: Record<PaymentStatus, { label: string; className: string }> = {
  paid:    { label: '입금확인', className: 'bg-green-100 text-green-600' },
  unpaid:  { label: '미입금',   className: 'bg-gray-100 text-gray-500' },
  overdue: { label: '연체',     className: 'bg-red-100 text-red-600' },
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function downloadCsv(items: SubscriptionListItem[]) {
  const header = ['업체명', '플랜명', '납부금액', '납부일', '이용기간', '납부상태']
  const rows = items.map((item) => {
    const s = item.latest
    const period = s ? `${s.start_date} ~ ${s.end_date}` : ''
    const status = s ? STATUS_BADGE[s.payment_status].label : '승인대기'
    return [
      item.storeName,
      s?.plan_name ?? '',
      s ? String(s.amount_paid) : '',
      s?.payment_date ?? '',
      period,
      status,
    ]
  })
  const csv = [header, ...rows].map((r) => r.map((v) => csvEscape(String(v))).join(',')).join('\r\n')
  // 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM을 앞에 붙인다
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `업체구독관리_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function SubscriptionsListClient({ items }: { items: SubscriptionListItem[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SubscriptionFilterValue>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === 'pending') {
        if (item.latest !== null) return false
      } else if (statusFilter !== 'all' && item.latest?.payment_status !== statusFilter) {
        return false
      }
      if (search.trim() && !item.storeName.toLowerCase().includes(search.trim().toLowerCase())) return false
      return true
    })
  }, [items, search, statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="업체명 검색"
            className="w-full sm:w-56 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
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
        <button
          type="button"
          onClick={() => downloadCsv(filtered)}
          className="shrink-0 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          ⬇ 엑셀 다운로드
        </button>
      </div>

      <p className="text-xs text-gray-400">{filtered.length}개 업체 · 현재 필터 기준</p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-lg">조건에 맞는 업체가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const s = item.latest
            const badge = s ? STATUS_BADGE[s.payment_status] : { label: '승인대기', className: 'bg-amber-100 text-amber-700' }
            const isOpen = expandedId === item.companyId
            return (
              <div key={item.companyId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : item.companyId)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="font-bold text-gray-900">{item.storeName}</span>
                        <span className="text-xs text-gray-400 font-mono">{item.storeId}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          item.homepageFeatureEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          🏠 홈페이지 {item.homepageFeatureEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {s ? `${s.plan_name} · ${s.start_date} ~ ${s.end_date}` : '등록된 구독 이력 없음 (승인대기 — 새 결제 등록 시 승인)'}
                      </p>
                      {s?.payment_date && <p className="text-xs text-gray-400 mt-0.5">입금일: {s.payment_date}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-black text-gray-900">{(s?.amount_paid ?? 0).toLocaleString()}원</p>
                        <p className="text-xs text-gray-400">이번 결제금액</p>
                      </div>
                      <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                    <CompanySubscriptionsPanel
                      companyId={item.companyId}
                      initialSubscriptions={item.history}
                      initialHomepageFeatureEnabled={item.homepageFeatureEnabled}
                      initialHomepageFeatureEnabledAt={item.homepageFeatureEnabledAt}
                      bare
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
