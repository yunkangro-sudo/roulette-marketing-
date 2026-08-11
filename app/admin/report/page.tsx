'use client'

import { useState, useEffect, useCallback } from 'react'

interface FunnelData {
  storeId: string
  storeName: string
  year: number
  month: number
  adBudget: number
  avgOrderValue: number
  participants: number
  couponsIssued: number
  couponsUsed: number
  returningVisitors: number
  paymentSampleCount: number
  paymentTotal: number
  additionalRevenue: {
    value: number
    isActual: boolean
    sampleCount: number
  }
  roi: number | null
}

interface Store {
  store_id: string
  store_name: string
}

function Badge({ isActual, sampleCount }: { isActual: boolean; sampleCount?: number }) {
  if (isActual) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        실측 기준 ({sampleCount}건)
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      추정치
    </span>
  )
}

function FunnelRow({
  step,
  label,
  value,
  sub,
  badge,
  highlight,
}: {
  step: number
  label: string
  value: string
  sub?: string
  badge?: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-xl ${highlight ? 'bg-orange-50 border-2 border-orange-200' : 'bg-white border border-gray-100'}`}>
      <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold shrink-0">
        {step}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-xl font-bold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  )
}

const now = new Date()

export default function AdminReportPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState('')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<FunnelData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/stores')
      .then((r) => r.json())
      .then((json) => {
        setStores(json.stores ?? [])
        if (json.stores?.length > 0) setSelectedStore(json.stores[0].store_id)
      })
      .catch(() => setError('매장 목록 조회 실패'))
  }, [])

  const fetchReport = useCallback(async () => {
    if (!selectedStore) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/admin/report?store_id=${encodeURIComponent(selectedStore)}&year=${year}&month=${month}`
      )
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '조회 실패'); return }
      setData(json)
    } catch {
      setError('네트워크 오류')
    } finally {
      setLoading(false)
    }
  }, [selectedStore, year, month])

  useEffect(() => {
    if (selectedStore) fetchReport()
  }, [fetchReport, selectedStore])

  const couponUseRate =
    data && data.couponsIssued > 0
      ? Math.round((data.couponsUsed / data.couponsIssued) * 1000) / 10
      : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-gray-900">성과 리포트</h1>
          <div className="flex gap-2">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-orange-500"
            >
              {stores.map((s) => (
                <option key={s.store_id} value={s.store_id}>{s.store_name}</option>
              ))}
            </select>
            <select
              value={`${year}-${month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number)
                setYear(y); setMonth(m)
              }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-orange-500"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                return (
                  <option key={i} value={`${d.getFullYear()}-${d.getMonth() + 1}`}>
                    {d.getFullYear()}년 {d.getMonth() + 1}월
                  </option>
                )
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-3">
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
        ) : data ? (
          <>
            {/* 타이틀 */}
            <div className="px-1 pb-1">
              <p className="text-sm text-gray-500">{data.year}년 {data.month}월 · {data.storeName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                평균 객단가 {(data.avgOrderValue ?? 0).toLocaleString()}원 기준
              </p>
            </div>

            {/* 퍼널 */}
            <FunnelRow step={1} label="월 광고비" value={`${(data.adBudget ?? 0).toLocaleString()}원`}
              sub="store_settings 기준" />
            <div className="text-center text-gray-300 text-lg">↓</div>

            <FunnelRow step={2} label="게임 참여자" value={`${data.participants.toLocaleString()}명`} />
            <div className="text-center text-gray-300 text-lg">↓</div>

            <FunnelRow step={3} label="쿠폰 발급" value={`${data.couponsIssued.toLocaleString()}건`} />
            <div className="text-center text-gray-300 text-lg">↓</div>

            <FunnelRow
              step={4}
              label="쿠폰 사용"
              value={`${data.couponsUsed.toLocaleString()}건`}
              sub={data.couponsIssued > 0 ? `사용률 ${couponUseRate}%` : undefined}
            />
            <div className="text-center text-gray-300 text-lg">↓</div>

            <FunnelRow step={5} label="재방문 손님" value={`${data.returningVisitors.toLocaleString()}명`}
              sub="이전 달 방문 이력 있는 재방문자" />
            <div className="text-center text-gray-300 text-lg">↓</div>

            <FunnelRow
              step={6}
              label="추가 매출"
              value={`${(data.additionalRevenue.value ?? 0).toLocaleString()}원`}
              sub={
                data.additionalRevenue.isActual
                  ? `결제금액 합계 (총 ${data.additionalRevenue.sampleCount}건)`
                  : `객단가 ${(data.avgOrderValue ?? 0).toLocaleString()}원 × 재방문 ${data.returningVisitors}명`
              }
              badge={
                <Badge
                  isActual={data.additionalRevenue.isActual}
                  sampleCount={data.additionalRevenue.sampleCount}
                />
              }
            />
            <div className="text-center text-gray-300 text-lg">↓</div>

            {/* ROI — 강조 */}
            <div className={`px-5 py-5 rounded-xl border-2 ${
              data.roi !== null && data.roi >= 1
                ? 'bg-orange-500 border-orange-500'
                : 'bg-gray-100 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${data.roi !== null && data.roi >= 1 ? 'text-orange-100' : 'text-gray-500'}`}>
                    ROI (추가매출 ÷ 광고비)
                  </p>
                  {data.adBudget <= 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">광고비 미입력 시 계산 불가</p>
                  )}
                </div>
                <p className={`text-4xl font-black ${
                  data.roi !== null && data.roi >= 1 ? 'text-white' : 'text-gray-400'
                }`}>
                  {data.roi !== null ? `${data.roi}×` : '–'}
                </p>
              </div>
              {data.roi !== null && (
                <p className={`text-xs mt-2 ${data.roi >= 1 ? 'text-orange-100' : 'text-gray-400'}`}>
                  {data.additionalRevenue.isActual
                    ? `실측 기준 (${data.additionalRevenue.sampleCount}건) — 실제 수익 기준`
                    : '추정치 — 실제와 다를 수 있음'}
                </p>
              )}
            </div>

            {/* 결제금액 실측 안내 */}
            {!data.additionalRevenue.isActual && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-amber-800 mb-1">실측치로 정확도를 높이려면</p>
                <p className="text-xs text-amber-700">
                  계산대 화면(/staff)에서 쿠폰 처리 시 결제금액을 입력하면 ROI가 실측 기준으로 바뀝니다.
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
