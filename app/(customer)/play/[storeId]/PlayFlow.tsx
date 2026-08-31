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
import { PLAY_SCREEN_IMAGES } from '@/components/game/claw_machine/PlayScreen'
import { RESULT_SCREEN_IMAGES } from '@/components/game/ResultScreen'
import { preloadImages } from '@/lib/game/preloadImages'

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

type ChallengeFrequency = 'daily' | 'weekly' | 'monthly' | 'unlimited'

interface Event {
  id: string
  name: string
  status: string
  challenge_frequency?: ChallengeFrequency | null
}

const CHALLENGE_FREQUENCY_LABEL: Record<ChallengeFrequency, string> = {
  daily: '1일 1회 응모 가능',
  weekly: '1주 1회 응모 가능',
  monthly: '1개월 1회 응모 가능',
  unlimited: '횟수 제한 없이 응모 가능',
}

interface Props {
  storeId: string
  event: Event | null
  storeName?: string | null
  daangnUrl?: string | null
  kakaoChannelUrl?: string | null
  /** 카카오 로그인 직후(?claim=1)에만 잠금 결과/claim을 이어간다 */
  resumeClaim?: boolean
  /** 카카오 로그인 콜백에서 에러가 나서 돌아온 경우(?auth_error=1) */
  authError?: boolean
}

/** 카카오 로그인 실패 시 랜딩 화면 상단에 뜨는 안내 배너 — 리다이렉트로 바꿔도 여전히
 *  막히는 극소수 환경(회사 방화벽 등)을 위한 안전장치. 현재 페이지 주소를 복사해서
 *  다른 브라우저로 열어볼 수 있게 안내한다. */
function AuthErrorBanner({ onDismiss }: { onDismiss: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드 API를 쓸 수 없는 환경 — 조용히 무시(버튼은 계속 눌러볼 수 있음)
    }
  }, [])

  return (
    <div className="absolute inset-x-4 top-3 z-30 rounded-2xl bg-red-50 px-4 py-3 text-center shadow-md">
      <p className="text-xs font-bold leading-relaxed text-red-600">
        카카오 로그인에 실패했어요.<br />
        문제가 계속되면 이 주소를 복사해서 다른 브라우저에서 열어보세요.
      </p>
      <div className="mt-2.5 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full bg-red-500 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-400"
        >
          {copied ? '복사됐어요!' : '주소 복사하기'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500/70 transition-colors hover:bg-red-100"
        >
          닫기
        </button>
      </div>
    </div>
  )
}

const IS_KAKAO = !!process.env.NEXT_PUBLIC_KAKAO_JS_KEY
const ADVERTISER_KAKAO_URL = process.env.NEXT_PUBLIC_ADVERTISER_KAKAO_URL

/** 랜딩(대기) 화면의 캐비닛 이미지(bg_default_blank_sign.png) 원본 크기와,
 *  이미지에 이미 그려져 있는 상단 빈 명판(금테+리벳)의 실측 좌표 —
 *  object-contain으로 이미지가 배치되므로 컨테이너 크기에 맞춰 이 좌표를 스케일한다 */
// 원본 이미지 상단의 순수 여백 60px을 잘라낸 트리밍 버전을 사용(화면 길이 축소).
// 아래 좌표들은 트리밍 이후 기준으로 미리 보정해둔 값이다.
const LANDING_IMG_W = 1024
const LANDING_IMG_H = 1476
const LANDING_TOP_TRIM = 60
const LANDING_SIGN_LEFT = 132
const LANDING_SIGN_RIGHT = 884
const LANDING_SIGN_TOP = 112 - LANDING_TOP_TRIM
const LANDING_SIGN_BOTTOM = 244 - LANDING_TOP_TRIM

/** 캐비닛 받침대(글라스 프레임 밑 ~ 하단 금색 트림 사이)의 빈 크림색 배경 —
 *  안내 문구를 화면 상단이 아니라 여기에 배치한다 */
const LANDING_FOOTER_LEFT = 160
const LANDING_FOOTER_RIGHT = 864
const LANDING_FOOTER_TOP = 1195 - LANDING_TOP_TRIM + 28
const LANDING_FOOTER_BOTTOM = 1400 - LANDING_TOP_TRIM + 28
const LANDING_FOOTER_FONT_SIZE = 40
/** 상호명 폰트 크기 — 명판 안을 꽉 채우도록 기존(40) 대비 2배 */
const LANDING_SIGN_FONT_SIZE = 80

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

