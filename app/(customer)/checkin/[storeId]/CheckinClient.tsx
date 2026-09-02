'use client'

import { useEffect, useState, useCallback } from 'react'
import StampBoard from '@/components/game/StampBoard'

interface CheckinResult {
  needLogin?: boolean
  disabled?: boolean
  alreadyCheckedIn?: boolean
  ok?: boolean
  mode?: 'points' | 'stamp'
  pointsAwarded?: number
  goalReached?: boolean
  stampCount?: number
  stampGoal?: number
  couponId?: string | null
  rewardIssued?: boolean
  storeName?: string
  storeId?: string
  error?: string
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EFE6D6] px-6 text-center">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}

export default function CheckinClient({ storeId }: { storeId: string }) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<CheckinResult | null>(null)

  const run = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/checkin/${encodeURIComponent(storeId)}`, { method: 'POST' })
      const data: CheckinResult = await res.json()
      setResult(data)
    } catch {
      setResult({ error: '네트워크 오류가 발생했습니다' })
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => { run() }, [run])

  if (loading) {
    return (
      <Shell>
        <p className="text-sm text-[#222222]/45">확인 중...</p>
      </Shell>
    )
  }

  if (!result) {
    return (
      <Shell>
        <p className="text-lg font-bold text-[#222222]">문제가 발생했어요</p>
      </Shell>
    )
  }

  if (result.needLogin) {
    return (
      <Shell>
        <p className="text-lg font-bold text-[#222222]">{result.storeName}</p>
        <p className="mt-2 text-sm text-[#222222]/60">방문 적립을 받으려면 로그인이 필요해요</p>
        <a
          href={`/api/auth/kakao?storeId=${encodeURIComponent(storeId)}&next=checkin`}
          className="mt-6 block w-full rounded-full bg-[#FEE500] py-4 text-center font-bold text-[#222222] shadow-sm transition-colors hover:bg-[#FADA00]"
        >
          카카오로 시작하기
        </a>
      </Shell>
    )
  }

  if (result.disabled) {
    return (
      <Shell>
        <p className="text-lg font-bold text-[#222222]">이 매장은 방문 적립을 사용하지 않아요</p>
      </Shell>
    )
  }

  if (result.alreadyCheckedIn) {
    return (
      <Shell>
        <img src="/characters/char_result_jackpot.webp" alt="" className="mx-auto h-auto w-[32%] max-w-[130px] select-none" />
        <p className="mt-4 text-lg font-bold text-[#222222]">오늘은 이미 방문 적립을 받으셨어요</p>
        <p className="mt-2 text-sm text-[#222222]/50">내일 또 태그해주세요!</p>
        <div className="mt-8 space-y-3">
          <a
            href={`/play/${encodeURIComponent(storeId)}`}
            className="block w-full rounded-full bg-[#00C7A7] px-10 py-4 text-lg font-bold text-white shadow-sm transition-colors hover:bg-[#00b296]"
          >
            게임 첫 화면으로 돌아가기
          </a>
          <a
            href={`/me/points?store_id=${encodeURIComponent(storeId)}`}
            className="block w-full rounded-full border border-[#222222]/15 px-10 py-4 text-base font-bold text-[#222222] transition-colors hover:bg-[#222222]/5"
          >
            내 쿠폰함 바로가기
          </a>
        </div>
      </Shell>
    )
  }

  if (result.error) {
    return (
      <Shell>
        <p className="text-lg font-bold text-[#222222]">{result.error}</p>
      </Shell>
    )
  }

  if (result.mode === 'points') {
    return (
      <Shell>
        <img src="/characters/char_result_jackpot.webp" alt="" className="mx-auto h-auto w-[36%] max-w-[150px] select-none" />
        <p className="mt-4 text-sm font-semibold text-[#222222]/50">{result.storeName}</p>
        <p className="mt-2 text-2xl font-black text-[#00C7A7]">
          방문 포인트 {(result.pointsAwarded ?? 0).toLocaleString()}P 적립됐어요!
        </p>
        <a
          href={`/me/points?store_id=${encodeURIComponent(storeId)}`}
          className="mt-8 block w-full rounded-full bg-[#00C7A7] px-10 py-4 text-lg font-bold text-white shadow-sm transition-colors hover:bg-[#00b296]"
        >
          쿠폰함 보기
        </a>
      </Shell>
    )
  }

  if (result.mode === 'stamp') {
    if (result.goalReached) {
      return (
        <Shell>
          <img src="/characters/char_result_jackpot.webp" alt="" className="mx-auto h-auto w-[38%] max-w-[160px] select-none" />
          <p className="mt-4 text-sm font-semibold text-[#222222]/50">{result.storeName}</p>
          <p className="mt-2 text-xl font-black text-[#222222]">
            축하해요! 스탬프를 다 채워서 리워드가 발급됐어요 🎉
          </p>
          {result.couponId ? (
            <a
              href={`/me/points/${encodeURIComponent(result.couponId)}?store_id=${encodeURIComponent(storeId)}`}
              className="mt-8 block w-full rounded-full bg-[#00C7A7] px-10 py-4 text-lg font-bold text-white shadow-sm transition-colors hover:bg-[#00b296]"
            >
              쿠폰 확인하기
            </a>
          ) : (
            <p className="mt-6 text-sm text-[#222222]/50">매장에 리워드가 설정되지 않아 발급이 되지 않았어요. 매장 문의해주세요.</p>
          )}
        </Shell>
      )
    }
    return (
      <Shell>
        <p className="text-sm font-semibold text-[#222222]/50">{result.storeName}</p>
        <p className="mt-2 text-xl font-black text-[#222222]">
          스탬프 {result.stampCount}/{result.stampGoal} 채웠어요!
        </p>
        <StampBoard current={result.stampCount ?? 0} goal={result.stampGoal ?? 10} className="mt-6" />
      </Shell>
    )
  }

  return (
    <Shell>
      <p className="text-lg font-bold text-[#222222]">처리되었습니다</p>
    </Shell>
  )
}
