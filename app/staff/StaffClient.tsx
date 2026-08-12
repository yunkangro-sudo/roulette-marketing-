'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CouponData {
  id: string
  short_code: string
  store_id: string
  kakao_user_id: string
  amount: number
  status: 'issued' | 'pending_verify' | 'used' | 'expired' | 'unverified'
  requires_verification: boolean
  issued_at: string
  valid_until: string
  unverified_reason: string | null
}

interface RewardIssuedData {
  id: string
  short_code: string
  store_id: string
  kakao_user_id: string
  status: 'issued' | 'used' | 'expired'
  issued_at: string
  used_at: string | null
  reward_catalog: { name: string; point_cost: number }
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

type PendingAction = 'use' | 'verify-confirm'
type StaffTab = 'coupon' | 'reward'

interface Props { storeId: string; role: string }

export default function StaffClient({ storeId, role }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<StaffTab>('coupon')

  // 쿠폰 탭
  const [code, setCode] = useState('')
  const [coupon, setCoupon] = useState<CouponData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReasonPicker, setShowReasonPicker] = useState(false)
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [paymentAmountInput, setPaymentAmountInput] = useState('')

  // 리워드 탭
  const [rewardCode, setRewardCode] = useState('')
  const [rewardData, setRewardData] = useState<RewardIssuedData | null>(null)
  const [rewardError, setRewardError] = useState('')
  const [rewardLoading, setRewardLoading] = useState(false)
  const [rewardSuccess, setRewardSuccess] = useState('')

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  // ── 쿠폰 조회 (short_code 기반) ───────────────────────────
  async function lookupCoupon(target: string) {
    const res = await fetch(`/api/coupons/lookup?code=${encodeURIComponent(target)}&store_id=${encodeURIComponent(storeId)}`)
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
    setPendingAction(null)
    setPaymentAmountInput('')
    try { await lookupCoupon(target) }
    catch { setError('네트워크 오류가 발생했습니다') }
    finally { setLoading(false) }
  }

  function requestPaymentInput(action: PendingAction) {
    setPaymentAmountInput('')
    setPendingAction(action)
  }