export default function PlayFlow({ storeId, event, storeName, daangnUrl, kakaoChannelUrl, resumeClaim = false, authError = false }: Props) {
  const [step, setStep] = useState<Step>('loading')
  const [user, setUser] = useState<MockUser | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [result, setResult] = useState<PrizeResult | null>(null)
  const [nextAvailableAt, setNextAvailableAt] = useState<string | null>(null)
  const [showPrizeList, setShowPrizeList] = useState(false)
  const [showAuthError, setShowAuthError] = useState(authError)
  const claimingRef = useRef(false)
  const { ref: landingImgRef, layout: landingLayout } = useContainLayout(LANDING_IMG_W, LANDING_IMG_H)

  const claimResult = useCallback(async () => {
    if (claimingRef.current) return
    claimingRef.current = true
    setStep('claiming')
    try {
      const res = await fetch('/api/games/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId }),
      })
      const data = await res.json()
      if (data.alreadyParticipated) {
        setResult(null)
        setNextAvailableAt(data.nextAvailableAt ?? null)
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
        const prize = toPrizeResult(data.result)
        setResult(prize)
        // 당첨(경품 있음)인 경우, 민트색 결과화면(ResultScreen)과 파란색 단골추가
        // 안내화면(VerificationCtaScreen)이 경품명·쿠폰코드를 중복해서 두 번 보여주는
        // 문제가 있었다 — 당첨 시엔 ResultScreen을 건너뛰고 바로 단골추가 안내로 간다.
        // "꽝"(amount 0)은 단골추가로 이어질 쿠폰이 없으므로 기존 결과화면을 그대로 보여준다.
        setStep(prize.amount > 0 ? 'verification_cta' : 'result')
      } else {
        setStep('landing')
      }
    } catch {
      setStep('landing')
    } finally {
      claimingRef.current = false
    }
  }, [storeId])

  // 랜딩화면("뽑기 시작" 버튼이 뜨는 시점)에 도착하자마자, 사용자가 버튼을 누르기 전에
  // 다음 화면들(게임 화면 → 결과 화면)이 쓸 이미지를 미리 백그라운드로 받아둔다.
  // 랜딩화면을 보고 있는 몇 초 동안 조용히 다운로드되므로, 실제로 뽑기를 시작하거나
  // 결과가 나올 때는 이미 캐시에 있어 지연 없이 바로 표시된다.
  useEffect(() => {
    if (step !== 'landing') return
    preloadImages([...PLAY_SCREEN_IMAGES, ...RESULT_SCREEN_IMAGES])
  }, [step])

  // 새로고침해도 배너가 계속 뜨지 않도록, 표시 직후 주소에서 ?auth_error=1을 지운다.
  useEffect(() => {
    if (!authError || typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.delete('auth_error')
    window.history.replaceState({}, '', url.toString())
  }, [authError])

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
        const pending = await fetch(`/api/games/pending?store_id=${encodeURIComponent(storeId)}`).then((r) => r.json())
        if (pending.hasRevealed && pending.revealed) {
          const prize = toPrizeResult(pending.revealed)
          setResult(prize)
          // claimResult()와 동일한 규칙: 당첨은 단골추가 안내로 바로, 꽝만 결과화면 경유.
          setStep(prize.amount > 0 ? 'verification_cta' : 'result')
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

  /** 로그인 상태는 유지한 채, 결과 화면만 닫고 최초(게임 시작) 화면으로 돌아간다 */
  const handleCloseToLanding = useCallback(() => {
    setResult(null)
    setStep('landing')
  }, [])

  if (!event) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-[#FFF3DE] px-8 text-center">
        <img
          src="/characters/char_result_miss.webp"
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
      <div className="flex h-full items-center justify-center bg-[#FFF3DE]">
        <div className="flex flex-col items-center">
          <motion.img
            src="/characters/char_result_jackpot.webp"
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
      <div className="relative flex h-full flex-col overflow-hidden bg-[#EFE6D6]">
        {showAuthError && <AuthErrorBanner onDismiss={() => setShowAuthError(false)} />}

        {/* 캐비닛 이미지 — 상단 안내 헤더를 없애고 세이프 영역만 최소로 확보(화면 길이 축소) */}
        <div
          ref={landingImgRef}
          className="relative min-h-0 flex-1 px-5"
          style={{ paddingTop: 'max(6px, env(safe-area-inset-top))', paddingBottom: 4 }}
        >
          <img
            src="/characters/bg_default_blank_sign_trimmed.webp"
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
                style={{ fontSize: LANDING_SIGN_FONT_SIZE * landingLayout.scale, letterSpacing: 0.5 * landingLayout.scale }}
              >
                {storeName || event.name}
              </span>
            </div>
          )}

          {/* 안내 문구 — 화면 상단이 아니라 캐비닛 받침대의 빈 배경 중앙에 작게 표시 */}
          {landingLayout.scale > 0 && (
            <div
              className="pointer-events-none absolute z-[1] flex items-center justify-center overflow-hidden"
              style={{
                left: landingLayout.x + LANDING_FOOTER_LEFT * landingLayout.scale,
                top: landingLayout.y + LANDING_FOOTER_TOP * landingLayout.scale,
                width: (LANDING_FOOTER_RIGHT - LANDING_FOOTER_LEFT) * landingLayout.scale,
                height: (LANDING_FOOTER_BOTTOM - LANDING_FOOTER_TOP) * landingLayout.scale,
              }}
            >
              <span
                className="truncate px-2 text-center font-bold tracking-tight text-[#222222]"
                style={{ fontSize: LANDING_FOOTER_FONT_SIZE * landingLayout.scale }}
              >
                푸짐한 경품을 단 3초만에 받아가세요
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
              <motion.button
                type="button"
                onClick={() => setShowPrizeList(true)}
                className="relative flex flex-1 items-center justify-center overflow-hidden rounded-full border border-[#222222]/15 bg-white/70 px-4 py-3.5 text-sm font-bold text-[#222222]/70 backdrop-blur-sm transition-colors hover:bg-white/90"
                animate={{
                  boxShadow: [
                    '0 0 0px 0px rgba(0,199,167,0)',
                    '0 0 10px 2px rgba(0,199,167,0.35)',
                    '0 0 0px 0px rgba(0,199,167,0)',
                  ],
                }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* 은은한 반짝임 — 시선을 끌되 요란하지 않게, 몇 초에 한 번씩만 훑고 지나간다 */}
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
                  style={{
                    background:
                      'linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                  }}
                  animate={{ x: ['-140%', '280%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2.3, ease: 'easeInOut' }}
                />
                <span
                  className="relative z-[1] bg-clip-text font-extrabold text-transparent [background-size:200%_100%] [animation:shimmerText_2.2s_linear_infinite]"
                  style={{
                    backgroundImage:
                      'linear-gradient(100deg, #222222 30%, #00C7A7 45%, #ffffff 50%, #00C7A7 55%, #222222 70%)',
                  }}
                >
                  경품 보기
                </span>
              </motion.button>
            </div>
            <button
              onClick={() => setStep('playing')}
              className="mt-2.5 w-full rounded-full bg-[#00C7A7] px-6 py-4 text-lg font-bold transition-colors hover:bg-[#00b399]"
            >
              <motion.span
                animate={{ color: ['#FFFFFF', '#FFF3B0', '#FFFFFF'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                뽑기 시작
              </motion.span>
            </button>
            <p className="mt-3 text-center text-xs text-[#222222]/45">
              {CHALLENGE_FREQUENCY_LABEL[event?.challenge_frequency ?? 'daily']}
            </p>
            <style>{`
              @keyframes shimmerText {
                0% { background-position: 200% 0%; }
                100% { background-position: -200% 0%; }
              }
            `}</style>
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
        storeName={storeName || event.name}
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
    return <AlreadyParticipatedScreen nextAvailableAt={nextAvailableAt} />
  }

  if (step === 'result' && result) {
    // 당첨(amount > 0)은 claimResult()에서 이 단계를 건너뛰고 곧장 verification_cta로
    // 가므로, 여기 도달하는 건 항상 "꽝"(경품 없음) 케이스뿐이다 — 그래서 계속 진행 시
    // 단골추가 안내 없이 바로 랜딩으로 돌아간다.
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#EFE6D6]">
        <ResultScreen
          result={result}
          onReplay={handleSwitchAccount}
          onContinue={() => setStep('landing')}
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
      <div className="relative w-full h-full overflow-hidden bg-gray-900">
        <VerificationCtaScreen
          result={result}
          onDone={handleSwitchAccount}
          onClose={handleCloseToLanding}
          daangnUrl={daangnUrl}
          storeId={storeId}
          storeName={storeName || event.name}
        />
      </div>
    )
  }

  return null
}
