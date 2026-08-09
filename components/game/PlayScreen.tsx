'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { rollPrize, resolveTier } from './gameUtils'
import type { PrizeResult } from './types'

// 진열장에 배치할 인형 (이후 실제 이미지로 교체 예정)
const TOTAL_DOLLS = 9
const CLAW_DROP_PX = 170 // 크레인 하강 거리(px)

interface Props {
  onResult: (result: PrizeResult) => void
  /** 있으면 /api/games/play로 서버 추첨, 없으면(데모 모드) 클라이언트 로컬 추첨 */
  eventId?: string
  kakaoUserId?: string
}

/** 서버에서 결과를 받아온다 (실서비스). eventId가 없으면 데모용 로컬 추첨으로 폴백한다. */
async function drawResult(eventId?: string, kakaoUserId?: string): Promise<PrizeResult> {
  if (!eventId || !kakaoUserId) {
    return rollPrize()
  }

  const res = await fetch('/api/games/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: eventId, kakao_user_id: kakaoUserId }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `게임 결과 요청 실패 (HTTP ${res.status})`)
  }

  const data = await res.json()
  return {
    tier: resolveTier(data.amount, data.requiresVerification),
    label: data.label,
    amount: data.amount,
    requiresVerification: data.requiresVerification,
  }
}

