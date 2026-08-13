'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import StoreSelector from '../components/StoreSelector'

interface Props { role: string; storeId: string | null }

export default function LoyaltySettingsClient({ role, storeId }: Props) {
  const [selectedStore, setSelectedStore] = useState(storeId ?? '')
  const [pointPerVisit, setPointPerVisit] = useState(1000)
  const [usageThreshold, setUsageThreshold] = useState(5000)
  const [expiryDays, setExpiryDays] = useState('')
  const [revisitInterval, setRevisitInterval] = useState('7')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const load = useCallback(async (sid: string) => {
    if (!sid) return
    const res = await fetch(`/api/admin/loyalty-settings?store_id=${encodeURIComponent(sid)}`)
    if (res.ok) {
      const data = await res.json()
      setPointPerVisit(data.point_per_visit ?? 1000)
      setUsageThreshold(data.usage_threshold ?? 5000)
      setExpiryDays(data.point_expiry_days ? String(data.point_expiry_days) : '')
      setRevisitInterval(data.default_revisit_interval_days ? String(data.default_revisit_interval_days) : '7')
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (selectedStore) load(selectedStore)
    else setLoaded(false)
  }, [selectedStore, load])

  // 실시간 계산: 최소 N번 방문해야 사용 가능
  const visitsNeeded = useMemo(() => {
    if (!pointPerVisit || pointPerVisit <= 0) return null
    return Math.ceil(usageThreshold / pointPerVisit)
  }, [pointPerVisit, usageThreshold])

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
          default_revisit_interval_days: revisitInterval ? Number(revisitInterval) : 7,
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
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">

          {/* 방문 1회당 적립 포인트 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">방문 1회당 적립 포인트</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={pointPerVisit}
                onChange={(e) => setPointPerVisit(Number(e.target.value))}
                min={1}
                className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:border-orange-500"
              />
              <span className="text-sm text-gray-500">P / 회</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">게임 완료 시 꽝 포함 무조건 적립됩니다</p>
          </div>

          {/* 사용 가능 최소 잔액 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">리워드 사용 가능 최소 잔액</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={usageThreshold}
                onChange={(e) => setUsageThreshold(Number(e.target.value))}
                min={0}
                className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:border-orange-500"
              />
              <span className="text-sm text-gray-500">P 이상 보유 시 교환 가능</span>
            </div>
            {/* 실시간 계산 */}
            {visitsNeeded !== null && (
              <p className="text-sm font-semibold text-orange-500 mt-2">
                현재 설정 기준: {visitsNeeded}번 방문하면 사용 가능해요
              </p>
            )}
          </div>

          {/* 포인트 유효기간 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">포인트 유효기간</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                min={1}
                placeholder="미입력 시 무제한"
                className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-right text-sm placeholder:text-gray-300 focus:outline-none focus:border-orange-500"
              />
              <span className="text-sm text-gray-500">일</span>
            </div>
          </div>

          {/* 평균 재방문 주기 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              평균 재방문 주기 <span className="font-normal text-gray-400">(세그먼트 분류 기준)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={revisitInterval}
                onChange={(e) => setRevisitInterval(e.target.value)}
                min={1}
                className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:border-orange-500"
              />
              <span className="text-sm text-gray-500">일</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              손님별 방문 이력이 3회 미만일 때 세그먼트(이탈 위험·휴면) 판정에 사용하는 기준값이에요.
              업종 특성에 맞게 조정하세요 (기본값 7일).
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !loaded}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
          위에서 매장을 선택하면 정책을 설정할 수 있습니다
        </div>
      )}
    </div>
  )
}
