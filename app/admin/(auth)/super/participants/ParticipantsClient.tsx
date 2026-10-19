'use client'

import { useCallback, useEffect, useState } from 'react'

interface Row {
  playedAt: string
  storeId: string
  storeName: string
  phone: string
}

interface StoreOption {
  storeId: string
  storeName: string
}

export default function ParticipantsClient() {
  const [stores, setStores] = useState<StoreOption[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [storeId, setStoreId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [limited, setLimited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (storeId) params.set('storeId', storeId)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`/api/admin/super/participants?${params}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '조회 실패')
        return
      }
      setRows(json.rows ?? [])
      setStores(json.stores ?? [])
      setLimited(!!json.limited)
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [storeId, from, to])

  useEffect(() => { load() }, [load])

  function download() {
    const params = new URLSearchParams({ format: 'csv' })
    if (storeId) params.set('storeId', storeId)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    window.location.href = `/api/admin/super/participants?${params}`
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">게임 참여자 번호</h1>
          <p className="mt-0.5 text-sm text-gray-500">슈퍼관리자만 볼 수 있습니다. 게임 완료 시각이 최신인 순서입니다.</p>
        </div>
        <button
          type="button"
          onClick={download}
          className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-bold text-white hover:bg-gray-700"
        >
          엑셀 다운로드
        </button>
      </div>

      <div className="mb-4 grid gap-2 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900"
        >
          <option value="">전체 업체</option>
          {stores.map((s) => (
            <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900"
        />
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => setTo(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900"
        />
        <button
          type="button"
          onClick={() => { setStoreId(''); setFrom(''); setTo('') }}
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          초기화
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {limited && (
        <p className="mb-3 text-xs text-gray-500">화면에 최신 300건만 보입니다. 엑셀은 같은 조건으로 최대 5,000건까지 받습니다.</p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-3 text-left font-semibold">참여일시</th>
                  <th className="px-4 py-3 text-left font-semibold">업체</th>
                  <th className="px-4 py-3 text-left font-semibold">휴대폰 번호</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.length === 0 ? (
                  <tr><td colSpan={3} className="py-10 text-center text-sm text-gray-400">해당 조건의 참여자가 없습니다</td></tr>
                ) : rows.map((r, i) => (
                  <tr key={`${r.storeId}-${r.playedAt}-${i}`} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{r.playedAt}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{r.storeName}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-gray-800">{r.phone || '번호 없음'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
