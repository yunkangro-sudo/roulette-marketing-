'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import MiniLineChart from '@/components/admin/MiniLineChart'
import MiniDoughnutChart from '@/components/admin/MiniDoughnutChart'

type Range = 'today' | 'week' | 'month' | 'custom'

interface SubscriptionStatus {
  status: 'trial' | 'active' | 'grace' | 'expired'
  startDate: string | null
  endDate: string | null
  graceDaysLeft: number | null
}

interface SummaryData {
  range: Range
  startDate: string
  endDate: string
  subscriptionStatus: SubscriptionStatus
  hasActiveEvent: boolean
  activeEventName: string | null
  kpi: {
    participants: number
    couponAmount: number
    newMembers: number
    kakaoLogins: number
    daangnClicks: number
  }
  dailyParticipants: { date: string; count: number }[]
  tierDistribution: { label: string; count: number }[]
}

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'today', label: '오늘' },
  { value: 'week',  label: '이번주' },
  { value: 'month', label: '이번달' },
  { value: 'custom', label: '직접설정' },
]

const SUBSCRIPTION_LABEL: Record<SubscriptionStatus['status'], { label: string; className: string }> = {
  trial:   { label: '무제한 체험 중', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  active:  { label: '정상 이용중',   className: 'bg-green-50 text-green-700 border-green-200' },
  grace:   { label: '유예기간',      className: 'bg-orange-50 text-orange-700 border-orange-200' },
  expired: { label: '이용기간 만료', className: 'bg-red-50 text-red-700 border-red-200' },
}

const TIER_COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#eab308', '#6366f1']

export default function AdvertiserDashboardClient() {
  const [range, setRange] = useState<Range>('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    if (range === 'custom' && (!customFrom || !customTo)) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ range })
      if (range === 'custom') { params.set('from', customFrom); params.set('to', customTo) }
      const res = await fetch(`/api/admin/dashboard/summary?${params}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '조회 실패'); return }
      setData(json)
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [range, customFrom, customTo])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
          <p className="text-xs text-gray-400 mt-0.5">우리 매장 게임/쿠폰/회원 현황을 한눈에 확인하세요</p>
        </div>
        {data && (
          <span className={`inline-flex self-start sm:self-auto items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${SUBSCRIPTION_LABEL[data.subscriptionStatus.status].className}`}>
            {SUBSCRIPTION_LABEL[data.subscriptionStatus.status].label}
            {data.subscriptionStatus.endDate && ` · ~${data.subscriptionStatus.endDate}`}
          </span>
        )}
      </div>

      {data?.subscriptionStatus.status === 'grace' && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-3 text-sm font-semibold">
          이용기간이 만료되었습니다. {data.subscriptionStatus.graceDaysLeft}일 이내 갱신해주세요.
        </div>
      )}

      {data && !data.hasActiveEvent && (
        <div className="bg-gray-900 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-white font-bold">진행 중인 이벤트가 없습니다</p>
            <p className="text-gray-400 text-sm mt-0.5">새 이벤트를 등록하면 손님 게임 화면에 바로 반영됩니다.</p>
          </div>
          <Link href="/admin/events/new"
            className="shrink-0 bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-lg text-sm text-center transition-colors">
            + 이벤트 등록
          </Link>
        </div>
      )}

      {/* 기간 토글 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
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
        {range === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
            <span className="text-gray-400 text-center sm:text-left shrink-0">~</span>
            <input type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)}
              className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
      ) : data ? (
        <>
          {/* KPI 카드 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <KpiCard label="게임 참여자" value={`${data.kpi.participants.toLocaleString()}명`} />
            <KpiCard label="쿠폰 지급액" value={`${data.kpi.couponAmount.toLocaleString()}원`} />
            <KpiCard label="신규 회원" value={`${data.kpi.newMembers.toLocaleString()}명`} />
            <KpiCard label="카카오 로그인" value={`${data.kpi.kakaoLogins.toLocaleString()}건`} />
            <KpiCard label="당근 클릭" value={`${data.kpi.daangnClicks.toLocaleString()}건`} note="클릭 기준(실제 단골추가 확정 아님)" />
          </div>

          {/* 라인차트: 일별 참여자 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">일별 게임 참여자</h2>
            <MiniLineChart data={data.dailyParticipants.map((d) => ({ label: d.date, value: d.count }))} />
          </div>

          {/* 도넛차트: 티어별 당첨 분포 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">경품 티어별 당첨 분포</h2>
            <MiniDoughnutChart
              data={data.tierDistribution.map((t, i) => ({
                label: t.label, value: t.count, color: TIER_COLORS[i % TIER_COLORS.length],
              }))}
            />
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
