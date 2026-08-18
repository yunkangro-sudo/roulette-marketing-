'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { login as mockLogin, logout as mockLogout, type MockUser } from '@/lib/auth/mockLogin'
import GameContainer from '@/components/game/claw_machine/GameContainer'
import ResultScreen from '@/components/game/ResultScreen'
import VerificationCtaScreen from '@/components/game/VerificationCtaScreen'
import AlreadyParticipatedScreen from '@/components/play/AlreadyParticipatedScreen'
import ResultLockedScreen from '@/components/play/ResultLockedScreen'
import ChannelCtaScreen from '@/components/play/ChannelCtaScreen'
import PrizeListSheet from '@/components/play/PrizeListSheet'
import type { PrizeResult } from '@/components/game/types'
import { resolveTier } from '@/components/game/claw_machine/gameUtils'

type Step =
  | 'loading'
  | 'landing'
  | 'playing'
  | 'result_locked'
  | 'claiming'
  | 'already_participated'
  | 'result'
  | 'channel_cta'
  | 'verification_cta'

interface Event {
  id: string
  name: string
  status: string
}

interface Props {
  storeId: string
  event: Event | null
  storeName?: string | null
  daangnUrl?: string | null
  kakaoChannelUrl?: string | null
  /** 카카오 로그인 직후(?claim=1)에만 잠금 결과/claim을 이어간다 */
  resumeClaim?: boolean
}

const IS_KAKAO = !!process.env.NEXT_PUBLIC_KAKAO_JS_KEY
const ADVERTISER_KAKAO_URL = process.env.NEXT_PUBLIC_ADVERTISER_KAKAO_URL

function toPrizeResult(revealed: {
  label: string
  amount: number
  pointsAwarded?: number
  coupon?: { id: string; shortCode?: string; status: string; issuedAt: string; validUntil: string }
}): PrizeResult {
  return {
    tier: resolveTier(revealed.amount, true),
    label: revealed.label,
    amount: revealed.amount,
    pointsAwarded: revealed.pointsAwarded ?? 0,
    requiresVerification: true,
    coupon: revealed.coupon
      ? {
          id: revealed.coupon.id,
          shortCode: revealed.coupon.shortCode,
          status: revealed.coupon.status as 'issued' | 'pending_verify',
          issuedAt: revealed.coupon.issuedAt,
          validUntil: revealed.coupon.validUntil,
        }
      : undefined,
  }
}

