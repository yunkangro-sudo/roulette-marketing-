'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { rollPrize, resolveTier } from './gameUtils'
import type { PrizeResult } from '../types'

const BG_SRC = '/characters/bg_default_empty.png'
const CRANE_SRC = '/characters/crane_claw_arm.png'
const DISPLAY_CHARS = [
  '/characters/char_display_mint.png',
  '/characters/char_display_lavender.png',
  '/characters/char_display_peach.png',
  '/characters/char_display_yellow.png',
  '/characters/char_display_gold.png',
] as const

const IMG_W = 941
const IMG_H = 1672
/** 집게 스프라이트(crane_claw_arm.png, 투명 배경)를 배경의 레일 고리 위치에 맞춘 좌표 */
const CLAW_MIN_X = 196
const CLAW_MIN_Y = 396
const CLAW_SRC_W = 210
const CLAW_SRC_H = 337
const CLAW_MAX_X = CLAW_MIN_X + CLAW_SRC_W
const CLAW_MAX_Y = CLAW_MIN_Y + CLAW_SRC_H
const CHAR_Y = 1100
/** 집게 프롱이 인형을 감싸 쥐는 지점(집게 높이 기준 비율) */
const GRIP_Y_RATIO = 0.52
/** 집게 폭 대비 인형 폭 비율 */
const GRIP_CHAR_SCALE = 1.35
const GLASS_LEFT = 170
const GLASS_RIGHT = 770
const RISE_SEC = 2
/** 뽑기 시작 후 좌우로 자동 탐색하는 시간 */
const SEARCH_SEC = 1.5

interface CoverLayout {
  scale: number
  x: number
  y: number
  w: number
  h: number
}

interface Props {
  onResult: (result: PrizeResult) => void
  onLocked?: () => void
  /** 있으면 /api/games/play로 서버 추첨, 없으면(데모 모드) 클라이언트 로컬 추첨 */
  eventId?: string
  /** QA용 — 항상 결과 잠금(onLocked)으로 보낸다. 로그인 게이트(화면 3) 확인용 */
  forceLocked?: boolean
}

/** 서버에서 결과를 받아온다. 실서비스는 locked만 반환하고 당첨액은 세션에만 둔다. */
async function drawResult(eventId?: string): Promise<PrizeResult | 'locked'> {
  if (!eventId) {
    return rollPrize()
  }

  const res = await fetch('/api/games/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: eventId }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `게임 결과 요청 실패 (HTTP ${res.status})`)
  }

  const data = await res.json()
  if (data.locked) return 'locked'

  return {
    tier: resolveTier(data.amount, data.requiresVerification),
    label: data.label,
    amount: data.amount,
    requiresVerification: data.requiresVerification,
    coupon: data.coupon,
  }
}

