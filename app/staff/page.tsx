'use client'

import { useState } from 'react'

interface CouponData {
  id: string
  amount: number
  status: 'issued' | 'pending_verify' | 'used' | 'expired' | 'unverified'
  requires_verification: boolean
  issued_at: string
  valid_until: string
  unverified_reason: string | null
}

const STATUS_LABEL: Record<CouponData['status'], string> = {
  issued: '발급됨 (사용 가능)',
  pending_verify: '인증 대기중',
  used: '사용 완료',
  expired: '기간 만료',
  unverified: '미확인 처리됨 (재시도 가능)',
}

const REASONS = ['앱없음', '거부', '기타'] as const

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function StaffPage() {
  const [code, setCode] = useState('')
  const [coupon, setCoupon] = useState<CouponData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReasonPicker, setShowReasonPicker] = useState(false)
  const [selectedReason, setSelectedReason] = useState<string>('')

  const isExpired = coupon ? new Date(coupon.valid_until) < new Date() : false

  async function lookup(target: string) {
    const res = await fetch(`/api/coupons/lookup?code=${encodeURIComponent(target)}`)
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '조회에 실패했습니다')
      setCoupon(null)
      return
    }
    setError('')
    setCoupon(data.coupon)
  }

  async function handleLookup() {
    const target = code.trim()
    if (!target) return
    setLoading(true)
    setShowReasonPicker(false)
    setSelectedReason('')
    try {
      await lookup(target)
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  async function handleUse() {
    if (!coupon) return
    setLoading(true)
    try {
      const res = await fetch('/api/coupons/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_id: coupon.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '처리에 실패했습니다')
        return
      }
      await lookup(coupon.id)
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(action: 'confirm' | 'unverified', reason?: string) {
    if (!coupon) return
    setLoading(true)
    try {
      const res = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_id: coupon.id, action, reason }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '처리에 실패했습니다')
        return
      }
      setShowReasonPicker(false)
      setSelectedReason('')
      await lookup(coupon.id)
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">쿠폰 검증 (계산대용)</h1>

        <div className="flex gap-2 mb-5">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLookup()
            }}
            placeholder="쿠폰 코드 입력"
            className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg text-gray-900 focus:border-orange-500 focus:outline-none"
          />
          <button
            onClick={handleLookup}
            disabled={loading}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg text-lg font-bold disabled:opacity-40"
          >
            조회
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-base font-semibold">
            {error}
          </div>
        )}

        {coupon && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
            <div className="grid grid-cols-2 gap-y-3 text-base mb-5">
              <span className="text-gray-500">당첨 금액</span>
              <span className="font-bold text-gray-900 text-right">{coupon.amount.toLocaleString()}원</span>

              <span className="text-gray-500">발급일시</span>
              <span className="text-gray-900 text-right">{formatDateTime(coupon.issued_at)}</span>

              <span className="text-gray-500">사용가능기간</span>
              <span className="text-gray-900 text-right">
                {formatDate(coupon.issued_at)} ~ {formatDate(coupon.valid_until)}
              </span>

              <span className="text-gray-500">현재 상태</span>
              <span className="font-bold text-gray-900 text-right">
                {isExpired ? STATUS_LABEL.expired : STATUS_LABEL[coupon.status]}
              </span>
            </div>

            {isExpired ? (
              <div className="bg-gray-100 text-gray-700 rounded-lg px-4 py-4 text-center text-lg font-bold">
                사용기간이 지난 쿠폰입니다
              </div>
            ) : coupon.status === 'used' ? (
              <div className="bg-gray-100 text-gray-700 rounded-lg px-4 py-4 text-center text-lg font-bold">
                이미 사용된 쿠폰입니다
              </div>
            ) : coupon.status === 'issued' ? (
              <button
                onClick={handleUse}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 text-white py-4 rounded-lg text-lg font-bold disabled:opacity-40"
              >
                사용 처리
              </button>
            ) : coupon.status === 'pending_verify' || coupon.status === 'unverified' ? (
              !showReasonPicker ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerify('confirm')}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-lg text-lg font-bold disabled:opacity-40"
                  >
                    확인함
                  </button>
                  <button
                    onClick={() => setShowReasonPicker(true)}
                    disabled={loading}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-4 rounded-lg text-lg font-bold disabled:opacity-40"
                  >
                    미확인 처리
                  </button>
                </div>
              ) : (
                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 font-bold mb-3">미확인 사유 선택</p>
                  <div className="flex gap-2 mb-4">
                    {REASONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setSelectedReason(r)}
                        className={`flex-1 py-3 rounded-lg text-base font-bold border-2 ${
                          selectedReason === r
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowReasonPicker(false)
                        setSelectedReason('')
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-bold"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => selectedReason && handleVerify('unverified', selectedReason)}
                      disabled={!selectedReason || loading}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold disabled:opacity-40"
                    >
                      미확인 확정
                    </button>
                  </div>
                </div>
              )
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
