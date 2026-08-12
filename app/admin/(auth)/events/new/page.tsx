'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Tier {
  label: string
  amount: number | ''
  total_quantity: number | ''
  requires_verification: boolean
}

const DEFAULT_TIER: Tier = { label: '', amount: '', total_quantity: '', requires_verification: false }

/** 확률 계산 (클라이언트 실시간용) */
function calcProbabilities(tiers: Tier[], dailyParticipants: number, startDate: string, endDate: string): number[] {
  if (!startDate || !endDate || dailyParticipants <= 0) return tiers.map(() => 0)
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
  const totalParticipants = dailyParticipants * days
  if (totalParticipants <= 0) return tiers.map(() => 0)

  const raw = tiers.map((t) => {
    const qty = Number(t.total_quantity) || 0
    return (qty / totalParticipants) * 100
  })
  const sum = raw.reduce((a, b) => a + b, 0)
  if (sum <= 0) return tiers.map(() => 0)
  return raw.map((p) => Math.round((p / sum) * 100 * 10) / 10)
}

export default function NewEventPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dailyParticipants, setDailyParticipants] = useState<number | ''>('')
  const [validityType, setValidityType] = useState<'relative_days' | 'fixed_date'>('relative_days')
  const [validityValue, setValidityValue] = useState('14')
  const [fixedValidityStart, setFixedValidityStart] = useState('')
  const [fixedValidityEnd, setFixedValidityEnd] = useState('')
  const [tiers, setTiers] = useState<Tier[]>([
    { label: '꽝', amount: 0, total_quantity: '', requires_verification: false },
    { label: '1,000원 쿠폰', amount: 1000, total_quantity: '', requires_verification: false },
    { label: '10,000원 쿠폰', amount: 10000, total_quantity: '', requires_verification: true },
  ])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const probabilities = useMemo(
    () => calcProbabilities(tiers, Number(dailyParticipants) || 0, startDate, endDate),
    [tiers, dailyParticipants, startDate, endDate]
  )

  const totalProb = probabilities.reduce((a, b) => a + b, 0)
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime()
    return Math.max(0, Math.round(diff / 86400000) + 1)
  }, [startDate, endDate])

  function updateTier(i: number, field: keyof Tier, value: unknown) {
    setTiers((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t))
  }

  function addTier() { setTiers((prev) => [...prev, { ...DEFAULT_TIER }]) }
  function removeTier(i: number) { setTiers((prev) => prev.filter((_, idx) => idx !== i)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('이벤트명을 입력해주세요'); return }
    if (!startDate || !endDate) { setError('노출 기간을 설정해주세요'); return }
    if (new Date(endDate) < new Date(startDate)) { setError('종료일이 시작일보다 빠릅니다'); return }
    if (!dailyParticipants || Number(dailyParticipants) <= 0) { setError('예상 참여자 수를 입력해주세요'); return }
    if (validityType === 'relative_days' && (!validityValue || Number(validityValue) <= 0)) {
      setError('쿠폰 사용 기간(일 수)을 입력해주세요'); return
    }
    if (validityType === 'fixed_date') {
      if (!fixedValidityStart || !fixedValidityEnd) { setError('쿠폰 사용 기간의 시작일과 종료일을 모두 선택해주세요'); return }
      if (new Date(fixedValidityEnd) < new Date(fixedValidityStart)) { setError('쿠폰 사용 종료일이 시작일보다 빠릅니다'); return }
    }
    if (tiers.length === 0) { setError('경품 티어를 1개 이상 추가해주세요'); return }
    for (const t of tiers) {
      if (!t.label.trim()) { setError('모든 티어의 등급명을 입력해주세요'); return }
      if (t.amount === '' || Number(t.amount) < 0) { setError('금액을 올바르게 입력해주세요 (꽝은 0)'); return }
      if (!t.total_quantity || Number(t.total_quantity) <= 0) { setError('모든 티어의 수량을 입력해주세요'); return }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          display_start_date: startDate,
          display_end_date: endDate,
          expected_daily_participants: Number(dailyParticipants),
          coupon_validity_type: validityType,
          coupon_validity_value: validityType === 'fixed_date'
            ? `${fixedValidityStart}~${fixedValidityEnd}`
            : validityValue,
          tiers: tiers.map((t) => ({
            label: t.label,
            amount: Number(t.amount),
            total_quantity: Number(t.total_quantity),
            requires_verification: t.requires_verification,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '저장에 실패했습니다'); return }
      router.push('/admin/events')
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">새 이벤트 등록</h1>
        <p className="text-sm text-gray-500 mt-1">등록하면 손님 게임 화면에 바로 반영됩니다</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        {/* 이벤트명 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-bold text-gray-900 mb-2">이벤트명</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 8월 여름맞이 당근뽑기 이벤트"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* 노출 기간 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-bold text-gray-900 mb-3">이벤트 노출 기간</label>
          <div className="flex gap-3 items-center">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500" />
            <span className="text-gray-400 shrink-0">~</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500" />
          </div>
          {durationDays > 0 && (
            <p className="text-xs text-gray-400 mt-2">총 {durationDays}일 진행</p>
          )}
        </div>

        {/* 예상 참여자 수 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-bold text-gray-900 mb-1">하루 예상 참여자 수</label>
          <p className="text-xs text-gray-400 mb-3">경품 확률 자동 계산에 사용됩니다. 매장 평균 일 방문객 수를 입력하세요.</p>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1} value={dailyParticipants}
              onChange={(e) => setDailyParticipants(e.target.value ? Number(e.target.value) : '')}
              placeholder="예: 50"
              className="w-40 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
            />
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
              <input type="number" min={1} value={validityValue} onChange={(e) => setValidityValue(e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-orange-500" />
              <span className="text-gray-500 text-sm">일 이내 사용 가능</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">쿠폰 사용 시작일</label>
                  <input
                    type="date"
                    value={fixedValidityStart}
                    onChange={(e) => setFixedValidityStart(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <span className="text-gray-400 mt-5 shrink-0">~</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">쿠폰 사용 종료일</label>
                  <input
                    type="date"
                    value={fixedValidityEnd}
                    min={fixedValidityStart}
                    onChange={(e) => setFixedValidityEnd(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              {fixedValidityStart && fixedValidityEnd && (
                <p className="text-xs text-orange-500">
                  {fixedValidityStart} ~ {fixedValidityEnd} 기간에만 쿠폰 사용 가능
                </p>
              )}
            </div>
          )}
        </div>

        {/* 경품 티어 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-bold text-gray-900">경품 티어</label>
            <span className={`text-xs font-bold ${Math.abs(totalProb - 100) < 0.5 ? 'text-green-600' : 'text-orange-500'}`}>
              합계: {totalProb.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">수량을 입력하면 확률이 자동으로 계산됩니다 (합계 100% 자동 보장)</p>

          <div className="space-y-3">
            {tiers.map((tier, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">등급명</label>
                    <input value={tier.label} onChange={(e) => updateTier(i, 'label', e.target.value)}
                      placeholder="예: 꽝 / 1,000원 쿠폰"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">금액 (꽝=0)</label>
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} value={tier.amount} onChange={(e) => updateTier(i, 'amount', e.target.value ? Number(e.target.value) : '')}
                        placeholder="0"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-500" />
                      <span className="text-xs text-gray-400">원</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">총 준비 수량</label>
                    <div className="flex items-center gap-1">
                      <input type="number" min={1} value={tier.total_quantity} onChange={(e) => updateTier(i, 'total_quantity', e.target.value ? Number(e.target.value) : '')}
                        placeholder="100"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-500" />
                      <span className="text-xs text-gray-400">개</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-center">
                    <p className="text-xs text-gray-400 mb-1">확률</p>
                    <p className={`text-lg font-black ${probabilities[i] > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                      {probabilities[i].toFixed(1)}%
                    </p>
                  </div>

                  <div className="shrink-0">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={tier.requires_verification} onChange={(e) => updateTier(i, 'requires_verification', e.target.checked)}
                        className="accent-orange-500 w-4 h-4" />
                      <span className="text-xs text-gray-600">직원 확인 필요</span>
                    </label>
                    <p className="text-xs text-gray-400 mt-0.5">(1만원 이상 권장)</p>
                  </div>
                </div>

                {tiers.length > 1 && (
                  <button type="button" onClick={() => removeTier(i)}
                    className="mt-2 text-xs text-red-400 hover:text-red-600">
                    이 티어 삭제
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="button" onClick={addTier}
            className="mt-3 w-full border-2 border-dashed border-gray-300 hover:border-orange-400 text-gray-400 hover:text-orange-500 rounded-lg py-2.5 text-sm font-medium transition-colors">
            + 티어 추가
          </button>
        </div>

        {/* 저장 */}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg text-base transition-colors">
            취소
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-lg text-base transition-colors disabled:opacity-40">
            {loading ? '저장 중...' : '이벤트 등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
