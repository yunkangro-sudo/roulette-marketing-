'use client'

import { useState } from 'react'
import StoreSelector from '../../components/StoreSelector'

interface IssuedCoupon {
  shortCode: string
  amount: number
  validUntil: string
}

interface Props {
  role: string
  storeId: string | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 오늘부터 n일 뒤 날짜를 YYYY-MM-DD 형식으로 반환 */
function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function CouponIssueClient({ role, storeId }: Props) {
  const [selectedStore, setSelectedStore] = useState(storeId ?? '')
  const [amount, setAmount] = useState('')
  const [validUntil, setValidUntil] = useState(daysFromNow(30))
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [issued, setIssued] = useState<IssuedCoupon | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedStore) { setError('매장을 먼저 선택해주세요'); return }
    if (!amount || Number(amount) <= 0) { setError('쿠폰 금액을 입력해주세요'); return }
    if (!validUntil) { setError('사용 기한을 선택해주세요'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupons/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: selectedStore,
          amount: Number(amount),
          valid_until: validUntil,
          customer_memo: memo,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '발급 실패'); return }
      setIssued(data.coupon)
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleReset() {
    setIssued(null)
    setAmount('')
    setMemo('')
    setValidUntil(daysFromNow(30))
    setCopied(false)
    setError('')
  }

  // ── 발급 완료 화면 ──────────────────────────────────────────────
  if (issued) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* 상단 녹색 배너 */}
          <div className="bg-green-500 px-6 py-5 text-center">
            <p className="text-white/80 text-sm mb-1">✅ 쿠폰 발급 완료</p>
            <p className="text-white text-sm">손님에게 아래 코드를 직접 전달하세요</p>
          </div>

          {/* 코드 카드 */}
          <div className="px-6 py-8 text-center">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">인증 코드</p>
            <p className="font-mono font-black text-6xl text-gray-900 tracking-[0.15em] mb-6">
              {issued.shortCode}
            </p>

            <div className="flex gap-3 justify-center mb-6">
              <button
                onClick={() => handleCopy(issued.shortCode)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                {copied ? '✓ 복사됨' : '코드 복사'}
              </button>
              <button
                onClick={() => handleCopy(
                  `쿠폰 코드: ${issued.shortCode}\n금액: ${Number(issued.amount).toLocaleString()}원\n사용기한: ~${formatDate(issued.validUntil)}`
                )}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                전체 정보 복사
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm text-gray-700 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">금액</span>
                <span className="font-bold">{Number(issued.amount).toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">사용기한</span>
                <span className="font-semibold">~{formatDate(issued.validUntil)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">발급 방식</span>
                <span className="text-orange-600 font-medium">수동 발급</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-left">
              💡 손님에게 코드를 문자/카톡으로 전달하거나 직접 알려주세요.<br />
              손님은 계산대에서 직원에게 이 코드를 보여주면 사용 가능합니다.
            </p>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={handleReset}
              className="w-full border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 rounded-xl transition-colors"
            >
              + 쿠폰 추가 발급
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 발급 폼 ────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">수동 쿠폰 발급</h1>
        <p className="text-sm text-gray-500 mt-1">
          발급된 6자리 코드를 손님에게 직접 전달하세요. 손님은 계산대에서 코드를 제시하면 됩니다.
        </p>
      </div>

      {/* 매장 선택 */}
      <div className="mb-4">
        <StoreSelector
          role={role}
          sessionStoreId={storeId}
          selectedStoreId={selectedStore}
          onSelect={setSelectedStore}
        />
      </div>

      {/* 발급 폼 */}
      <form onSubmit={handleIssue} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        {/* 쿠폰 금액 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            쿠폰 금액 (원) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="예) 5000"
              min={1}
              required
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-lg font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <span className="text-gray-500 font-medium">원</span>
          </div>
          {/* 빠른 금액 버튼 */}
          <div className="flex gap-2 mt-2">
            {[1000, 3000, 5000, 10000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(v))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  amount === String(v)
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300'
                }`}
              >
                {(v / 1000).toLocaleString()}천원
              </button>
            ))}
          </div>
        </div>

        {/* 사용 기한 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            사용 기한 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            min={daysFromNow(1)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          {/* 빠른 기간 버튼 */}
          <div className="flex gap-2 mt-2">
            {[7, 14, 30, 90].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setValidUntil(daysFromNow(days))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  validUntil === daysFromNow(days)
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300'
                }`}
              >
                {days}일
              </button>
            ))}
          </div>
        </div>

        {/* 메모 (선택) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            손님 메모 <span className="text-gray-400 font-normal">(선택, 내부 참고용)</span>
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예) 김철수 010-1234-5678"
            maxLength={100}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          <p className="text-xs text-gray-400 mt-1">DB에 저장되지 않습니다. 화면에서만 참고하세요.</p>
        </div>

        <button
          type="submit"
          disabled={loading || !selectedStore}
          className="w-full bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-bold py-4 rounded-xl text-base transition-colors disabled:opacity-40 mt-2"
        >
          {loading ? '발급 중...' : '쿠폰 발급하기'}
        </button>
      </form>

      {/* 안내 박스 */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 수동 쿠폰 발급 안내</p>
        <ul className="space-y-1 text-blue-700 text-xs list-disc list-inside">
          <li>게임 없이 즉시 쿠폰 발급 → 6자리 코드 생성</li>
          <li>코드를 손님에게 문자/카톡/구두로 전달</li>
          <li>손님이 계산대에서 코드를 제시하면 사용 처리</li>
          <li>카카오 연동 후에는 알림톡으로 자동 전송 예정</li>
        </ul>
      </div>
    </div>
  )
}
