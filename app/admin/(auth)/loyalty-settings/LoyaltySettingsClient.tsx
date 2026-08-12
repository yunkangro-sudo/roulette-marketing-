'use client'

import { useEffect, useState, useCallback } from 'react'
import StoreSelector from '../components/StoreSelector'

interface Props { role: string; storeId: string | null }

export default function LoyaltySettingsClient({ role, storeId }: Props) {
  const [selectedStore, setSelectedStore] = useState(storeId ?? '')
  const [pointPerVisit, setPointPerVisit] = useState(10)
  const [usageThreshold, setUsageThreshold] = useState(100)
  const [expiryDays, setExpiryDays] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const load = useCallback(async (sid: string) => {
    if (!sid) return
    const res = await fetch(`/api/admin/loyalty-settings?store_id=${encodeURIComponent(sid)}`)
    if (res.ok) {
      const data = await res.json()
      setPointPerVisit(data.point_per_visit ?? 10)
      setUsageThreshold(data.usage_threshold ?? 100)
      setExpiryDays(data.point_expiry_days ? String(data.point_expiry_days) : '')
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (selectedStore) load(selectedStore)
    else setLoaded(false)
  }, [selectedStore, load])

  async function handleSave() {
    if (!selectedStore) { setMessage({ text: '매장을 먼저 선택해주세요', ok: false }); return }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/loyalty-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: selectedStore,
          point_per_visit: pointPerVisit,
          usage_threshold: usageThreshold,
          point_expiry_days: expiryDays ? Number(expiryDays) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) setMessage({ text: data.error ?? '저장 실패', ok: false })
      else setMessage({ text: '✅ 저장되었습니다', ok: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-4">포인트 정책 설정</h1>

      {/* 매장 선택 */}
      <div className="mb-5">
        <StoreSelector
          role={role}
          sessionStoreId={storeId}
          selectedStoreId={selectedStore}
          onSelect={setSelectedStore}
        />
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          message.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {selectedStore ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">방문 1회당 적립 포인트</label>
            <div className="flex items-center gap-2">
              <input type="number" value={pointPerVisit} onChange={(e) => setPointPerVisit(Number(e.target.value))} min={1}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-right text-sm" />
              <span className="text-sm text-gray-500">P / 회</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">게임 완료 시 꽝 포함 무조건 적립됩니다</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">리워드 사용 가능 최소 잔액</label>
            <div className="flex items-center gap-2">
              <input type="number" value={usageThreshold} onChange={(e) => setUsageThreshold(Number(e.target.value))} min={0}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-right text-sm" />
              <span className="text-sm text-gray-500">P 이상 보유 시 교환 가능</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">포인트 유효기간</label>
            <div className="flex items-center gap-2">
              <input type="number" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} min={1}
                placeholder="미입력 시 무제한"
                className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-right text-sm placeholder:text-gray-300" />
              <span className="text-sm text-gray-500">일</span>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving || !loaded}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors">
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
          위에서 매장을 선택하면 정책을 설정할 수 있습니다
        </div>
      )}

      <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-xs text-orange-700">
        <strong>예시:</strong> 적립 10P / 최소 50P → 5번 방문 후부터 교환 가능
      </div>
    </div>
  )
}
