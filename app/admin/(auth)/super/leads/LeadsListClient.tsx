'use client'

import { useMemo, useState } from 'react'

export type LeadStatus = 'new' | 'contacted' | 'converted' | 'declined'

export interface LeadItem {
  id: string
  storeName: string
  ownerName: string
  phone: string
  email: string | null
  businessType: string | null
  message: string | null
  source: string | null
  status: LeadStatus
  createdAt: string
}

const SOURCE_LABEL: Record<string, string> = {
  landing_v5_pricing_basic: '단골마케팅 신청',
  landing_v5_pricing_content_ops: '당근마케팅 상담',
  landing_v5_pricing_homepage: '홈피마케팅 신청',
  landing_v5_pricing_calculator: '요금제 계산기',
  landing_v5_growth_danggeun: '당근마케팅 상담(성장페이지)',
  signup_self: '회원가입(계정 생성)',
}

function sourceLabel(source: string | null): string {
  if (!source) return '기타'
  return SOURCE_LABEL[source] ?? source
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: '신규' },
  { value: 'contacted', label: '연락함' },
  { value: 'converted', label: '계약전환' },
  { value: 'declined', label: '거절' },
]

const STATUS_BADGE: Record<LeadStatus, string> = {
  new: 'bg-amber-100 text-amber-700',
  contacted: 'bg-blue-100 text-blue-600',
  converted: 'bg-green-100 text-green-600',
  declined: 'bg-gray-100 text-gray-400',
}

type StatusFilterValue = 'all' | LeadStatus
type SourceFilterValue = 'all' | 'other' | keyof typeof SOURCE_LABEL

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function downloadCsv(items: LeadItem[]) {
  const header = ['업체명', '담당자명', '연락처', '이메일', '업종', '유입경로', '상태', '접수일', '메모']
  const rows = items.map((item) => [
    item.storeName,
    item.ownerName,
    item.phone,
    item.email ?? '',
    item.businessType ?? '',
    sourceLabel(item.source),
    STATUS_OPTIONS.find((s) => s.value === item.status)?.label ?? item.status,
    formatDate(item.createdAt),
    item.message ?? '',
  ])
  const csv = [header, ...rows].map((r) => r.map((v) => csvEscape(String(v))).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `신청문의리스트_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function LeadsListClient({ items: initialItems }: { items: LeadItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>('all')
  const [savingId, setSavingId] = useState<string | null>(null)

  const availableSources = useMemo(() => {
    const set = new Set(items.map((i) => i.source ?? 'other'))
    return Array.from(set)
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (sourceFilter !== 'all') {
        const key = item.source ?? 'other'
        if (key !== sourceFilter) return false
      }
      const q = search.trim().toLowerCase()
      if (q) {
        const haystack = `${item.storeName} ${item.ownerName} ${item.phone} ${item.email ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [items, search, statusFilter, sourceFilter])

  async function updateStatus(id: string, status: LeadStatus) {
    setSavingId(id)
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)))
    } catch {
      alert('상태 변경에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="업체명 · 담당자 · 연락처 검색"
            className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
          />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as SourceFilterValue)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">전체 경로</option>
            {availableSources.map((s) => (
              <option key={s} value={s}>
                {s === 'other' ? '기타' : sourceLabel(s === 'other' ? null : s)}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5 overflow-x-auto">
            {[{ value: 'all' as const, label: '전체' }, ...STATUS_OPTIONS].map((f) => (
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

      <p className="text-xs text-gray-400">{filtered.length}건 · 현재 필터 기준 (전체 {items.length}건)</p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-lg">조건에 맞는 신청/문의가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="font-bold text-gray-900">{item.storeName}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {sourceLabel(item.source)}
                    </span>
                    {item.businessType && (
                      <span className="text-xs text-gray-400">{item.businessType}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {item.ownerName} · {item.phone}
                    {item.email && <> · {item.email}</>}
                  </p>
                  {item.message && (
                    <p className="mt-1.5 text-xs text-gray-500 whitespace-pre-line leading-relaxed">
                      {item.message}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-gray-400">{formatDate(item.createdAt)} 접수</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_BADGE[item.status]}`}>
                    {STATUS_OPTIONS.find((s) => s.value === item.status)?.label}
                  </span>
                  <select
                    value={item.status}
                    disabled={savingId === item.id}
                    onChange={(e) => updateStatus(item.id, e.target.value as LeadStatus)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
