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
/** 배경 이미지 상단에 그려진 상호명 명판의 실측 좌표(원본 픽셀 기준).
 *  명판 안의 예시 텍스트("명동찜닭")를 가리고 실제 매장명을 그 위에 표시하기 위함. */
const SIGN_LEFT = 40
const SIGN_RIGHT = 908
const SIGN_TOP = 98
const SIGN_BOTTOM = 315
/** 집게 프롱이 인형을 감싸 쥐는 지점(집게 높이 기준 비율) */
const GRIP_Y_RATIO = 0.52
/** 집게 폭 대비 인형 폭 비율 */
const GRIP_CHAR_SCALE = 1.35
const GLASS_LEFT = 170
const GLASS_RIGHT = 770
/** 캐비닛 내부 배경 연출(빛줄기·비네트·보케·바닥그림자)용 대략 좌표 — 장식용이라 정밀 측정 불필요 */
const GLASS_TOP = 430
const LIGHT_X = (GLASS_LEFT + GLASS_RIGHT) / 2
const LIGHT_Y = 415
const BOKEH_DOTS = [
  { x: 250, y: 560, size: 60, opacity: 0.3 },
  { x: 705, y: 520, size: 46, opacity: 0.24 },
  { x: 335, y: 830, size: 50, opacity: 0.26 },
  { x: 640, y: 860, size: 38, opacity: 0.2 },
] as const
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
  /** 진열장 상단 명판에 표시할 실제 매장명 */
  storeName?: string | null
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

export default function PlayScreen({ onResult, onLocked, eventId, forceLocked, storeName }: Props) {
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
    <div className="relative h-screen w-full select-none overflow-hidden bg-[#EFE6D6]">
      {/* 캐비닛 스테이지 — 좌우 20px 안전 여백 + 상단 세이프 영역 확보 */}
      <div
        ref={stageRef}
        className="absolute left-5 right-5 bottom-0"
        style={{ top: 'max(16px, env(safe-area-inset-top))' }}
      >
        <img
          src={BG_SRC}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* 배경 이미지에 그려진 예시 상호명("명동찜닭")을 가리고 실제 매장명을 표시 */}
        {layout.w > 0 && storeName && (
          <div
            className="pointer-events-none absolute z-10 flex items-center justify-center overflow-hidden rounded-md border-[3px] border-[#C9971F] bg-[#FEEBC8] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]"
            style={{
              left: layout.x + SIGN_LEFT * layout.scale,
              top: layout.y + SIGN_TOP * layout.scale,
              width: (SIGN_RIGHT - SIGN_LEFT) * layout.scale,
              height: (SIGN_BOTTOM - SIGN_TOP) * layout.scale,
              borderWidth: Math.max(1, 3 * layout.scale),
            }}
          >
            <span
              className="truncate px-2 font-extrabold text-[#3A2A18]"
              style={{ fontSize: Math.max(12, 58 * layout.scale) }}
            >
              {storeName}
            </span>
          </div>
        )}

        {/* 캐비닛 내부 배경 연출 — 은은한 조명 빔 + 비네트 + 보케 + 바닥 그림자 (전부 장식용, 클릭 불가) */}
        {layout.w > 0 && (
          <>
            {/* 조명 빔: 천장 조명에서 아래로 부드럽게 퍼지는 빛 */}
            <div
              className="pointer-events-none absolute z-[4]"
              style={{
                left: layout.x + (LIGHT_X - 260) * layout.scale,
                top: layout.y + LIGHT_Y * layout.scale,
                width: 520 * layout.scale,
                height: (CHAR_Y - LIGHT_Y) * layout.scale,
                background: 'radial-gradient(ellipse at 50% 0%, rgba(255,248,225,0.5), rgba(255,248,225,0) 68%)',
                mixBlendMode: 'screen',
              }}
            />
            {/* 보케 반짝임 — 캐릭터 무리 뒤 배경에 아주 옅게 */}
            {BOKEH_DOTS.map((dot, i) => (
              <div
                key={i}
                className="pointer-events-none absolute z-[3] rounded-full"
                style={{
                  left: layout.x + (dot.x - dot.size / 2) * layout.scale,
                  top: layout.y + (dot.y - dot.size / 2) * layout.scale,
                  width: dot.size * layout.scale,
                  height: dot.size * layout.scale,
                  opacity: dot.opacity,
                  filter: 'blur(5px)',
                  background: 'radial-gradient(circle, rgba(255,241,199,0.95), rgba(255,241,199,0) 70%)',
                }}
              />
            ))}
            {/* 바닥 그림자/반사 — 캐릭터들이 바닥을 딛고 있는 입체감 */}
            <div
              className="pointer-events-none absolute z-[4]"
              style={{
                left: layout.x + (GLASS_LEFT + 40) * layout.scale,
                top: layout.y + (CHAR_Y + 70) * layout.scale,
                width: (GLASS_RIGHT - GLASS_LEFT - 80) * layout.scale,
                height: 70 * layout.scale,
                filter: 'blur(5px)',
                background: 'radial-gradient(ellipse at center, rgba(60,40,20,0.28), rgba(60,40,20,0) 75%)',
              }}
            />
            {/* 방사형 비네트 — 가장자리를 살짝 어둡게 해 중앙(크레인·캐릭터)에 시선 집중 */}
            <div
              className="pointer-events-none absolute z-[4]"
              style={{
                left: layout.x + GLASS_LEFT * layout.scale,
                top: layout.y + GLASS_TOP * layout.scale,
                width: (GLASS_RIGHT - GLASS_LEFT) * layout.scale,
                height: (CHAR_Y + 140 - GLASS_TOP) * layout.scale,
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(35,22,8,0.16) 100%)',
              }}
            />
          </>
        )}

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
      </div>

      {/* 하단 안내문구 + 버튼 — 스테이지와 동일한 좌우 20px 여백 */}
      <div
        className="absolute left-5 right-5 bottom-0 z-30"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        <p className="mb-2.5 text-center text-xs font-semibold text-[#222222]/70">
          뽑기 시작을 누르면 집게가 자동으로 상품을 찾아요
        </p>
        <motion.button
          type="button"
          disabled={isAnimating}
          onClick={triggerDrop}
          className="mx-auto block w-full max-w-sm rounded-full bg-[#00C7A7] px-10 py-4 text-lg font-bold text-white transition-colors hover:bg-[#00B399] disabled:opacity-60"
          animate={
            !isAnimating
              ? {
                  scale: [1, 1.015, 1],
                  boxShadow: [
                    '0 0 0px 0px rgba(0,199,167,0)',
                    '0 0 18px 6px rgba(0,199,167,0.4)',
                    '0 0 0px 0px rgba(0,199,167,0)',
                  ],
                }
              : { scale: 1, boxShadow: '0 0 0px 0px rgba(0,199,167,0)' }
          }
          transition={
            !isAnimating
              ? { duration: 2.75, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2 }
          }
        >
          뽑기 시작
        </motion.button>
      </div>

      {isAnimating && <div className="absolute inset-0 z-40" />}
    </div>
  )
}
