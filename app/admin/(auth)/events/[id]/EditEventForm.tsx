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

/** 편집용 티어 상태. id가 null이면 아직 서버에 저장되지 않은 신규 티어 */
interface EditableTier extends Omit<PrizeTier, 'id'> {
  id: string | null
  /** React key + 로컬 상태 식별용. 기존 티어는 서버 id, 신규 티어는 임시 문자열 */
  tempKey: string
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

  // 경품 티어 편집 상태 (등급명 · 금액 · 총수량 수정 + 티어 추가/삭제)
  const [tiers, setTiers] = useState<EditableTier[]>(
    (event.prize_tiers ?? []).map((t) => ({ ...t, tempKey: t.id }))
  )
  const [deletedTierIds, setDeletedTierIds] = useState<string[]>([])
  const [tiersError, setTiersError] = useState('')
  const [tiersSuccess, setTiersSuccess] = useState('')
  const [tiersLoading, setTiersLoading] = useState(false)

  // 변경 이력
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryEntry[]>>({})
  const [historyOpen, setHistoryOpen] = useState<Record<string, boolean>>({})
  const [historyLoading, setHistoryLoading] = useState<Record<string, boolean>>({})

  function updateTierField(
    tempKey: string,
    field: 'label' | 'amount' | 'total_quantity' | 'requires_verification',
    value: string | number | boolean
  ) {
    setTiers((prev) => prev.map((t) => {
      if (t.tempKey !== tempKey) return t
      const next = { ...t, [field]: value }
      // 신규(미저장) 티어는 총수량을 바꾸면 잔여수량도 같이 맞춰서 "지급됨 0개" 상태를 유지
      if (field === 'total_quantity' && t.id === null) {
        next.remaining_quantity = Number(value) || 0
      }
      return next
    }))
  }

  function addTier() {
    setTiers((prev) => [
      ...prev,
      {
        tempKey: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        id: null,
        label: '',
        amount: 0,
        total_quantity: 0,
        remaining_quantity: 0,
        computed_probability: 0,
        requires_verification: false,
      },
    ])
    setTiersError('')
    setTiersSuccess('')
  }

  function removeTier(tempKey: string) {
    const tier = tiers.find((t) => t.tempKey === tempKey)
    if (!tier) return
    if (tiers.length <= 1) {
      setTiersError('경품 티어는 최소 1개 이상 있어야 합니다')
      return
    }
    if (tier.id) {
      const issued = tier.total_quantity - tier.remaining_quantity
      const msg = issued > 0
        ? `"${tier.label}" 티어는 이미 ${issued}개가 지급되었습니다.\n삭제해도 이미 지급된 쿠폰에는 영향이 없지만, 이 티어 설정과 수량 변경 이력은 함께 삭제됩니다.\n계속하시겠습니까?`
        : `"${tier.label}" 티어를 삭제하시겠습니까?`
      if (!confirm(msg)) return
      setDeletedTierIds((prev) => [...prev, tier.id as string])
    }
    setTiers((prev) => prev.filter((t) => t.tempKey !== tempKey))
    setTiersError('')
    setTiersSuccess('')
  }

