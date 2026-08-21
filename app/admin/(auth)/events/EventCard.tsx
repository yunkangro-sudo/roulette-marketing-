'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Event {
  id: string
  store_id: string
  name: string
  status: string
  display_start_date: string
  display_end_date: string
  prize_tiers?: Array<{
    label: string
    amount: number
    total_quantity: number
    computed_probability: number
    requires_verification: boolean
  }>
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:    { label: '진행중', color: 'bg-green-100 text-green-700' },
  scheduled: { label: '예정됨', color: 'bg-blue-100 text-blue-700' },
  paused:    { label: '일시중지', color: 'bg-yellow-100 text-yellow-700' },
  ended:     { label: '종료됨', color: 'bg-gray-100 text-gray-500' },
  draft:     { label: '초안', color: 'bg-gray-100 text-gray-400' },
}

export default function EventCard({ event }: { event: Event }) {
  const router = useRouter()
  const [status, setStatus] = useState(event.status)
  const [toggling, setToggling] = useState(false)

  const s = STATUS_LABEL[status] ?? { label: status, color: 'bg-gray-100 text-gray-500' }
  const isActive = status === 'active'
  const isPaused = status === 'paused'
  const canToggle = isActive || isPaused

  async function handleToggle() {
    setToggling(true)
    const newStatus = isActive ? 'paused' : 'active'
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setStatus(newStatus)
        router.refresh()
      }
    } finally {
      setToggling(false)
    }
  }

  // 이벤트 복사: 티어 정보를 URL 파라미터로 전달
  function handleCopy() {
    const copyData = {
      name: event.name + ' (복사)',
      tiers: event.prize_tiers?.map(t => ({
        label: t.label,
        amount: t.amount,
        total_quantity: t.total_quantity,
        requires_verification: t.requires_verification,
      })) ?? [],
    }
    const encoded = encodeURIComponent(JSON.stringify(copyData))
    router.push(`/admin/events/new?copy=${encoded}`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
          <span className="text-xs text-gray-400 truncate">{event.store_id}</span>
        </div>
        <p className="font-semibold text-gray-900 truncate">{event.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {event.display_start_date} ~ {event.display_end_date}
        </p>
      </div>

      <div className="flex items-center flex-wrap gap-2 shrink-0">
        {/* 온/오프 토글 */}
        {canToggle && (
          <div className="flex items-center gap-1.5 py-1">
            <span className={`text-xs font-bold ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
              광고 {isActive ? '켜짐' : '꺼짐'}
            </span>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 ${
                isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
              title={isActive ? '클릭하면 광고를 끕니다 (이벤트 일시중지)' : '클릭하면 광고를 켭니다 (이벤트 진행 시작)'}
              aria-label={isActive ? '광고 끄기' : '광고 켜기'}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        )}

        {/* 복사 버튼 */}
        <button
          onClick={handleCopy}
          className="text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 px-2.5 py-2 rounded-lg transition-colors"
          title="이 이벤트를 복사해서 새로 등록"
        >
          복사
        </button>

        {/* 수정 */}
        <Link
          href={`/admin/events/${event.id}`}
          className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 px-3 py-2 rounded-lg transition-colors"
        >
          수정
        </Link>

        {/* 미리보기 */}
        <Link
          href={`/play/${event.store_id}`}
          target="_blank"
          className="text-xs text-orange-500 hover:underline px-1 py-2"
        >
          미리보기 →
        </Link>
      </div>
    </div>
  )
}