export default function PlayScreen({ onResult, eventId, kakaoUserId }: Props) {
  const railContainerRef = useRef<HTMLDivElement>(null)
  const [constraints, setConstraints] = useState({ left: -140, right: 140 })
  const [isAnimating, setIsAnimating] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [idleTick, setIdleTick] = useState(0) // 증가할 때마다 타이머 리셋
  const [removedDolls, setRemovedDolls] = useState<Set<number>>(new Set())
  const [grabbedDoll, setGrabbedDoll] = useState<boolean>(false)
  const clawControls = useAnimation()

  // 컨테이너 너비 계산 → drag constraints 설정
  useEffect(() => {
    const update = () => {
      if (railContainerRef.current) {
        const w = railContainerRef.current.offsetWidth
        // 크레인 너비 48px 기준, 레일 끝에서 살짝 여유
        setConstraints({ left: -(w / 2 - 28), right: w / 2 - 28 })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // 5초 유휴 → 폴백 버튼 노출
  useEffect(() => {
    if (isAnimating) {
      setShowFallback(false)
      return
    }
    setShowFallback(false)
    const t = setTimeout(() => setShowFallback(true), 5000)
    return () => clearTimeout(t)
  }, [isAnimating, idleTick])

  const resetIdle = useCallback(() => {
    setIdleTick((n) => n + 1)
  }, [])

  // 실제 크레인 하강 → 집기 → 상승 → 결과 시퀀스
  const triggerDrop = useCallback(async () => {
    if (isAnimating) return
    setIsAnimating(true)
    setShowFallback(false)

    let result: PrizeResult
    try {
      result = await drawResult(eventId, kakaoUserId)
    } catch (err) {
      console.error('게임 결과 요청 오류:', err)
      alert('오류가 발생했습니다. 다시 시도해주세요.')
      setIsAnimating(false)
      return
    }

    // 잡을 인형 선택 (visible 중 랜덤)
    const available = Array.from({ length: TOTAL_DOLLS }, (_, i) => i).filter(
      (i) => !removedDolls.has(i)
    )
    const pickedIdx =
      available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : null

    // 1. 하강
    await clawControls.start({
      y: CLAW_DROP_PX,
      transition: { duration: 0.55, ease: 'easeIn' },
    })

    // 2. 집기 — 당첨이면 인형 표시
    if (result.tier !== 'miss' && pickedIdx !== null) {
      setGrabbedDoll(true)
    }
    await new Promise((r) => setTimeout(r, 280))

    // 3. 상승
    await clawControls.start({
      y: 0,
      transition: { duration: 0.65, ease: 'easeOut' },
    })
    await new Promise((r) => setTimeout(r, 120))

    // 4. 배출 — 인형 제거
    if (result.tier !== 'miss' && pickedIdx !== null) {
      setRemovedDolls((prev) => new Set([...prev, pickedIdx]))
    }
    setGrabbedDoll(false)

    setIsAnimating(false)
    onResult(result)
  }, [isAnimating, clawControls, removedDolls, onResult, eventId, kakaoUserId])

  const handleDragEnd = useCallback(() => {
    triggerDrop()
  }, [triggerDrop])

  const handleFallbackTap = useCallback(() => {
    resetIdle()
    triggerDrop()
  }, [resetIdle, triggerDrop])

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden select-none">
      {/* 게임 상단 레이블 */}
      <div className="absolute top-4 left-0 right-0 text-center">
        <p className="text-gray-500 text-xs">← 드래그해서 위치 조정 후 손 떼기 →</p>
      </div>

      {/* 레일 + 크레인 시스템 */}
      <div
        ref={railContainerRef}
        className="absolute left-0 right-0"
        style={{ top: '18%' }}
      >
        {/* 레일 (시각적) */}
        <div className="absolute left-0 right-0 h-3 bg-gray-600 rounded-full shadow-inner" />

        {/* 크레인 — 드래그 가능 */}
        <motion.div
          className="absolute top-0 flex flex-col items-center touch-none z-20"
          style={{ left: '50%', marginLeft: '-24px' }} // 크레인 중앙 정렬
          drag={isAnimating ? false : 'x'}
          dragConstraints={constraints}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={resetIdle}
          onDragEnd={handleDragEnd}
        >
          {/* 크레인 암 */}
          <div className="w-1.5 h-16 bg-yellow-400 rounded-b shadow-md" />

          {/* 집게 (y 방향 애니메이션) */}
          <motion.div animate={clawControls} className="flex flex-col items-center">
            {/* 집게 머리 */}
            <div className="w-12 h-2.5 bg-yellow-300 rounded shadow" />
            {/* 집게 발 */}
            <div className="flex gap-1.5 mt-0.5">
              <div
                className="w-1 h-6 bg-yellow-300 rounded-b-full"
                style={{ transformOrigin: 'top', transform: 'rotate(-14deg)' }}
              />
              <div className="w-1 h-7 bg-yellow-300 rounded-b-full" />
              <div
                className="w-1 h-6 bg-yellow-300 rounded-b-full"
                style={{ transformOrigin: 'top', transform: 'rotate(14deg)' }}
              />
            </div>

            {/* 집힌 인형 (당첨 시 상승 중 표시) */}
            <AnimatePresence>
              {grabbedDoll && (
                <motion.div
                  key="grabbed"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-3xl mt-1"
                >
                  🥕
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      {/* 진열장 — 인형 그리드 */}
      <div className="absolute bottom-20 left-0 right-0 px-5">
        <div className="border border-gray-700 rounded-2xl p-4 bg-gray-800/60">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: TOTAL_DOLLS }, (_, i) => (
              <motion.div
                key={i}
                animate={
                  removedDolls.has(i)
                    ? { opacity: 0, scale: 0 }
                    : { opacity: 1, scale: 1 }
                }
                transition={{ duration: 0.3 }}
                className="text-5xl text-center py-1"
              >
                🥕
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 5초 폴백 버튼 */}
      <AnimatePresence>
        {showFallback && !isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: [1, 1.07, 1],
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                opacity: { duration: 0.3 },
                scale: { repeat: Infinity, duration: 1.3, ease: 'easeInOut' },
              }}
              className="bg-orange-500 text-white px-7 py-4 rounded-full text-sm font-bold shadow-2xl pointer-events-auto"
              onClick={handleFallbackTap}
            >
              여기를 눌러도 뽑을 수 있어요 👆
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* 애니메이션 중 입력 차단 오버레이 */}
      {isAnimating && <div className="absolute inset-0 z-40" />}
    </div>
  )
}