  async function confirmAction(skipPayment = false) {
    if (!coupon || !pendingAction) return
    setLoading(true)
    try {
      const amountNum = parseInt(paymentAmountInput.replace(/,/g, ''), 10)
      if (!skipPayment && !isNaN(amountNum) && amountNum > 0) {
        await fetch('/api/payments/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coupon_id: coupon.id, store_id: coupon.store_id, kakao_user_id: coupon.kakao_user_id, amount: amountNum }),
        })
      }

      if (pendingAction === 'use') {
        const res = await fetch('/api/coupons/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coupon_id: coupon.id }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? '처리에 실패했습니다'); return }
      } else if (pendingAction === 'verify-confirm') {
        const res = await fetch('/api/coupons/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coupon_id: coupon.id, action: 'confirm' }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? '처리에 실패했습니다'); return }
      }

      setPendingAction(null)
      setPaymentAmountInput('')
      await lookupCoupon(coupon.id)
    } catch { setError('네트워크 오류가 발생했습니다') }
    finally { setLoading(false) }
  }

  async function handleVerifyUnverified(reason: string) {
    if (!coupon) return
    setLoading(true)
    try {
      const res = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_id: coupon.id, action: 'unverified', reason }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '처리에 실패했습니다'); return }
      setShowReasonPicker(false)
      setSelectedReason('')
      await lookupCoupon(coupon.id)
    } catch { setError('네트워크 오류가 발생했습니다') }
    finally { setLoading(false) }
  }

  // ── 리워드 조회 (short_code 기반) ─────────────────────────
  async function handleRewardLookup() {
    const target = rewardCode.trim()
    if (!target) return
    setRewardLoading(true)
    setRewardError('')
    setRewardSuccess('')
    setRewardData(null)
    try {
      const res = await fetch(`/api/rewards/lookup?code=${encodeURIComponent(target)}&store_id=${encodeURIComponent(storeId)}`)
      const data = await res.json()
      if (!res.ok) setRewardError(data.error ?? '조회에 실패했습니다')
      else setRewardData(data.reward)
    } catch { setRewardError('네트워크 오류가 발생했습니다') }
    finally { setRewardLoading(false) }
  }

  async function handleRewardUse() {
    if (!rewardData) return
    setRewardLoading(true)
    setRewardError('')
    try {
      const res = await fetch('/api/rewards/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_issued_id: rewardData.id }),
      })
      const data = await res.json()
      if (!res.ok) setRewardError(data.error ?? '처리 실패')
      else { setRewardSuccess('✅ 리워드 사용 처리 완료!'); setRewardData({ ...rewardData, status: 'used' }) }
    } catch { setRewardError('네트워크 오류가 발생했습니다') }
    finally { setRewardLoading(false) }
  }

  // ── 결제금액 입력 단계 ─────────────────────────────────────
  if (pendingAction) {
    return (
      <div className="min-h-screen bg-gray-100 px-4 py-10">
        <div className="max-w-lg mx-auto">
          <div className="bg-white border-2 border-orange-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">이번 방문 결제금액</h2>
            <p className="text-sm text-gray-500 mb-6">선택 입력 — 미입력 시 쿠폰 처리만 진행합니다</p>
            <div className="flex gap-2 mb-2">
              <input type="number" inputMode="numeric" value={paymentAmountInput}
                onChange={(e) => setPaymentAmountInput(e.target.value)} placeholder="예) 25000"
                className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-xl font-bold text-gray-900 focus:border-orange-500 focus:outline-none" />
              <span className="flex items-center text-xl text-gray-500 font-bold">원</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">실측치로 기록되어 성과 리포트에 반영됩니다</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => confirmAction(false)} disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 text-white py-4 rounded-lg text-lg font-bold disabled:opacity-40 transition-colors">
                {paymentAmountInput ? `${parseInt(paymentAmountInput || '0').toLocaleString()}원 기록 후 쿠폰 처리` : '금액 없이 쿠폰 처리'}
              </button>
              <button onClick={() => confirmAction(true)} disabled={loading}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg text-base font-bold disabled:opacity-40 transition-colors">
                건너뛰기 (기록 안 함)
              </button>
              <button onClick={() => setPendingAction(null)} disabled={loading}
                className="text-center text-sm text-gray-400 hover:text-gray-600 py-2">
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const Header = () => (
    <div className="flex items-center justify-between mb-2">
      <h1 className="text-2xl font-bold text-gray-900">계산대</h1>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">{storeId}</span>
        <button onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
          로그아웃
        </button>
      </div>
    </div>
  )

  // ── 리워드 탭 ─────────────────────────────────────────────
  if (tab === 'reward') {
    return (
      <div className="min-h-screen bg-gray-100 px-4 py-10">
        <div className="max-w-lg mx-auto">
          <Header />
          <div className="flex gap-2 mb-6">
            <button onClick={() => setTab('coupon')} className="flex-1 py-2 rounded-lg text-sm font-bold bg-white border border-gray-300 text-gray-600 hover:bg-gray-50">쿠폰 코드</button>
            <button className="flex-1 py-2 rounded-lg text-sm font-bold bg-gray-900 text-white">리워드 코드</button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4 text-xs text-blue-700">
            손님 앱에 표시된 <strong>8자리 코드</strong>를 입력하세요 (예: AB3K7PQR)
          </div>

          <div className="flex gap-2 mb-5">
            <input value={rewardCode} onChange={(e) => setRewardCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRewardLookup() }}
              placeholder="8자리 리워드 코드" maxLength={8}
              className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg text-gray-900 font-mono tracking-widest focus:border-orange-500 focus:outline-none" />
            <button onClick={handleRewardLookup} disabled={rewardLoading}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg text-lg font-bold disabled:opacity-40">조회</button>
          </div>

          {rewardError && <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-base font-semibold">{rewardError}</div>}
          {rewardSuccess && <div className="bg-green-50 border-2 border-green-200 text-green-700 rounded-lg px-4 py-3 mb-5 text-base font-semibold">{rewardSuccess}</div>}

          {rewardData && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
              <div className="grid grid-cols-2 gap-y-3 text-base mb-5">
                <span className="text-gray-500">리워드명</span>
                <span className="font-bold text-gray-900 text-right">{rewardData.reward_catalog.name}</span>
                <span className="text-gray-500">사용 포인트</span>
                <span className="font-bold text-orange-500 text-right">{rewardData.reward_catalog.point_cost}P</span>
                <span className="text-gray-500">발급일시</span>
                <span className="text-gray-900 text-right">{formatDateTime(rewardData.issued_at)}</span>
                <span className="text-gray-500">현재 상태</span>
                <span className={`font-bold text-right ${rewardData.status === 'issued' ? 'text-green-600' : rewardData.status === 'used' ? 'text-gray-400' : 'text-red-500'}`}>
                  {rewardData.status === 'issued' ? '사용 가능' : rewardData.status === 'used' ? '사용 완료' : '만료'}
                </span>
              </div>

              {rewardData.status === 'issued' ? (
                <button onClick={handleRewardUse} disabled={rewardLoading}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-white py-4 rounded-lg text-lg font-bold disabled:opacity-40 transition-colors">
                  리워드 사용 처리
                </button>
              ) : (
                <div className="bg-gray-100 text-gray-600 rounded-lg px-4 py-4 text-center text-lg font-bold">
                  {rewardData.status === 'used' ? '이미 사용된 리워드입니다' : '만료된 리워드입니다'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── 쿠폰 탭 ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <Header />
        <div className="flex gap-2 mb-6">
          <button className="flex-1 py-2 rounded-lg text-sm font-bold bg-gray-900 text-white">쿠폰 코드</button>
          <button onClick={() => setTab('reward')} className="flex-1 py-2 rounded-lg text-sm font-bold bg-white border border-gray-300 text-gray-600 hover:bg-gray-50">리워드 코드</button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4 text-xs text-blue-700">
          손님 앱에 표시된 <strong>8자리 코드</strong>를 입력하세요 (예: AB3K7PQR)
        </div>

        <div className="flex gap-2 mb-5">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLookup() }}
            placeholder="8자리 쿠폰 코드" maxLength={8}
            className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg text-gray-900 font-mono tracking-widest focus:border-orange-500 focus:outline-none" />
          <button onClick={handleLookup} disabled={loading}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg text-lg font-bold disabled:opacity-40">조회</button>
        </div>

        {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-base font-semibold">{error}</div>}

        {coupon && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
            <div className="grid grid-cols-2 gap-y-3 text-base mb-5">
              <span className="text-gray-500">당첨 금액</span>
              <span className="font-bold text-gray-900 text-right">{coupon.amount.toLocaleString()}원</span>
              <span className="text-gray-500">발급일시</span>
              <span className="text-gray-900 text-right">{formatDateTime(coupon.issued_at)}</span>
              <span className="text-gray-500">사용가능기간</span>
              <span className="text-gray-900 text-right">{formatDate(coupon.issued_at)} ~ {formatDate(coupon.valid_until)}</span>
              <span className="text-gray-500">현재 상태</span>
              <span className="font-bold text-gray-900 text-right">{STATUS_LABEL[coupon.status]}</span>
            </div>

            {coupon.status === 'expired' ? (
              <div className="bg-gray-100 text-gray-700 rounded-lg px-4 py-4 text-center text-lg font-bold">사용기간이 지난 쿠폰입니다</div>
            ) : coupon.status === 'used' ? (
              <div className="bg-gray-100 text-gray-700 rounded-lg px-4 py-4 text-center text-lg font-bold">이미 사용된 쿠폰입니다</div>
            ) : coupon.status === 'issued' ? (
              <button onClick={() => requestPaymentInput('use')} disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 text-white py-4 rounded-lg text-lg font-bold disabled:opacity-40">
                사용 처리
              </button>
            ) : (coupon.status === 'pending_verify' || coupon.status === 'unverified') ? (
              !showReasonPicker ? (
                <div className="flex gap-3">
                  <button onClick={() => requestPaymentInput('verify-confirm')} disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-lg text-lg font-bold disabled:opacity-40">
                    확인함
                  </button>
                  <button onClick={() => setShowReasonPicker(true)} disabled={loading}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-4 rounded-lg text-lg font-bold disabled:opacity-40">
                    미확인 처리
                  </button>
                </div>
              ) : (
                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 font-bold mb-3">미확인 사유 선택</p>
                  <div className="flex gap-2 mb-4">
                    {REASONS.map((r) => (
                      <button key={r} onClick={() => setSelectedReason(r)}
                        className={`flex-1 py-3 rounded-lg text-base font-bold border-2 ${
                          selectedReason === r ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'
                        }`}>{r}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowReasonPicker(false); setSelectedReason('') }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-bold">취소</button>
                    <button onClick={() => selectedReason && handleVerifyUnverified(selectedReason)}
                      disabled={!selectedReason || loading}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold disabled:opacity-40">미확인 확정</button>
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