  // 저장 전 확률 미리보기 (새 이벤트 등록과 동일한 공식: 하루 예상 참여자 수 × 노출 기간)
  const previewProbabilities = (() => {
    const days = startDate && endDate
      ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)
      : 0
    const totalParticipants = (Number(dailyParticipants) || 0) * days
    if (totalParticipants <= 0) return tiers.map(() => 0)
    const raw = tiers.map((t) => ((Number(t.total_quantity) || 0) / totalParticipants) * 100)
    const sum = raw.reduce((a, b) => a + b, 0)
    if (sum <= 0) return tiers.map(() => 0)
    return raw.map((p) => Math.round((p / sum) * 100 * 10) / 10)
  })()

  async function handleSaveTiers() {
    setTiersError('')
    setTiersSuccess('')

    for (const t of tiers) {
      if (!t.label.trim()) { setTiersError('모든 티어의 등급명을 입력해주세요'); return }
      if (Number(t.amount) < 0) { setTiersError('금액은 0 이상이어야 합니다 (꽝은 0)'); return }
      if (!t.total_quantity || Number(t.total_quantity) <= 0) { setTiersError('모든 티어의 총 수량을 1 이상 입력해주세요'); return }
    }

    setTiersLoading(true)
    try {
      const res = await fetch(`/api/admin/events/${event.id}/tiers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiers: tiers.map((t) => ({
            id: t.id ?? undefined,
            label: t.label,
            amount: Number(t.amount),
            total_quantity: Number(t.total_quantity),
            requires_verification: t.requires_verification,
          })),
          deleted_tier_ids: deletedTierIds,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setTiersError(data.error ?? '티어 저장 실패'); return }

      const results: Array<{ id: string; total_quantity: number; remaining_quantity: number; computed_probability: number }> = data.tiers ?? []
      setTiers((prev) => prev.map((t, i) => {
        const upd = results[i]
        return upd
          ? { ...t, id: upd.id, total_quantity: upd.total_quantity, remaining_quantity: upd.remaining_quantity, computed_probability: upd.computed_probability }
          : t
      }))
      setDeletedTierIds([])
      setTiersSuccess('경품 티어가 저장되었습니다. 확률이 자동으로 재계산되었습니다.')
      router.refresh()
    } catch {
      setTiersError('네트워크 오류가 발생했습니다')
    } finally {
      setTiersLoading(false)
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
        <h2 className="text-sm font-bold text-gray-900 mb-1">경품 티어 관리</h2>

        {/* 안내 */}
        <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4">
          등급명 · 금액 · 총 수량을 자유롭게 수정할 수 있고, 티어를 추가하거나 삭제할 수도 있습니다.
          저장하면 위 &quot;하루 예상 참여자 수&quot;와 노출 기간을 기준으로 확률이 자동 재계산됩니다.
          기존 티어의 총 수량은 이미 지급된 개수보다 적게 설정할 수 없습니다.
        </p>

        {tiersError && <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{tiersError}</div>}
        {tiersSuccess && <div className="mb-3 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{tiersSuccess}</div>}

        <div className="space-y-3">
          {tiers.map((tier, i) => {
            const issued = tier.total_quantity - tier.remaining_quantity
            const isNew = tier.id === null
            return (
              <div key={tier.tempKey} className={`bg-white rounded-xl border px-5 py-4 ${isNew ? 'border-orange-300 border-dashed' : 'border-gray-200'}`}>
                {/* 등급명 / 금액 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isNew && <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">신규</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTier(tier.tempKey)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium"
                  >
                    이 티어 삭제
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">등급명</label>
                    <input value={tier.label} onChange={(e) => updateTierField(tier.tempKey, 'label', e.target.value)}
                      placeholder="예: 꽝 / 1,000원 쿠폰"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">금액 (꽝=0)</label>
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} value={tier.amount}
                        onChange={(e) => updateTierField(tier.tempKey, 'amount', e.target.value ? Number(e.target.value) : 0)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
                      <span className="text-xs text-gray-400">원</span>
                    </div>
                  </div>
                </div>

                {/* 총 수량 / 확률 미리보기 */}
                <div className="flex items-end gap-3 mb-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">총 수량</label>
                    <div className="flex items-center gap-1">
                      <input type="number" min={Math.max(1, issued)} value={tier.total_quantity}
                        onChange={(e) => updateTierField(tier.tempKey, 'total_quantity', e.target.value ? Number(e.target.value) : 0)}
                        placeholder="100"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
                      <span className="text-xs text-gray-400">개</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {isNew ? '저장하면 등록됩니다' : `지급됨 ${issued}개 · 잔여 ${tier.remaining_quantity}개`}
                    </p>
                  </div>
                  <div className="shrink-0 text-center">
                    <p className="text-xs text-gray-400 mb-1">저장 시 확률</p>
                    <p className={`text-lg font-black ${previewProbabilities[i] > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                      {previewProbabilities[i].toFixed(1)}%
                    </p>
                    {!isNew && <p className="text-xs text-gray-300">현재 {tier.computed_probability.toFixed(1)}%</p>}
                  </div>
                </div>

                {/* 직원 확인 필요 */}
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={tier.requires_verification}
                    onChange={(e) => updateTierField(tier.tempKey, 'requires_verification', e.target.checked)}
                    className="h-4 w-4 accent-orange-500 cursor-pointer" />
                  <span className="text-xs text-gray-600">고액 경품 — 직원 확인 필요</span>
                </label>

                {/* 변경 이력 (저장된 티어만) */}
                {!isNew && (
                  <>
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        type="button"
                        onClick={() => toggleHistory(tier.id as string)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        변경 이력 {historyOpen[tier.id as string] ? '▲' : '▼'}
                      </button>
                    </div>

                    {historyOpen[tier.id as string] && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        {historyLoading[tier.id as string] ? (
                          <p className="text-xs text-gray-400">로딩 중...</p>
                        ) : (historyMap[tier.id as string]?.length ?? 0) === 0 ? (
                          <p className="text-xs text-gray-400">변경 이력이 없습니다</p>
                        ) : (
                          <div className="space-y-1.5">
                            {historyMap[tier.id as string].map((h) => {
                              const delta = h.new_quantity - h.previous_quantity
                              return (
                                <div key={h.id} className="flex items-center justify-between text-xs">
                                  <div className="text-gray-500">
                                    <span className="font-medium text-gray-700">{h.store_accounts?.email ?? '알 수 없음'}</span>
                                    <span className="ml-2">{new Date(h.changed_at).toLocaleString('ko-KR')}</span>
                                  </div>
                                  <div className="text-gray-700 font-medium">
                                    {h.previous_quantity}개 →{' '}
                                    <span className={delta >= 0 ? 'text-green-600' : 'text-red-500'}>{h.new_quantity}개</span>
                                    <span className="text-gray-400 ml-1">({delta >= 0 ? '+' : ''}{delta})</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={addTier}
          className="mt-3 w-full border-2 border-dashed border-gray-300 hover:border-orange-400 text-gray-400 hover:text-orange-500 rounded-lg py-2.5 text-sm font-medium transition-colors"
        >
          + 티어 추가
        </button>

        <button
          type="button"
          onClick={handleSaveTiers}
          disabled={tiersLoading}
          className="mt-3 w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-40"
        >
          {tiersLoading ? '저장 중...' : '경품 티어 저장'}
        </button>
      </div>
    </div>
  )
}
