'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface Subscription {
  id: string
  plan_name: string
  amount_paid: number
  start_date: string
  end_date: string
  memo: string | null
  created_at: string
}

interface Props {
  /** store_contracts.id (uuid) — 구독 등록 API 경로에 쓰인다. readOnly일 땐 미사용 */
  companyId?: string
  initialSubscriptions: Subscription[]
  /** true면 광고주 화면 — 구독 이력은 수퍼관리자가 입력한 내용을 읽기전용으로만 보여주고, 갱신 등록 폼은 숨긴다 */
  readOnly?: boolean
}

/** 업체 상세 "이용기간·결제" 탭 — 구독 이력 리스트 + (수퍼관리자 전용) 갱신 등록 폼 */
export default function CompanySubscriptionsPanel({ companyId, initialSubscriptions, readOnly }: Props) {
  const router = useRouter()
  const [subList, setSubList] = useState<Subscription[]>(initialSubscriptions)
  const [subForm, setSubForm] = useState({
    plan_name: 'Basic',
    amount_paid: 0,
    start_date: '',
    end_date: '',
    memo: '',
  })
  const [subLoading, setSubLoading] = useState(false)
  const [subError, setSubError] = useState('')

  async function handleAddSubscription(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId) return
    setSubError('')
    if (!subForm.start_date || !subForm.end_date) {
      setSubError('시작일과 종료일을 입력해주세요'); return
    }
    setSubLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subForm),
      })
      const data = await res.json()
      if (!res.ok) { setSubError(data.error ?? '등록 실패'); return }
      setSubList((prev) => [data.subscription, ...prev])
      setSubForm({ plan_name: 'Basic', amount_paid: 0, start_date: '', end_date: '', memo: '' })
      router.refresh()
    } catch {
      setSubError('네트워크 오류가 발생했습니다')
    } finally {
      setSubLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="text-sm font-bold text-gray-700">구독(이용기간) 이력</h2>

      {readOnly && (
        <p className="text-xs text-gray-400 -mt-2">수퍼관리자가 등록한 이용기간·결제 내역입니다 (읽기 전용).</p>
      )}

      {subList.length > 0 ? (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {subList.map((s) => (
            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-gray-600">{s.start_date} ~ {s.end_date} · {s.plan_name}</span>
              <span className="text-gray-400">{s.amount_paid.toLocaleString()}원{s.memo ? ` · ${s.memo}` : ''}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">등록된 구독 이력이 없습니다 (무제한 체험으로 이용 중).</p>
      )}

      {!readOnly && (
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-600">구독 갱신 등록</p>
        {subError && <p className="text-xs text-red-500">{subError}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">플랜명</label>
            <select value={subForm.plan_name} onChange={(e) => setSubForm((p) => ({ ...p, plan_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-500">
              <option value="Basic">Basic</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">결제 금액 (원)</label>
            <input type="number" min={0} value={subForm.amount_paid === 0 ? '' : subForm.amount_paid}
              onChange={(e) => setSubForm((p) => ({ ...p, amount_paid: e.target.value === '' ? 0 : Number(e.target.value) }))}
              placeholder="300000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input type="date" value={subForm.start_date} onChange={(e) => setSubForm((p) => ({ ...p, start_date: e.target.value }))}
            className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
          <span className="text-gray-400 shrink-0 text-center sm:text-left">~</span>
          <input type="date" value={subForm.end_date} min={subForm.start_date} onChange={(e) => setSubForm((p) => ({ ...p, end_date: e.target.value }))}
            className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
        </div>
        <input value={subForm.memo} onChange={(e) => setSubForm((p) => ({ ...p, memo: e.target.value }))}
          placeholder="메모 (예: 3개월 재계약)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
        <button type="button" onClick={handleAddSubscription} disabled={subLoading}
          className="w-full sm:w-auto bg-gray-900 hover:bg-gray-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40">
          {subLoading ? '등록 중...' : '+ 구독 갱신 등록'}
        </button>
      </div>
      )}
    </div>
  )
}