export default function PlayScreen({ onResult, onLocked, eventId, forceLocked }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<CoverLayout>({ scale: 1, x: 0, y: 0, w: 0, h: 0 })
  const [isAnimating, setIsAnimating] = useState(false)
  const [characterGrabbed, setCharacterGrabbed] = useState(false)
  const clawControls = useAnimation()

  const displaySrc = useMemo(
    () => DISPLAY_CHARS[Math.floor(Math.random() * DISPLAY_CHARS.length)],
    []
  )

  const clawW = CLAW_SRC_W * layout.scale
  const clawH = CLAW_SRC_H * layout.scale
  const restLeft = layout.x + CLAW_MIN_X * layout.scale
  const restTop = layout.y + CLAW_MIN_Y * layout.scale
  const constraints = {
    left: (GLASS_LEFT - CLAW_MIN_X) * layout.scale,
    right: (GLASS_RIGHT - CLAW_MAX_X) * layout.scale,
  }

  useEffect(() => {
    const el = stageRef.current
    if (!el) return

    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      const scale = Math.max(w / IMG_W, h / IMG_H)
      setLayout({
        scale,
        x: (w - IMG_W * scale) / 2,
        y: (h - IMG_H * scale) / 2,
        w,
        h,
      })
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const triggerDrop = useCallback(async () => {
    if (isAnimating) return
    setIsAnimating(true)

    let result: PrizeResult | 'locked'
    try {
      result = await drawResult(eventId)
    } catch (err) {
      console.error('게임 결과 요청 오류:', err)
      alert('오류가 발생했습니다. 다시 시도해주세요.')
      setIsAnimating(false)
      return
    }

    const locked = forceLocked || result === 'locked'
    const isWin = !locked && result !== 'locked' && result.tier !== 'miss'
    const dropY = Math.max(80, (CHAR_Y - CLAW_MAX_Y) * (layout.scale || 1))

    // 좌우로 자동 탐색하다가 매번 다른 랜덤 위치에 멈춘다
    const margin = (constraints.right - constraints.left) * 0.08
    const safeLeft = constraints.left + margin
    const safeRight = constraints.right - margin
    const randomX = safeLeft + Math.random() * (safeRight - safeLeft)

    await clawControls.start({
      x: [0, safeRight, safeLeft, safeRight, safeLeft, randomX],
      transition: {
        duration: SEARCH_SEC,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        ease: 'easeInOut',
      },
    })

    await clawControls.start({
      y: dropY,
      transition: { duration: 0.55, ease: 'easeIn' },
    })

    if (locked || isWin) {
      setCharacterGrabbed(true)
    }
    await new Promise((r) => setTimeout(r, 220))

    await clawControls.start({
      x: 0,
      y: 0,
      transition: { duration: RISE_SEC, ease: 'easeOut' },
    })
    await new Promise((r) => setTimeout(r, 180))

    setCharacterGrabbed(false)
    setIsAnimating(false)
    if (locked) onLocked?.()
    else onResult(result as PrizeResult)
  }, [isAnimating, clawControls, onResult, onLocked, eventId, forceLocked, layout.scale, constraints.left, constraints.right])

  return (
    <div
      ref={stageRef}
      className="relative h-screen w-full select-none overflow-hidden bg-[#EFE6D6]"
    >
      <img
        src={BG_SRC}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />

      <p className="absolute top-[4.5%] left-0 right-0 z-10 text-center text-xs text-[#222222]/45">
        뽑기 시작을 누르면 집게가 자동으로 상품을 찾아요
      </p>

      {layout.w > 0 && (
        <motion.div
          className="absolute z-20"
          style={{
            left: restLeft,
            top: restTop,
            width: clawW,
            height: clawH,
          }}
          animate={clawControls}
        >
          <div className="relative h-full w-full overflow-visible">
            {/* 집게 프롱 사이에 물려 함께 들리는 인형 — 집게보다 뒤(아래)에 그려서 프롱이 감싸 쥔 것처럼 보이게 함 */}
            <AnimatePresence>
              {characterGrabbed && (
                <motion.img
                  key="grabbed"
                  src={displaySrc}
                  alt=""
                  initial={{ opacity: 0, x: '-50%', y: -10, scale: 0.85 }}
                  animate={{ opacity: 1, x: '-50%', y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: '-50%' }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="pointer-events-none absolute left-1/2 z-0"
                  style={{
                    top: `${GRIP_Y_RATIO * 100}%`,
                    width: clawW * GRIP_CHAR_SCALE,
                  }}
                />
              )}
            </AnimatePresence>
            <img
              src={CRANE_SRC}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 z-10 h-full w-full"
            />
          </div>
        </motion.div>
      )}

      <div className="absolute bottom-[7%] left-0 right-0 z-30 px-8">
        <button
          type="button"
          disabled={isAnimating}
          onClick={triggerDrop}
          className="mx-auto block w-full max-w-sm rounded-full bg-orange-500 px-10 py-4 text-lg font-bold text-white transition-colors hover:bg-orange-400 disabled:opacity-60"
        >
          뽑기 시작
        </button>
      </div>

      {isAnimating && <div className="absolute inset-0 z-40" />}
    </div>
  )
}
