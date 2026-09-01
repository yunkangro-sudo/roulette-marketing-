'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import MiniLineChart from '@/components/admin/MiniLineChart'
import MiniBarChart from '@/components/admin/MiniBarChart'

type Range = 'today' | 'week' | 'month'

interface ExpiringStore {
  storeId: string
  storeName: string
  endDate: string
  status: 'grace' | 'active'
  graceDaysLeft: number | null
}

interface SummaryData {
  range: Range
  startDate: string
  endDate: string
  kpi: {
    totalStores: number
    statusBreakdown: { active: number; grace: number; expired: number; trial: number }
    totalParticipants: number
    totalCouponAmount: number
    subscriptionRevenue: number
    newStores: number
    newMembers: number
    daangnClicks: number
  }
  expiringSoon: ExpiringStore[]
  dailyParticipants: { date: string; count: number }[]
  topStores: { storeId: string; storeName: string; count: number }[]
  signupTrend: { date: string; count: number }[]
  rewardStats: { type: string; label: string; count: number; percent: number }[]
  couponStats: { issued: number; used: number; usageRate: number | null }
  revisit: { cohortCount: number; convertedCount: number; rate: number | null; hasEnoughData: boolean }
}

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'today', label: '오늘' },
  { value: 'week',  label: '이번주' },
  { value: 'month', label: '이번달' },
]

export default function SuperDashboardClient() {
  const [range, setRange] = useState<Range>('today')
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/super/dashboard?range=${range}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '조회 실패'); return }
      setData(json)
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">전체 대시보드</h1>
        <p className="text-xs text-gray-400 mt-0.5">전체 매장 합산 현황을 한눈에 확인하세요</p>
      </div>

      {/* 기간 토글 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setRange(opt.value)}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${
                range === opt.value ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
      ) : data ? (
        <>
          {/* 만료임박 매장 알림 — 영업상 가장 중요한 섹션이라 카드보다 상단에 눈에 띄게 배치 */}
          {data.expiringSoon.length > 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 space-y-2">
              <h2 className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                ⚠️ 이용기간 만료임박 업체 ({data.expiringSoon.length})
              </h2>
              <div className="space-y-1.5">
                {data.expiringSoon.map((s) => (
                  <Link
                    key={s.storeId}
                    href="/admin/companies"
                    className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 hover:shadow-sm transition-shadow"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{s.storeName}</p>
                      <p className="text-xs text-gray-400">~{s.endDate}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
                      s.status === 'grace' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {s.status === 'grace' ? `유예기간 (${s.graceDaysLeft}일 남음)` : 'D-임박'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* KPI 카드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiCard label="전체 매장 수" value={`${data.kpi.totalStores.toLocaleString()}곳`}
              note={`정상 ${data.kpi.statusBreakdown.active} · 유예 ${data.kpi.statusBreakdown.grace} · 만료 ${data.kpi.statusBreakdown.expired} · 체험 ${data.kpi.statusBreakdown.trial}`} />
            <KpiCard label="전체 게임 참여자" value={`${data.kpi.totalParticipants.toLocaleString()}명`} />
            <KpiCard label="전체 쿠폰 지급액" value={`${data.kpi.totalCouponAmount.toLocaleString()}원`} />
            <KpiCard label="구독 매출 합계" value={`${data.kpi.subscriptionRevenue.toLocaleString()}원`} note="결제 등록일 기준" />
            <KpiCard label="신규 매장" value={`${data.kpi.newStores.toLocaleString()}곳`} />
            <KpiCard label="전체 가입 회원수" value={`${data.kpi.newMembers.toLocaleString()}명`} note="신규 카카오 인증 완료 기준" />
            <KpiCard label="당근 단골 클릭수" value={`${data.kpi.daangnClicks.toLocaleString()}건`} note="클릭 기준, 실제 단골추가 확정 아님" />
          </div>

          {/* 라인차트: 일별 전체 참여자 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">일별 전체 참여자 추이</h2>
            <MiniLineChart data={data.dailyParticipants.map((d) => ({ label: d.date, value: d.count }))} />
          </div>

          {/* 라인차트: 업체 가입현황 추이 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">업체 가입현황 추이</h2>
            <MiniLineChart data={data.signupTrend.map((d) => ({ label: d.date, value: d.count }))} color="#00C7A7" />
          </div>

          {/* 바차트: 매장별 참여자 Top 10 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">매장별 참여자 Top 10</h2>
            <MiniBarChart data={data.topStores.map((s) => ({ label: s.storeName, value: s.count }))} />
          </div>

          {/* 바차트: 리워드 유형별 등록 비율 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-1">리워드 유형별 등록 비율</h2>
            <p className="text-[11px] text-gray-400 mb-4">전체 매장의 활성 리워드 기준 · 온보딩 컨설팅 참고용</p>
            {data.rewardStats.length > 0 ? (
              <MiniBarChart data={data.rewardStats.map((r) => ({ label: `${r.label} (${r.percent}%)`, value: r.count }))} color="#D9A94F" />
            ) : (
              <div className="text-center py-8 text-xs text-gray-400">등록된 리워드가 없습니다</div>
            )}
          </div>

          {/* 쿠폰 사용통계 + 재방문 통계 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">쿠폰 사용통계</h2>
              <p className="text-2xl font-black text-gray-900 leading-none">
                {data.couponStats.usageRate !== null ? `${data.couponStats.usageRate}%` : '집계 중'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                발급 {data.couponStats.issued.toLocaleString()}건 · 사용 {data.couponStats.used.toLocaleString()}건
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">전체 매장 평균 재방문율</h2>
              {data.revisit.hasEnoughData ? (
                <>
                  <p className="text-2xl font-black text-gray-900 leading-none">{data.revisit.rate}%</p>
                  <p className="text-xs text-gray-400 mt-2">
                    직전 구간 신규 {data.revisit.cohortCount.toLocaleString()}명 중 {data.revisit.convertedCount.toLocaleString()}명 재방문
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400 py-2">데이터가 더 쌓이면 보여드릴게요</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function KpiCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
      {note && <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">{note}</p>}
    </div>
  )
}
