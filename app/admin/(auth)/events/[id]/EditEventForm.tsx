'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PrizeTier {
  id: string
  label: string
  amount: number
  total_quantity: number
  remaining_quantity: number
  computed_probability: number
  requires_verification: boolean
}

interface Event {
  id: string
  store_id: string
  name: string
  status: string
  display_start_date: string
  display_end_date: string
  expected_daily_participants: number
  coupon_validity_type: string
  coupon_validity_value: string
  prize_tiers: PrizeTier[]
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:    { label: '진행중', color: 'bg-green-100 text-green-700' },
  scheduled: { label: '예정됨', color: 'bg-blue-100 text-blue-700' },
  paused:    { label: '일시중지', color: 'bg-yellow-100 text-yellow-700' },
  ended:     { label: '종료됨', color: 'bg-gray-100 text-gray-500' },
  draft:     { label: '초안', color: 'bg-gray-100 text-gray-400' },
}

export default function EditEventForm({ event }: { event: Event }) {
  const router = useRouter()
  const s = STATUS_LABEL[event.status] ?? { label: event.status, color: 'bg-gray-100 text-gray-500' }

  const [name, setName] = useState(event.name)
  const [startDate, setStartDate] = useState(event.display_start_date)
  const [endDate, setEndDate] = useState(event.display_end_date)
  const [dailyParticipants, setDailyParticipants] = useState(event.expected_daily_participants)
  const [validityType, setValidityType] = useState<'relative_days' | 'fixed_date'>(
    event.coupon_validity_type as 'relative_days' | 'fixed_date'
  )

  // 고정 날짜면 "start~end" 형식으로 저장돼 있을 수 있음
  const isFixedRange = event.coupon_validity_type === 'fixed_date' && event.coupon_validity_value.includes('~')
  const [fixedStart, setFixedStart] = useState(isFixedRange ? event.coupon_validity_value.split('~')[0] : '')
  const [fixedEnd, setFixedEnd] = useState(isFixedRange ? event.coupon_validity_value.split('~')[1] : '')
  const [relativeDays, setRelativeDays] = useState(
    event.coupon_validity_type === 'relative_days' ? event.coupon_validity_value : '14'
  )

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) { setError('이벤트명을 입력해주세요'); return }
    if (!startDate || !endDate) { setError('노출 기간을 설정해주세요'); return }
    if (new Date(endDate) < new Date(startDate)) { setError('종료일이 시작일보다 빠릅니다'); return }
    if (validityType === 'fixed_date' && (!fixedStart || !fixedEnd)) {
      setError('쿠폰 사용 기간의 시작일과 종료일을 모두 선택해주세요'); return
    }

    const coupon_validity_value = validityType === 'fixed_date'
      ? `${fixedStart}~${fixedEnd}`
      : relativeDays

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          display_start_date: startDate,
          display_end_date: endDate,
          expected_daily_participants: Number(dailyParticipants),
          coupon_validity_type: validityType,
          coupon_validity_value,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '저장에 실패했습니다'); return }
      setSuccess('저장되었습니다')
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    setStatusLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '상태 변경 실패'); return }
      setSuccess(`상태가 "${STATUS_LABEL[newStatus]?.label ?? newStatus}"으로 변경되었습니다`)
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setStatusLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/events" className="text-gray-400 hover:text-gray-600 text-sm">← 목록으로</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">이벤트 수정</h1>
      </div>

      {/* 상태 + 매장 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${s.color}`}>{s.label}</span>
            <span className="text-sm text-gray-500 font-mono">{event.store_id}</span>
          </div>
          <Link
            href={`/play/${event.store_id}`}
            target="_blank"
            className="text-xs text-orange-500 hover:underline"
          >
            게임 미리보기 →
          </Link>
        </div>

        {/* 상태 변경 버튼 */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {event.status !== 'active' && (
            <button onClick={() => handleStatusChange('active')} disabled={statusLoading}
              className="text-xs bg-green-50 hover:bg-green-100 text-green-700 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
              진행 중으로 변경
            </button>
          )}
          {event.status !== 'paused' && event.status !== 'ended' && (
            <button onClick={() => handleStatusChange('paused')} disabled={statusLoading}
              className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
              일시 중지
            </button>
          )}
          {event.status !== 'ended' && (
            <button onClick={() => handleStatusChange('ended')} disabled={statusLoading}
              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
              이벤트 종료
            </button>
          )}
        </div>
      </div>

      {/* 알림 */}
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{success}</div>}

      {/* 수정 폼 */}
      <form onSubmit={handleSave} className="space-y-5">

        {/* 이벤트명 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-bold text-gray-900 mb-2">이벤트명</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500" />
        </div>

        {/* 노출 기간 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-bold text-gray-900 mb-3">이벤트 노출 기간</label>
          <div className="flex gap-3 items-center">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500" />
            <span className="text-gray-400 shrink-0">~</span>
            <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500" />
          </div>
        </div>

        {/* 예상 참여자 수 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-bold text-gray-900 mb-2">하루 예상 참여자 수</label>
          <div className="flex items-center gap-2">
            <input type="number" min={1} value={dailyParticipants}
              onChange={(e) => setDailyParticipants(Number(e.target.value))}
              className="w-40 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500" />
            <span className="text-gray-500 text-sm">명/일</span>
          </div>
        </div>

        {/* 쿠폰 사용기간 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-bold text-gray-900 mb-3">쿠폰 사용 기간</label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={validityType === 'relative_days'} onChange={() => setValidityType('relative_days')} className="accent-orange-500" />
              <span className="text-sm text-gray-700">발급일로부터 N일</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={validityType === 'fixed_date'} onChange={() => setValidityType('fixed_date')} className="accent-orange-500" />
              <span className="text-sm text-gray-700">고정 날짜</span>
            </label>
          </div>
          {validityType === 'relative_days' ? (
            <div className="flex items-center gap-2">
              <input type="number" min={1} value={relativeDays} onChange={(e) => setRelativeDays(e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-orange-500" />
              <span className="text-gray-500 text-sm">일 이내 사용 가능</span>
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">시작일</label>
                <input type="date" value={fixedStart} onChange={(e) => setFixedStart(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-orange-500" />
              </div>
              <span className="text-gray-400 mt-5 shrink-0">~</span>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">종료일</label>
                <input type="date" value={fixedEnd} min={fixedStart} onChange={(e) => setFixedEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-orange-500" />
              </div>
            </div>
          )}
        </div>

        {/* 저장 */}
        <button type="submit" disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-lg text-base transition-colors disabled:opacity-40">
          {loading ? '저장 중...' : '변경사항 저장'}
        </button>
      </form>

      {/* 경품 티어 (읽기 전용) */}
      <div className="mt-8">
        <h2 className="text-sm font-bold text-gray-900 mb-3">경품 티어 현황</h2>
        <div className="space-y-2">
          {event.prize_tiers?.map((tier) => (
            <div key={tier.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900">{tier.label}</span>
                  {tier.amount > 0 && (
                    <span className="ml-2 text-sm text-gray-500">{tier.amount.toLocaleString()}원</span>
                  )}
                  {tier.requires_verification && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">직원 확인 필요</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-orange-500">{tier.computed_probability.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">
                    잔여 {tier.remaining_quantity} / 총 {tier.total_quantity}개
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">※ 경품 티어 수량 변경은 현재 지원되지 않습니다. 이벤트를 종료하고 새로 등록해주세요.</p>
      </div>
    </div>
  )
}
