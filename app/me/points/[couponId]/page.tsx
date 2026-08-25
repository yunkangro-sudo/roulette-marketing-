'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import CouponTicket from '@/components/game/CouponTicket'

interface CouponDetail {
  id: string
  storeId: string
  storeName: string
  amount: number
  label: string | null
  shortCode: string | null
  validUntil: string
  usedAt: string | null
  status: 'issued' | 'pending_verify' | 'pending_apply' | 'used' | 'expired' | 'unverified'
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function CouponDetailContent() {
  const params = useParams<{ couponId: string }>()
  const searchParams = useSearchParams()
  const storeIdFromQuery = searchParams.get('store_id') ?? ''

  const [coupon, setCoupon] = useState<CouponDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [needLogin, setNeedLogin] = useState(false)
  const [notOwner, setNotOwner] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/me/coupons/${encodeURIComponent(params.couponId)}`)
      if (res.status === 401) {
        setNeedLogin(true)
        return
      }
      if (res.status === 403) {
        setNotOwner(true)
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error ?? '쿠폰을 불러오지 못했습니다')
        return
      }
      const data = await res.json()
      setCoupon(data.coupon)
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [params.couponId])

  useEffect(() => { load() }, [load])

  const backHref = `/me/points?store_id=${encodeURIComponent(storeIdFromQuery || coupon?.storeId || '')}`

  async function handleConfirm() {
    if (!coupon) return
    setConfirming(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/me/coupons/${encodeURIComponent(coupon.id)}/confirm-use`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? '처리에 실패했습니다')
        return
      }
      setCoupon({ ...coupon, status: 'used', usedAt: data.usedAt })
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다')
    } finally {
      setConfirming(false)
    }
  }

  if (needLogin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#EFE6D6] px-8 text-center">
        <p className="text-lg font-bold text-[#222222]">쿠폰을 보려면 로그인이 필요해요</p>
        <a
          href={`/api/auth/kakao?storeId=${encodeURIComponent(storeIdFromQuery)}&next=points`}
          className="w-full max-w-sm rounded-full bg-[#FEE500] py-4 text-center font-bold text-[#222222] shadow-sm transition-colors hover:bg-[#FADA00]"
        >
          카카오로 시작하기
        </a>
      </div>
    )
  }

  if (notOwner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#EFE6D6] px-8 text-center">
        <p className="text-lg font-bold text-[#222222]">본인의 쿠폰만 확인할 수 있어요</p>
        <a href={backHref} className="text-sm font-semibold text-[#222222]/55 underline">
          쿠폰함으로 돌아가기
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EFE6D6]">
        <p className="text-sm text-[#222222]/45">불러오는 중...</p>
      </div>
    )
  }

  if (!coupon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#EFE6D6] px-8 text-center">
        <p className="text-lg font-bold text-[#222222]">{errorMsg ?? '쿠폰을 찾을 수 없습니다'}</p>
        <a href={backHref} className="text-sm font-semibold text-[#222222]/55 underline">
          쿠폰함으로 돌아가기
        </a>
      </div>
    )
  }

  const usable = coupon.status !== 'used' && coupon.status !== 'expired'

  return (
    <div className="min-h-screen bg-[#EFE6D6] px-6 pb-10 pt-6">
      <div className="mx-auto w-full max-w-sm">
        <a href={backHref} className="text-sm font-semibold text-[#222222]/50 hover:text-[#222222]/70">
          ← 쿠폰함
        </a>

        <div className="mt-6 flex flex-col items-center">
          <img
            src="/characters/char_result_jackpot.webp"
            alt=""
            className="h-auto w-[38%] max-w-[160px] select-none"
          />
          <p className="mt-2 text-sm font-semibold text-[#222222]/50">{coupon.storeName}</p>
        </div>

        <CouponTicket
          className="mt-5"
          amountLabel={coupon.label || `${coupon.amount.toLocaleString()}원 쿠폰`}
          code={coupon.shortCode ?? coupon.id.slice(0, 6).toUpperCase()}
          validUntilLabel={`~${formatDate(coupon.validUntil)}`}
          noteText="계산대에서 이 쿠폰 화면을 보여주세요"
          footer={
            coupon.status === 'used' ? (
              <div className="rounded-xl bg-[#222222]/8 px-4 py-2.5 text-base font-bold text-[#222222]/60">
                ✅ 사용 완료된 쿠폰입니다
              </div>
            ) : coupon.status === 'expired' ? (
              <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-base font-bold text-red-500">
                사용기간이 지난 쿠폰입니다
              </div>
            ) : undefined
          }
        />

        {usable && (
          <div className="mt-6">
            <p className="text-center text-sm font-semibold text-[#222222]/60">
              쿠폰 사용처리를 확인합니다.
            </p>
            {errorMsg && (
              <p className="mt-2 text-center text-sm font-semibold text-red-500">{errorMsg}</p>
            )}
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="mt-3 w-full rounded-full bg-[#00C7A7] px-10 py-4 text-lg font-bold text-white shadow-sm transition-colors hover:bg-[#00b296] disabled:opacity-60"
            >
              {confirming ? '처리 중...' : '사장님 확인'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CouponDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#EFE6D6]">
        <p className="text-sm text-[#222222]/45">불러오는 중...</p>
      </div>
    }>
      <CouponDetailContent />
    </Suspense>
  )
}
