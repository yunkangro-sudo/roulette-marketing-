'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import StoreSelector from '../components/StoreSelector'

interface Props { role: string; storeId: string | null }

interface RewardOption { id: string; name: string }

export default function LoyaltySettingsClient({ role, storeId }: Props) {
  const [selectedStore, setSelectedStore] = useState(storeId ?? '')
  const [pointPerVisit, setPointPerVisit] = useState(1000)
  const [usageThreshold, setUsageThreshold] = useState(5000)
  const [expiryDays, setExpiryDays] = useState('')
  const [revisitInterval, setRevisitInterval] = useState('7')
  const [avgOrderValue, setAvgOrderValue] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [pointsEnabled, setPointsEnabled] = useState(true)

  const [nfcEnabled, setNfcEnabled] = useState(false)
  const [nfcMode, setNfcMode] = useState<'points' | 'stamp'>('points')
  const [nfcPoints, setNfcPoints] = useState(1000)
  const [stampGoal, setStampGoal] = useState(10)
  const [stampRewardId, setStampRewardId] = useState('')
  const [rewardOptions, setRewardOptions] = useState<RewardOption[]>([])
  const [copied, setCopied] = useState(false)

  const load = useCallback(async (sid: string) => {
    if (!sid) return
    const res = await fetch(`/api/admin/loyalty-settings?store_id=${encodeURIComponent(sid)}`)
    if (res.ok) {
      const data = await res.json()
      setPointPerVisit(data.point_per_visit ?? 1000)
      setUsageThreshold(data.usage_threshold ?? 5000)
      setExpiryDays(data.point_expiry_days ? String(data.point_expiry_days) : '')
      setRevisitInterval(data.default_revisit_interval_days ? String(data.default_revisit_interval_days) : '7')
      setPointsEnabled(data.points_enabled !== false)
      setAvgOrderValue(data.average_order_value ? String(data.average_order_value) : '')
      setNfcEnabled(data.nfc_checkin_enabled === true)
      setNfcMode(data.nfc_checkin_mode === 'stamp' ? 'stamp' : 'points')
      setNfcPoints(data.nfc_checkin_points ?? 1000)
      setStampGoal(data.stamp_goal_count ?? 10)
      setStampRewardId(data.stamp_reward_id ?? '')
      setRewardOptions(data.reward_options ?? [])
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

  const checkinUrl = useMemo(() => {
    if (!selectedStore) return ''
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.dgting.co.kr'
    return `${origin}/checkin/${selectedStore}`
  }, [selectedStore])

  function handleCopyCheckinUrl() {
    if (!checkinUrl) return
    navigator.clipboard.writeText(checkinUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

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
          points_enabled: pointsEnabled,
          average_order_value: avgOrderValue ? Number(avgOrderValue) : 0,
          nfc_checkin_enabled: nfcEnabled,
          nfc_checkin_mode: nfcMode,
          nfc_checkin_points: nfcPoints,
          stamp_goal_count: stampGoal,
          stamp_reward_id: nfcMode === 'stamp' ? (stampRewardId || null) : stampRewardId || null,
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

          <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">포인트 적립 사용</p>
              <p className="text-xs text-gray-400 mt-1">
                끄면 게임 완료 시 포인트 적립을 하지 않습니다. 쿠폰 발급은 그대로입니다.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pointsEnabled}
              onClick={() => setPointsEnabled((v) => !v)}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
                pointsEnabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 rounded-full bg-white shadow mt-0.5 transition-transform ${
                  pointsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* 방문 1회당 적립 포인트 */}
          <div className={pointsEnabled ? '' : 'opacity-40 pointer-events-none'}>
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

          {/* 평균 결제금액(객단가) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">평균 결제금액 (객단가)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={avgOrderValue}
                onChange={(e) => setAvgOrderValue(e.target.value)}
                min={0}
                placeholder="0"
                className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-right text-sm placeholder:text-gray-300 focus:outline-none focus:border-orange-500"
              />
              <span className="text-sm text-gray-500">원</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              재방문 손님이 평균적으로 얼마 정도 결제하는지 입력해주세요. 성과 리포트의 추가매출 추정에 사용돼요.
            </p>
          </div>

          {/* NFC 방문 적립 */}
          <div className="pt-5 border-t border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">NFC 방문 적립 사용</p>
                <p className="text-xs text-gray-400 mt-1">
                  매장에 NFC 태그를 놓으면, 손님이 폰을 태그하는 것만으로 방문 적립이 돼요. 게임/경품과는 별개예요.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={nfcEnabled}
                onClick={() => setNfcEnabled((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
                  nfcEnabled ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 rounded-full bg-white shadow mt-0.5 transition-transform ${
                    nfcEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {nfcEnabled && (
              <div className="mt-4 space-y-4">
                {/* 모드 선택 */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNfcMode('points')}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                      nfcMode === 'points'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    포인트 적립 (기본)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNfcMode('stamp')}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                      nfcMode === 'stamp'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    스탬프 적립
                  </button>
                </div>

                {nfcMode === 'points' ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">1회 방문당 적립 포인트</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={nfcPoints}
                        onChange={(e) => setNfcPoints(Number(e.target.value))}
                        min={1}
                        className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:border-orange-500"
                      />
                      <span className="text-sm text-gray-500">P / 회</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">목표 방문 횟수</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={stampGoal}
                          onChange={(e) => setStampGoal(Number(e.target.value))}
                          min={1}
                          className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:border-orange-500"
                        />
                        <span className="text-sm text-gray-500">회 채우면 리워드 지급</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">다 채웠을 때 지급할 리워드</label>
                      {rewardOptions.length === 0 ? (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2.5">
                          먼저 리워드를 등록해주세요 (리워드 관리 메뉴)
                        </p>
                      ) : (
                        <select
                          value={stampRewardId}
                          onChange={(e) => setStampRewardId(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                        >
                          <option value="">선택해주세요</option>
                          {rewardOptions.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </>
                )}

                {/* 체크인 URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">NFC 태그에 저장할 URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={checkinUrl}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 bg-gray-50 truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyCheckinUrl}
                      className="shrink-0 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      {copied ? '복사됨!' : '복사'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    이 주소를 NFC 태그에 저장하면, 손님이 폰을 태그에 대는 것만으로 방문 적립이 돼요.
                  </p>
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2 leading-relaxed">
                    ⚠️ 이 URL을 손님이 즐겨찾기해두면, 태그 없이도 하루 1회 적립될 수 있어요. 리워드 가치가 크지 않은 매장에 추천드려요.
                  </p>
                </div>
              </div>
            )}
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
