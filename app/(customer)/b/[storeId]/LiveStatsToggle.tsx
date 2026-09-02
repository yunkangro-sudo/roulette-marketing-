'use client'

import { useState } from 'react'

interface PeriodStats {
  participantCount: number
  revisitRate: number
  issuedCount: number
}

interface Props {
  today: PeriodStats
  month: PeriodStats
}

/** "오늘/이번달" 토글 — 두 기간 데이터를 서버에서 한 번에 내려받아 클라이언트에서 전환만 한다 (추가 API 호출 없음) */
export default function LiveStatsToggle({ today, month }: Props) {
  const [range, setRange] = useState<'today' | 'month'>('month')
  const stats = range === 'today' ? today : month

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#222222]">오늘·이번달, 우리 매장</h2>
        <div className="flex rounded-full bg-[#F7F5F0] p-1">
          <button
            type="button"
            onClick={() => setRange('today')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${range === 'today' ? 'bg-white text-[#222222] shadow-sm' : 'text-[#222222]/40'}`}
          >
            오늘
          </button>
          <button
            type="button"
            onClick={() => setRange('month')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${range === 'month' ? 'bg-white text-[#222222] shadow-sm' : 'text-[#222222]/40'}`}
          >
            이번달
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat value={`${stats.participantCount.toLocaleString()}명`} label="참여자 수" />
        <Stat value={`${stats.revisitRate}%`} label="재방문율" />
        <Stat value={`${stats.issuedCount.toLocaleString()}건`} label="지급된 혜택" />
      </div>
    </section>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-[#F7F5F0] py-4 text-center">
      <p className="text-lg font-black text-[#00C7A7]">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-[#222222]/50">{label}</p>
    </div>
  )
}
