'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Company {
  id?: string
  store_id: string
  store_name: string
  contract_start_date: string
  contract_end_date: string
  ad_amount: number
  contractor_name: string
  manager_name: string
}

interface Props {
  mode: 'create' | 'edit'
  initial?: Company
}

export default function CompanyForm({ mode, initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<Company>({
    store_id: initial?.store_id ?? '',
    store_name: initial?.store_name ?? '',
    contract_start_date: initial?.contract_start_date ?? '',
    contract_end_date: initial?.contract_end_date ?? '',
    ad_amount: initial?.ad_amount ?? 0,
    contractor_name: initial?.contractor_name ?? '',
    manager_name: initial?.manager_name ?? '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: keyof Company, value: string | number) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.store_id.trim() || !form.store_name.trim()) {
      setError('매장 ID와 업체명은 필수입니다'); return
    }
    if (!form.contract_start_date || !form.contract_end_date) {
      setError('계약 기간을 입력해주세요'); return
    }

    setLoading(true)
    try {
      const url = mode === 'create'
        ? '/api/admin/companies'
        : `/api/admin/companies/${initial?.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '저장 실패'); return }

      if (mode === 'create') {
        router.push('/admin/companies')
      } else {
        setSuccess('저장되었습니다')
        router.refresh()
      }
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/companies" className="text-gray-400 hover:text-gray-600 text-sm">← 목록으로</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">
          {mode === 'create' ? '업체 등록' : '업체 정보 수정'}
        </h1>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">기본 정보</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">매장 ID *</label>
              <input
                value={form.store_id}
                onChange={(e) => set('store_id', e.target.value)}
                placeholder="test-store-001"
                disabled={mode === 'edit'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">업체명 *</label>
              <input
                value={form.store_name}
                onChange={(e) => set('store_name', e.target.value)}
                placeholder="당골마켓 강남점"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">계약자 이름</label>
              <input
                value={form.contractor_name}
                onChange={(e) => set('contractor_name', e.target.value)}
                placeholder="김사장"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">담당자 이름</label>
              <input
                value={form.manager_name}
                onChange={(e) => set('manager_name', e.target.value)}
                placeholder="이담당"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">계약 정보</h2>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">계약 기간 *</label>
            <div className="flex gap-3 items-center">
              <input
                type="date"
                value={form.contract_start_date}
                onChange={(e) => set('contract_start_date', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
              />
              <span className="text-gray-400 shrink-0">~</span>
              <input
                type="date"
                value={form.contract_end_date}
                min={form.contract_start_date}
                onChange={(e) => set('contract_end_date', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">월 광고비 (원)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={form.ad_amount}
                onChange={(e) => set('ad_amount', Number(e.target.value))}
                placeholder="300000"
                className="w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
              />
              <span className="text-sm text-gray-500">원 / 월</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg text-base transition-colors">
            취소
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-lg text-base transition-colors disabled:opacity-40">
            {loading ? '저장 중...' : mode === 'create' ? '업체 등록' : '변경사항 저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
