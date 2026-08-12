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

interface HistoryEntry {
  id: string
  previous_quantity: number
  new_quantity: number
  changed_at: string
  store_accounts: { email: string; role: string } | null
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

  // 티어 수량 증가 상태
  const [addQtyMap, setAddQtyMap] = useState<Record<string, number>>({})
  const [tierLoading, setTierLoading] = useState<Record<string, boolean>>({})
  const [tierError, setTierError] = useState<Record<string, string>>({})
  const [tierSuccess, setTierSuccess] = useState<Record<string, string>>({})

  // 변경 이력
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryEntry[]>>({})
  const [historyOpen, setHistoryOpen] = useState<Record<string, boolean>>({})
  const [historyLoading, setHistoryLoading] = useState<Record<string, boolean>>({})

  const isActive = event.status === 'active'

  async function handleAddQuantity(tier: PrizeTier) {
    const add = addQtyMap[tier.id]
    if (!add || add <= 0) {
      setTierError((p) => ({ ...p, [tier.id]: '추가할 수량을 1 이상 입력해주세요' }))
      return
    }
    setTierError((p) => ({ ...p, [tier.id]: '' }))
    setTierSuccess((p) => ({ ...p, [tier.id]: '' }))
    setTierLoading((p) => ({ ...p, [tier.id]: true }))
    try {
      const res = await fetch(`/api/admin/prize-tiers/${tier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add_quantity: add }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTierError((p) => ({ ...p, [tier.id]: data.error ?? '수량 변경 실패' }))
        return
      }
      setTierSuccess((p) => ({
        ...p,
        [tier.id]: `+${add}개 추가 완료 (총 ${data.new_total}개 / 잔여 ${data.new_remaining}개)`,
      }))
      setAddQtyMap((p) => ({ ...p, [tier.id]: 0 }))
      router.refresh()
    } catch {
      setTierError((p) => ({ ...p, [tier.id]: '네트워크 오류' }))
    } finally {
      setTierLoading((p) => ({ ...p, [tier.id]: false }))
    }
  }

  async function toggleHistory(tierId: string) {
    const isOpen = historyOpen[tierId]
    setHistoryOpen((p) => ({ ...p, [tierId]: !isOpen }))
    if (!isOpen && !historyMap[tierId]) {
      setHistoryLoading((p) => ({ ...p, [tierId]: true }))
      try {
        const res = await fetch(`/api/admin/prize-tiers/${tierId}/history`)
        const data = await res.json()
        setHistoryMap((p) => ({ ...p, [tierId]: data.history ?? [] }))
      } catch {
        setHistoryMap((p) => ({ ...p, [tierId]: [] }))
      } finally {
        setHistoryLoading((p) => ({ ...p, [tierId]: false }))
      }
    }
  }

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

      {/* 경품 티어 */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-gray-900">경품 티어 현황</h2>
          {isActive && (
            <span className="text-xs text-green-600 font-medium">수량 추가 가능</span>
          )}
        </div>

        {/* 확률 고정 안내 */}
        <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4">
          확률은 이벤트 시작 시 고정되며, 수량 증가는 확률에 영향을 주지 않습니다.
          {!isActive && ' 수량 변경은 진행 중(active) 이벤트에서만 가능합니다.'}
        </p>

        <div className="space-y-3">
          {event.prize_tiers?.map((tier) => (
            <div key={tier.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              {/* 티어 기본 정보 */}
              <div className="flex items-center justify-between mb-3">
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
                  <p className="text-xs text-gray-400">잔여 {tier.remaining_quantity} / 총 {tier.total_quantity}개</p>
                </div>
              </div>

              {/* 수량 추가 입력 (active일 때만) */}
              {isActive && (
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 shrink-0">추가 수량</span>
                    <input
                      type="number"
                      min={1}
                      value={addQtyMap[tier.id] || ''}
                      onChange={(e) => setAddQtyMap((p) => ({
                        ...p,
                        [tier.id]: e.target.value ? Math.max(1, parseInt(e.target.value)) : 0,
                      }))}
                      placeholder="예: 50"
                      className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
                    />
                    <span className="text-xs text-gray-400">개</span>
                    <button
                      type="button"
                      onClick={() => handleAddQuantity(tier)}
                      disabled={tierLoading[tier.id] || !addQtyMap[tier.id]}
                      className="text-xs bg-orange-500 hover:bg-orange-400 text-white font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {tierLoading[tier.id] ? '처리 중...' : '추가'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleHistory(tier.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 ml-auto"
                    >
                      변경 이력 {historyOpen[tier.id] ? '▲' : '▼'}
                    </button>
                  </div>
                  {tierError[tier.id] && (
                    <p className="text-xs text-red-500 mt-1">{tierError[tier.id]}</p>
                  )}
                  {tierSuccess[tier.id] && (
                    <p className="text-xs text-green-600 mt-1">{tierSuccess[tier.id]}</p>
                  )}
                </div>
              )}

              {/* 변경 이력 (비active도 열람 가능) */}
              {!isActive && (
                <div className="border-t border-gray-100 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleHistory(tier.id)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    변경 이력 보기 {historyOpen[tier.id] ? '▲' : '▼'}
                  </button>
                </div>
              )}

              {/* 이력 목록 */}
              {historyOpen[tier.id] && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  {historyLoading[tier.id] ? (
                    <p className="text-xs text-gray-400">로딩 중...</p>
                  ) : (historyMap[tier.id]?.length ?? 0) === 0 ? (
                    <p className="text-xs text-gray-400">변경 이력이 없습니다</p>
                  ) : (
                    <div className="space-y-1.5">
                      {historyMap[tier.id].map((h) => (
                        <div key={h.id} className="flex items-center justify-between text-xs">
                          <div className="text-gray-500">
                            <span className="font-medium text-gray-700">{h.store_accounts?.email ?? '알 수 없음'}</span>
                            <span className="ml-2">{new Date(h.changed_at).toLocaleString('ko-KR')}</span>
                          </div>
                          <div className="text-gray-700 font-medium">
                            {h.previous_quantity}개 →{' '}
                            <span className="text-green-600">{h.new_quantity}개</span>
                            <span className="text-gray-400 ml-1">(+{h.new_quantity - h.previous_quantity})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 티어 변경 불가 안내 */}
        <p className="text-xs text-gray-400 mt-3">
          ※ 티어 삭제, 추가, 금액 변경은 지원되지 않습니다.
          이런 변경이 필요하면 이 이벤트를 종료하고 새 이벤트를 만들어주세요.
        </p>
      </div>
    </div>
  )
}
