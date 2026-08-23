'use client'

import { useState, useEffect } from 'react'

interface SummaryData {
  kpi: {
    participants: number
    couponAmount: number
    newMembers: number
    kakaoLogins: number
    daangnClicks: number
  }
}

interface Props {
  storeId: string
}

/** 업체 상세 "요약 현황" 탭 — 광고주 대시보드 API를 storeId 파라미터로 읽기 전용 재사용 */
export default function CompanySummaryPanel({ storeId }: Props) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/admin/dashboard/summary?range=month&storeId=${storeId}`)
      .then(async (res) => {
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) { setError(json.error ?? '조회 실패'); return }
        setData(json)
      })
      .catch(() => { if (!cancelled) setError('네트워크 오류가 발생했습니다') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [storeId])

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
  if (!data) return null

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">이번달 기준 (읽기 전용, 대리접속 없이도 조회 가능)</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard label="게임 참여자" value={`${data.kpi.participants.toLocaleString()}명`} />
        <KpiCard label="쿠폰 지급액" value={`${data.kpi.couponAmount.toLocaleString()}원`} />
        <KpiCard label="신규 회원" value={`${data.kpi.newMembers.toLocaleString()}명`} />
        <KpiCard label="카카오 로그인" value={`${data.kpi.kakaoLogins.toLocaleString()}건`} />
        <KpiCard label="당근 클릭" value={`${data.kpi.daangnClicks.toLocaleString()}건`} />
      </div>
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
    </div>
  )
}
