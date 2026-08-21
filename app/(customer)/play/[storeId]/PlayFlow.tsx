'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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

/** 랜딩(대기) 화면의 캐비닛 이미지(bg_default_blank_sign.png) 원본 크기와,
 *  이미지에 이미 그려져 있는 상단 빈 명판(금테+리벳)의 실측 좌표 —
 *  object-contain으로 이미지가 배치되므로 컨테이너 크기에 맞춰 이 좌표를 스케일한다 */
const LANDING_IMG_W = 1024
const LANDING_IMG_H = 1536
const LANDING_SIGN_LEFT = 132
const LANDING_SIGN_RIGHT = 884
const LANDING_SIGN_TOP = 112
const LANDING_SIGN_BOTTOM = 244

interface ContainLayout {
  scale: number
  x: number
  y: number
}

/** object-contain으로 배치된 이미지 위에 좌표를 겹치기 위한 스케일/오프셋 계산.
 *  콜백 ref를 쓰는 이유 — 이 컨테이너는 'landing' 단계에서만 렌더되는데,
 *  일반 useRef+useEffect([]) 조합은 컴포넌트 최초 마운트(로딩 화면 단계) 시점에
 *  한 번만 실행되어 그때는 ref.current가 아직 null이라 관찰이 걸리지 않는다.
 *  콜백 ref는 노드가 실제로 DOM에 붙는 순간(=landing 단계 진입 시) 호출되므로
 *  그 타이밍에 정확히 관찰을 시작할 수 있다 */
function useContainLayout(imgW: number, imgH: number) {
  const [layout, setLayout] = useState<ContainLayout>({ scale: 0, x: 0, y: 0 })
  const roRef = useRef<ResizeObserver | null>(null)

  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      roRef.current?.disconnect()
      roRef.current = null
      if (!el) return

      const update = () => {
        const w = el.clientWidth
        const h = el.clientHeight
        if (!w || !h) return
        const scale = Math.min(w / imgW, h / imgH)
        setLayout({
          scale,
          x: (w - imgW * scale) / 2,
          y: (h - imgH * scale) / 2,
        })
      }

      update()
      const ro = new ResizeObserver(update)
      ro.observe(el)
      roRef.current = ro
    },
    [imgW, imgH]
  )

  return { ref, layout }
}

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
  const { ref: landingImgRef, layout: landingLayout } = useContainLayout(LANDING_IMG_W, LANDING_IMG_H)

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
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[#FFF3DE] px-8 text-center">
        <img
          src="/characters/char_result_miss.png"
          alt=""
          className="h-20 w-20 select-none object-contain"
        />
        <div>
          <h2 className="text-xl font-bold text-[#222222]">현재 진행중인 이벤트가 없어요</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#222222]/50">
            매장에서 새로운 이벤트를 준비 중이에요.<br />
            조금만 기다려 주세요!
          </p>
        </div>
        <p className="text-xs text-[#222222]/30">store: {storeId}</p>
      </div>
    )
  }

  if (step === 'loading' || step === 'claiming') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FFF3DE]">
        <div className="flex flex-col items-center">
          <motion.img
            src="/characters/char_result_jackpot.png"
            alt=""
            className="h-16 w-16 select-none object-contain"
            animate={{ scale: [0.9, 1.05, 0.9] }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="mt-3 text-[11px] text-[#6B7280]">
            {step === 'claiming' ? '확인 중' : '잠시만요'}
          </p>
        </div>
      </div>
    )
  }

  if (step === 'landing') {
    return (
      <div className="relative flex h-screen flex-col overflow-hidden bg-[#EFE6D6]">
        {/* 상단 헤더 — 매장/상호명은 아래 캐비닛 명판으로 옮기고, 여기는 짧은 안내 문구만 둔다 */}
        <div
          className="shrink-0 px-6 pb-2 text-center"
          style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}
        >
          <p className="text-base font-bold tracking-tight text-[#222222]">푸짐한 경품을 단 3초만에 받아가세요</p>
        </div>

        {/* 캐비닛 이미지 — 좌우/상하 세이프 여백 확보(object-contain) */}
        <div ref={landingImgRef} className="relative min-h-0 flex-1 px-5 py-2">
          <img
            src="/characters/bg_default_blank_sign.png"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain object-center"
          />

          {/* 매장명(상호명) — 화면 맨 위가 아니라, 이미지에 이미 그려진 상단 빈 명판(금테+리벳) 안에 표시.
              광고주가 매장명을 따로 입력하지 않은 경우엔 이벤트명으로 대체해 명판이 비어 보이지 않게 한다 */}
          {landingLayout.scale > 0 && (storeName || event.name) && (
            <div
              className="pointer-events-none absolute z-[1] flex items-center justify-center overflow-hidden"
              style={{
                left: landingLayout.x + LANDING_SIGN_LEFT * landingLayout.scale,
                top: landingLayout.y + LANDING_SIGN_TOP * landingLayout.scale,
                width: (LANDING_SIGN_RIGHT - LANDING_SIGN_LEFT) * landingLayout.scale,
                height: (LANDING_SIGN_BOTTOM - LANDING_SIGN_TOP) * landingLayout.scale,
              }}
            >
              <span
                className="truncate px-2 text-center font-extrabold tracking-tight text-[#3A2A18]"
                style={{ fontSize: 40 * landingLayout.scale, letterSpacing: 0.5 * landingLayout.scale }}
              >
                {storeName || event.name}
              </span>
            </div>
          )}
        </div>

        {showPrizeList && (
          <PrizeListSheet storeId={storeId} onClose={() => setShowPrizeList(false)} />
        )}

        {/* 하단 버튼 영역 */}
        <div
          className="shrink-0 px-6 pt-2"
          style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto w-full max-w-sm">
            <div className="flex gap-2.5">
              <a
                href={`/me/points?store_id=${encodeURIComponent(storeId)}`}
                className="flex flex-1 items-center justify-center rounded-full border border-[#222222]/15 bg-white/70 px-4 py-3.5 text-sm font-bold text-[#222222]/70 backdrop-blur-sm transition-colors hover:bg-white/90"
              >
                내 쿠폰함
              </a>
              <button
                type="button"
                onClick={() => setShowPrizeList(true)}
                className="flex flex-1 items-center justify-center rounded-full border border-[#222222]/15 bg-white/70 px-4 py-3.5 text-sm font-bold text-[#222222]/70 backdrop-blur-sm transition-colors hover:bg-white/90"
              >
                🎁 경품 보기
              </button>
            </div>
            <button
              onClick={() => setStep('playing')}
              className="mt-2.5 w-full rounded-full bg-[#00C7A7] px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-[#00b399]"
            >
              뽑기 시작
            </button>
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
        storeName={storeName}
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
