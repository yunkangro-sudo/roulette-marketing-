'use client'

import { useState, useEffect, useCallback } from 'react'
import MiniLineChart from '@/components/admin/MiniLineChart'

type Range = 'today' | 'week' | 'month' | 'custom'

interface Member {
  maskedPhone: string
  firstSeenAt: string | null
  lastVisitAt: string | null
  visitCount: number
  kakaoLinked: boolean
  daangnClicked: boolean
  segment: string
}

interface MembersData {
  range: Range
  startDate: string
  endDate: string
  kpi: { newMembers: number; totalMembers: number; kakaoLogins: number; daangnClicks: number }
  dailySignups: { date: string; count: number }[]
  members: Member[]
  memberListLimited: boolean
}

interface SegmentData {
  counts: { NEW: number; ACTIVE: number; AT_RISK: number; DORMANT: number; RETURNED: number }
  total: number
}

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'today', label: '오늘' },
  { value: 'week',  label: '이번주' },
  { value: 'month', label: '이번달' },
  { value: 'custom', label: '직접설정' },
]

const SEGMENT_META: { key: keyof SegmentData['counts']; label: string; color: string }[] = [
  { key: 'NEW',      label: '신규',      color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'ACTIVE',   label: '활성(재방문)', color: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'AT_RISK',  label: '이탈 위험', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { key: 'DORMANT',  label: '휴면',      color: 'bg-gray-50 text-gray-500 border-gray-200' },
  { key: 'RETURNED', label: '복귀',      color: 'bg-purple-50 text-purple-700 border-purple-200' },
]

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function MembersClient() {
  const [range, setRange] = useState<Range>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [data, setData] = useState<MembersData | null>(null)
  const [segments, setSegments] = useState<SegmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    if (range === 'custom' && (!customFrom || !customTo)) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ range })
      if (range === 'custom') { params.set('from', customFrom); params.set('to', customTo) }
      const [membersRes, segRes] = await Promise.all([
        fetch(`/api/admin/members?${params}`),
        fetch('/api/admin/segments'),
      ])
      const membersJson = await membersRes.json()
      if (!membersRes.ok) { setError(membersJson.error ?? '조회 실패'); return }
      setData(membersJson)
      if (segRes.ok) setSegments(await segRes.json())
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [range, customFrom, customTo])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">회원 관리</h1>
        <p className="text-xs text-gray-400 mt-0.5">우리 매장에 방문한 손님들의 카카오 인증·방문 현황을 확인하세요</p>
      </div>

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="신규 회원 (기간)" value={`${data.kpi.newMembers.toLocaleString()}명`} />
            <KpiCard label="누적 회원" value={`${data.kpi.totalMembers.toLocaleString()}명`} />
            <KpiCard label="카카오 로그인 (기간)" value={`${data.kpi.kakaoLogins.toLocaleString()}건`} />
            <KpiCard label="당근 클릭 (기간)" value={`${data.kpi.daangnClicks.toLocaleString()}건`} note="클릭 기준(실제 단골추가 확정 아님)" />
          </div>

          {/* 신규 vs 재방문 세그먼트 비율 */}
          {segments && segments.total > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900">신규 · 재방문 비율</h2>
                <span className="text-xs text-gray-400">전체 {segments.total.toLocaleString()}명</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SEGMENT_META.map(({ key, label, color }) => {
                  const count = segments.counts[key] ?? 0
                  const pct = segments.total > 0 ? Math.round((count / segments.total) * 100) : 0
                  return (
                    <div key={key} className={`rounded-xl border px-3 py-3 text-center ${color}`}>
                      <p className="text-xs font-semibold mb-1">{label}</p>
                      <p className="text-lg font-black leading-none">{count.toLocaleString()}</p>
                      <p className="text-xs mt-1 opacity-70">{pct}%</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 일별 신규가입 라인차트 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">일별 신규가입 추이</h2>
            <MiniLineChart data={data.dailySignups.map((d) => ({ label: d.date, value: d.count }))} color="#3b82f6" />
          </div>

          {/* 회원 리스트 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">회원 리스트</h2>
              <span className="text-xs text-gray-400">최근 방문순 {data.members.length}명{data.memberListLimited ? ' (최대 200명 표시)' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="text-left px-4 py-3 font-semibold">전화번호</th>
                    <th className="text-left px-4 py-3 font-semibold">최초방문</th>
                    <th className="text-right px-4 py-3 font-semibold">총방문</th>
                    <th className="text-center px-4 py-3 font-semibold">카카오연동</th>
                    <th className="text-center px-4 py-3 font-semibold">당근클릭</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.members.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">회원 데이터가 없습니다</td></tr>
                  ) : data.members.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-700">{m.maskedPhone}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(m.firstSeenAt)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{m.visitCount}회</td>
                      <td className="px-4 py-3 text-center">
                        {m.kakaoLinked
                          ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">O</span>
                          : <span className="text-xs text-gray-300">X</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {m.daangnClicked
                          ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">O</span>
                          : <span className="text-xs text-gray-300">X</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
