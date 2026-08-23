'use client'

import { useState, useEffect, useCallback } from 'react'

type Range = 'today' | 'week' | 'month' | 'custom'
type StatusFilter = 'all' | 'unused' | 'used' | 'expired' | 'unverified'

interface Coupon {
  id: string
  label: string
  amount: number
  status: string
  issuedAt: string
  usedAt: string | null
  validUntil: string
  verifiedByEmail: string | null
  sourceType: string
}

interface Props {
  role: string
  storeId: string | null
}

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'today', label: '오늘' },
  { value: 'week',  label: '이번주' },
  { value: 'month', label: '이번달' },
  { value: 'custom', label: '직접설정' },
]

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',        label: '전체' },
  { value: 'unused',     label: '미사용' },
  { value: 'used',       label: '사용됨' },
  { value: 'expired',    label: '만료' },
  { value: 'unverified', label: '미인증' },
]

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  issued:         { label: '미사용',   className: 'bg-blue-100 text-blue-700' },
  pending_verify: { label: '검증대기', className: 'bg-yellow-100 text-yellow-700' },
  used:           { label: '사용됨',   className: 'bg-green-100 text-green-700' },
  expired:        { label: '만료',     className: 'bg-gray-100 text-gray-500' },
  unverified:     { label: '미인증',   className: 'bg-red-100 text-red-600' },
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function CouponStatusClient({ storeId }: Props) {
  const [range, setRange] = useState<Range>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reminding, setReminding] = useState(false)
  const [remindResult, setRemindResult] = useState('')

  const fetchData = useCallback(async () => {
    if (range === 'custom' && (!customFrom || !customTo)) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ range, status })
      if (range === 'custom') { params.set('from', customFrom); params.set('to', customTo) }
      if (storeId) params.set('store_id', storeId)
      const res = await fetch(`/api/admin/coupons?${params}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '조회 실패'); return }
      setCoupons(json.coupons ?? [])
      setSelected(new Set())
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [range, customFrom, customTo, status, storeId])

  useEffect(() => { fetchData() }, [fetchData])

  const unusedSelectable = coupons.filter((c) => c.status === 'issued' || c.status === 'pending_verify')

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === unusedSelectable.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(unusedSelectable.map((c) => c.id)))
    }
  }

  async function handleRemind() {
    if (selected.size === 0) return
    if (!confirm(`선택한 ${selected.size}건에 만료 리마인드를 발송하시겠습니까?`)) return
    setReminding(true)
    setRemindResult('')
    try {
      const res = await fetch('/api/admin/coupons/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_ids: [...selected] }),
      })
      const data = await res.json()
      if (!res.ok) { setRemindResult(data.error ?? '발송 실패'); return }
      setRemindResult(`발송 완료 ${data.sent}건 · 발송 제외 ${data.skipped}건 (동의/빈도 규칙)`)
      setSelected(new Set())
    } catch {
      setRemindResult('네트워크 오류가 발생했습니다')
    } finally {
      setReminding(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto">
          {RANGE_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setRange(opt.value)}
              className={`shrink-0 text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
                range === opt.value ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
            <span className="text-gray-400 text-center sm:text-left shrink-0">~</span>
            <input type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)}
              className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto border-t border-gray-100 pt-3">
          {STATUS_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setStatus(opt.value)}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                status === opt.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {remindResult && <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 text-sm">{remindResult}</div>}

      {/* 리마인드 발송 바 */}
      {unusedSelectable.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={selected.size === unusedSelectable.length && unusedSelectable.length > 0}
              onChange={toggleSelectAll} className="h-4 w-4 accent-orange-500 cursor-pointer" />
            미사용 쿠폰 전체 선택 ({unusedSelectable.length}건)
          </label>
          <button onClick={handleRemind} disabled={selected.size === 0 || reminding}
            className="bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-40">
            {reminding ? '발송 중...' : `리마인드 발송 (${selected.size})`}
          </button>
        </div>
      )}

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="px-3 py-3 w-8"></th>
                  <th className="text-left px-3 py-3 font-semibold">당첨일시</th>
                  <th className="text-left px-3 py-3 font-semibold">티어/품목</th>
                  <th className="text-right px-3 py-3 font-semibold">금액</th>
                  <th className="text-center px-3 py-3 font-semibold">상태</th>
                  <th className="text-left px-3 py-3 font-semibold">사용일시</th>
                  <th className="text-left px-3 py-3 font-semibold">검증 직원</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">해당 조건의 쿠폰이 없습니다</td></tr>
                ) : coupons.map((c) => {
                  const isSelectable = c.status === 'issued' || c.status === 'pending_verify'
                  const s = STATUS_LABEL[c.status] ?? { label: c.status, className: 'bg-gray-100 text-gray-500' }
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3">
                        {isSelectable && (
                          <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)}
                            className="h-4 w-4 accent-orange-500 cursor-pointer" />
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(c.issuedAt)}</td>
                      <td className="px-3 py-3 font-semibold text-gray-900">{c.label}</td>
                      <td className="px-3 py-3 text-right text-gray-700">{c.amount.toLocaleString()}원</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.className}`}>{s.label}</span>
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(c.usedAt)}</td>
                      <td className="px-3 py-3 text-gray-500 truncate max-w-[140px]">{c.verifiedByEmail ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