export default function PlayFlow({ storeId, event, storeName, daangnUrl, kakaoChannelUrl, resumeClaim = false }: Props) {
  const [step, setStep] = useState<Step>('loading')
  const [user, setUser] = useState<MockUser | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [result, setResult] = useState<PrizeResult | null>(null)
  const [showPrizeList, setShowPrizeList] = useState(false)
  const claimingRef = useRef(false)

  const claimResult = useCallback(async () => {
    if (claimingRef.current) return
    claimingRef.current = true
    setStep('claiming')
    try {
      const res = await fetch('/api/games/claim', { method: 'POST' })
      const data = await res.json()
      if (data.alreadyParticipated) {
        setResult(null)
        setStep('already_participated')
        return
      }
      if (data.needLogin || res.status === 401) {
        setUser(null)
        setStep('result_locked')
        return
      }
      if (!res.ok) {
        setStep('landing')
        return
      }
      if (data.result) {
        setResult(toPrizeResult(data.result))
        setStep('result')
      } else {
        setStep('landing')
      }
    } catch {
      setStep('landing')
    } finally {
      claimingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!event) {
      setStep('landing')
      return
    }

    async function boot() {
      let loggedInUser: MockUser | null = null
      try {
        const me = await fetch('/api/auth/me').then((r) => r.json())
        if (me.user) {
          loggedInUser = { kakao_user_id: me.user.kakao_user_id, nickname: me.user.nickname }
          setUser(loggedInUser)
        }
      } catch {
        // 게스트로 진행
      }

      if (!resumeClaim) {
        setStep('landing')
        return
      }

      try {
        const pending = await fetch('/api/games/pending').then((r) => r.json())
        if (pending.hasRevealed && pending.revealed) {
          setResult(toPrizeResult(pending.revealed))
          setStep('result')
          return
        }
        if (pending.hasPending) {
          if (loggedInUser) {
            await claimResult()
            return
          }
          setStep('result_locked')
          return
        }
      } catch {
        // 게스트로 진행
      }
      setStep('landing')
    }

    boot()
  }, [storeId, event, claimResult, resumeClaim])

  // 데모 시연용: 이미 로그인된 세션이 남아있어도 "카카오로 결과 확인하기" 화면을
  // 항상 거치도록 한다 (실제 손님이 처음 겪는 화면 순서를 매번 동일하게 시연하기 위함).
  // → 여기서는 세션 유무로 자동 claim하지 않는다. claim은 (1) 카카오 로그인 콜백
  //   복귀 시(resumeClaim) 또는 (2) 목업 로그인 버튼 클릭(handleMockClaim) 시에만 실행한다.

  const handleMockClaim = useCallback(async (kakaoUserId: string) => {
    if (!kakaoUserId.trim()) return
    setLoginLoading(true)
    try {
      mockLogin(kakaoUserId)
      const res = await fetch('/api/dev/mock-customer-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kakao_user_id: kakaoUserId, storeId }),
      })
      if (res.ok) {
        setUser({ kakao_user_id: kakaoUserId, nickname: kakaoUserId })
      }
      await claimResult()
    } finally {
      setLoginLoading(false)
    }
  }, [storeId, claimResult])

  const handleSwitchAccount = useCallback(async () => {
    if (IS_KAKAO) {
      try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    } else {
      mockLogout()
    }
    setUser(null)
    setResult(null)
    setStep('landing')
  }, [])

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 px-8 gap-6 text-center">
        <div className="text-6xl">🥕</div>
        <div>
          <h2 className="text-white text-xl font-bold">현재 진행중인 이벤트가 없어요</h2>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            매장에서 새로운 이벤트를 준비 중이에요.<br />
            조금만 기다려 주세요!
          </p>
        </div>
        <p className="text-gray-600 text-xs">store: {storeId}</p>
      </div>
    )
  }

  if (step === 'loading' || step === 'claiming') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🥕</div>
          <p className="text-gray-400 text-sm">{step === 'claiming' ? '결과를 확인하고 있어요...' : '로딩 중...'}</p>
        </div>
      </div>
    )
  }

  if (step === 'landing') {
    return (
      <div className="relative h-screen overflow-hidden bg-[#EFE6D6]">
        <img
          src="/characters/bg_default.png"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center"
        />
        <button
          type="button"
          onClick={() => setShowPrizeList(true)}
          className="absolute right-5 top-5 z-10 text-sm font-semibold text-[#222222]/45 underline underline-offset-2 hover:text-[#222222]/70"
        >
          🎁 경품 보기
        </button>

        <div className="absolute top-[5%] left-0 right-0 z-10 px-8 text-center">
          <h1 className="text-[22px] font-bold leading-snug tracking-tight text-[#222222]">
            {event.name}
          </h1>
          <p className="mt-2 text-sm text-[#222222]/55">로그인 없이 바로 도전해 보세요!</p>
        </div>

        {showPrizeList && (
          <PrizeListSheet storeId={storeId} onClose={() => setShowPrizeList(false)} />
        )}
        <div className="absolute bottom-[6%] left-0 right-0 z-10 px-8">
          <div className="mx-auto w-full max-w-sm">
            <div className="flex gap-2.5">
              <a
                href={`/me/points?store_id=${encodeURIComponent(storeId)}`}
                className="flex flex-1 items-center justify-center rounded-full border border-[#222222]/15 bg-white/60 px-4 py-4 text-sm font-bold text-[#222222]/70 backdrop-blur-sm transition-colors hover:bg-white/80"
              >
                내 쿠폰함
              </a>
              <button
                onClick={() => setStep('playing')}
                className="flex-[1.6] rounded-full bg-orange-500 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-orange-400"
              >
                뽑기 시작
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-[#222222]/45">1일 1회 응모 가능</p>
            <p className="mt-4 text-center text-[11px] text-[#222222]/35">
              * 현재 이 게임은 데모 버전으로 테스트용입니다.
            </p>
            {ADVERTISER_KAKAO_URL && (
              <a
                href={ADVERTISER_KAKAO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 block text-center text-[11px] font-semibold text-[#222222]/45 underline underline-offset-2 hover:text-[#222222]/65"
              >
                광고주 상담 문의하기
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (step === 'playing') {
    return (
      <GameContainer
        eventId={event.id}
        deferReveal
        initialPhase="play"
        onLocked={() => setStep('result_locked')}
        onReplay={handleSwitchAccount}
      />
    )
  }

  if (step === 'result_locked') {
    return (
      <ResultLockedScreen
        storeId={storeId}
        onMockLogin={handleMockClaim}
        loading={loginLoading}
      />
    )
  }

  if (step === 'already_participated') {
    return <AlreadyParticipatedScreen onSwitchAccount={handleSwitchAccount} />
  }

  if (step === 'result' && result) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-[#EFE6D6]">
        <ResultScreen
          result={result}
          onReplay={handleSwitchAccount}
          onContinue={() => setStep('channel_cta')}
          continueLabel="다음"
        />
      </div>
    )
  }

  if (step === 'channel_cta') {
    return (
      <ChannelCtaScreen
        kakaoChannelUrl={kakaoChannelUrl}
        onContinue={() => {
          if (result && result.amount > 0) setStep('verification_cta')
          else setStep('landing')
        }}
      />
    )
  }

  if (step === 'verification_cta' && result) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-gray-900">
        <VerificationCtaScreen
          result={result}
          onDone={handleSwitchAccount}
          daangnUrl={daangnUrl}
          storeId={storeId}
          storeName={storeName}
        />
      </div>
    )
  }

  return null
}
