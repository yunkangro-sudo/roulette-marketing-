'use client'

import { useState, useEffect, useCallback } from 'react'

interface SegmentCounts {
  NEW: number; ACTIVE: number; AT_RISK: number; DORMANT: number; RETURNED: number;
}

interface ChurnLevelStat { total: number; recovered: number }
interface ChurnRiskData {
  counts: { interested: ChurnLevelStat; at_risk: ChurnLevelStat; dormant: ChurnLevelStat }
  total: number
  recoveryRate: number
}

interface StoreRow {
  storeId: string
  storeName: string
  participants: number
  couponsUsed: number
  returningVisitors: number
  isActual: boolean
  paymentCount: number
  additionalRevenue: number
  adBudget: number
  roi: number | null
}

interface DashboardData {
  stores: StoreRow[]
  averageRoi: number | null
  year: number
  month: number
}

const now = new Date()

export default function DashboardClient() {
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<DashboardData | null>(null)
  const [segments, setSegments] = useState<{ counts: SegmentCounts; total: number } | null>(null)
  const [churnRisk, setChurnRisk] = useState<ChurnRiskData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dashRes, segRes, churnRes] = await Promise.all([
        fetch(`/api/admin/dashboard?year=${year}&month=${month}`),
        fetch('/api/admin/segments'),
        fetch('/api/admin/churn-risk'),
      ])
      const json = await dashRes.json()
      if (!dashRes.ok) { setError(json.error ?? '조회 실패'); return }
      setData(json)

      if (segRes.ok) {
        const segJson = await segRes.json()
        setSegments(segJson)
      }
      if (churnRes.ok) {
        const churnJson = await churnRes.json()
        setChurnRisk(churnJson)
      }
    } catch {
      setError('네트워크 오류')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">에이전시 대시보드</h1>
            <p className="text-xs text-gray-400">전체 매장 비교</p>
          </div>
          <select value={`${year}-${month}`}
            onChange={(e) => { const [y, m] = e.target.value.split('-').map(Number); setYear(y); setMonth(m) }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-orange-500">
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

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm font-semibold">{error}</div>}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
        ) : data ? (
          <>
            <div className="bg-gray-900 rounded-2xl px-6 py-5 text-center">
              <p className="text-gray-400 text-sm mb-1">전체 매장 평균 ROI</p>
              <p className="text-6xl font-black text-white leading-none">
                {data.averageRoi !== null ? `${data.averageRoi}×` : '–'}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {data.year}년 {data.month}월 · {data.stores.length}개 매장 기준
              </p>
            </div>

            {/* 세그먼트 분포 카드 */}
            {segments && segments.total > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">고객 세그먼트 분포</h2>
                  <span className="text-xs text-gray-400">전체 {segments.total.toLocaleString()}명</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {(
                    [
                      { key: 'NEW',      label: '신규',      color: 'bg-blue-50 text-blue-700 border-blue-200' },
                      { key: 'ACTIVE',   label: '활성',      color: 'bg-green-50 text-green-700 border-green-200' },
                      { key: 'AT_RISK',  label: '이탈 위험', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                      { key: 'DORMANT',  label: '휴면',      color: 'bg-gray-50 text-gray-500 border-gray-200' },
                      { key: 'RETURNED', label: '복귀',      color: 'bg-purple-50 text-purple-700 border-purple-200' },
                    ] as const
                  ).map(({ key, label, color }) => {
                    const count = segments.counts[key] ?? 0
                    const pct = segments.total > 0 ? Math.round((count / segments.total) * 100) : 0
                    return (
                      <div key={key} className={`rounded-xl border px-3 py-3 text-center ${color}`}>
                        <p className="text-xs font-semibold mb-1">{label}</p>
                        <p className="text-xl font-black leading-none">{count.toLocaleString()}</p>
                        <p className="text-xs mt-1 opacity-70">{pct}%</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  * 세그먼트는 게임 플레이 시점에 갱신됩니다. 장기 미방문 고객은 추후 배치 스케줄러 연동 시 자동 갱신 예정.
                </p>
              </div>
            )}

            {/* 이탈 위험 관리 */}
            {churnRisk && churnRisk.total > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">⚠️ 이탈 위험 관리</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">총 {churnRisk.total}건</span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      churnRisk.recoveryRate >= 70
                        ? 'bg-green-100 text-green-700'
                        : churnRisk.recoveryRate >= 40
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      복귀율 {churnRisk.recoveryRate}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { key: 'interested' as const, label: '관심 이탈',  desc: '1.0~1.5배',  color: 'bg-blue-50 border-blue-200 text-blue-700' },
                      { key: 'at_risk'    as const, label: '이탈 위험',  desc: '1.5~2.5배',  color: 'bg-orange-50 border-orange-200 text-orange-700' },
                      { key: 'dormant'    as const, label: '완전 이탈',  desc: '2.5배 초과', color: 'bg-red-50 border-red-200 text-red-700' },
                    ]
                  ).map(({ key, label, desc, color }) => {
                    const stat = churnRisk.counts[key]
                    const rate = stat.total > 0 ? Math.round((stat.recovered / stat.total) * 100) : 0
                    return (
                      <div key={key} className={`rounded-xl border px-4 py-3 ${color}`}>
                        <p className="text-xs font-semibold">{label}</p>
                        <p className="text-xs opacity-60 mb-2">{desc}</p>
                        <p className="text-2xl font-black leading-none">{stat.total}</p>
                        <p className="text-xs mt-1 opacity-70">복귀 {rate}%</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  * 복귀 이력 기반 집계입니다. 미방문 중인 고객 실시간 탐지는 Phase 2 배치 연동 후 활성화됩니다.
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">매장별 지표 비교</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs">
                      <th className="text-left px-5 py-3 font-semibold">매장명</th>
                      <th className="text-right px-4 py-3 font-semibold">참여자</th>
                      <th className="text-right px-4 py-3 font-semibold">재방문</th>
                      <th className="text-right px-4 py-3 font-semibold">쿠폰사용</th>
                      <th className="text-right px-4 py-3 font-semibold">추가매출</th>
                      <th className="text-right px-4 py-3 font-semibold">ROI</th>
                      <th className="text-center px-4 py-3 font-semibold">기준</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.stores.slice().sort((a, b) => (b.roi ?? -Infinity) - (a.roi ?? -Infinity)).map((s) => (
                      <tr key={s.storeId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-900 max-w-[140px] truncate">{s.storeName}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{s.participants.toLocaleString()}명</td>
                        <td className="px-4 py-3 text-right text-gray-700">{s.returningVisitors.toLocaleString()}명</td>
                        <td className="px-4 py-3 text-right text-gray-700">{s.couponsUsed.toLocaleString()}건</td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {s.additionalRevenue > 0 ? `${s.additionalRevenue.toLocaleString()}원` : '–'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-black text-base ${s.roi !== null && s.roi >= 1 ? 'text-orange-500' : s.roi !== null ? 'text-gray-400' : 'text-gray-300'}`}>
                            {s.roi !== null ? `${s.roi}×` : '–'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s.isActual
                            ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">실측 ({s.paymentCount}건)</span>
                            : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">추정</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {data.stores.some((s) => !s.isActual) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-amber-800 mb-0.5">추정치 매장이 있습니다</p>
                <p className="text-xs text-amber-700">계산대 화면(/staff)에서 결제금액을 입력하면 해당 매장의 ROI가 실측 기준으로 전환됩니다.</p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
