'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { motion, animate, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
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
/** 좌우 세이프 여백(px) — 매장명 헤더/캐비닛/버튼 영역이 모두 이 기준선에 맞춰 정렬된다 */
const STAGE_MARGIN = 20
/** 캐비닛 아래 버튼 전용 여백 높이(px, safe-area-inset-bottom은 별도 가산) —
 *  버튼이 캐비닛 이미지 위에 겹쳐 뜨지 않고 독립된 공간에서 문구+버튼이 수직 중앙 정렬되도록 확보 */
const FOOTER_H = 118

/** 상단 레일 마운트 ~ 집게 사이를 잇는 코일형 케이블 path를 생성한다.
 *  길이(length)가 늘어날수록 지그재그 반복 횟수도 비례해서 늘어나
 *  "코일이 늘어나는" 느낌을 낸다. cx는 코일의 중심 x좌표(로컬 좌표계). */
function makeCoilPath(length: number, cx: number, amplitude: number, period: number): string {
  const len = Math.max(0, length)
  if (len < 2) return `M ${cx} 0 L ${cx} ${len}`

  const segments = Math.max(2, Math.round(len / period))
  const step = len / segments
  let d = `M ${cx} 0`
  for (let i = 1; i <= segments; i++) {
    const y = step * i
    const midY = y - step / 2
    const side = i % 2 === 0 ? 1 : -1
    d += ` Q ${cx + side * amplitude} ${midY} ${cx} ${y}`
  }
  return d
}

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
  /** 크레인의 현재 이동값(정지 위치 기준 오프셋, 화면 px) — 케이블 SVG가 이 값을
   *  실시간으로 구독해 리렌더 없이 매 프레임 다시 그려지도록 useAnimation 대신 사용 */
  const clawX = useMotionValue(0)
  const clawY = useMotionValue(0)

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

  /** 케이블 코일 스타일 — 집게(clawW) 대비 확연히 가늘게 */
  const cableAmplitude = Math.max(2, clawW * 0.05)
  const cablePeriod = Math.max(10, clawW * 0.16)
  const cableCx = clawW * 0.15
  const cableBoxWidth = clawW * 0.3
  const cablePathD = useTransform(clawY, (y) =>
    makeCoilPath(y, cableCx, cableAmplitude, cablePeriod)
  )

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

    await animate(clawX, [0, safeRight, safeLeft, safeRight, safeLeft, randomX], {
      duration: SEARCH_SEC,
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
      ease: 'easeInOut',
    })

    await animate(clawY, dropY, { duration: 0.55, ease: 'easeIn' })

    if (locked || isWin) {
      setCharacterGrabbed(true)
    }
    await new Promise((r) => setTimeout(r, 220))

    await Promise.all([
      animate(clawX, 0, { duration: RISE_SEC, ease: 'easeOut' }),
      animate(clawY, 0, { duration: RISE_SEC, ease: 'easeOut' }),
    ])
    await new Promise((r) => setTimeout(r, 180))

    setCharacterGrabbed(false)
    setIsAnimating(false)
    if (locked) onLocked?.()
    else onResult(result as PrizeResult)
  }, [isAnimating, clawX, clawY, onResult, onLocked, eventId, forceLocked, layout.scale, constraints.left, constraints.right])

  return (
    <div className="relative h-screen w-full select-none overflow-hidden bg-[#EFE6D6]">
      {/* 캐비닛 스테이지 — 좌우/상단 세이프 여백 확보, 하단은 FOOTER_H만큼 띄워서
          버튼 영역과 겹치지 않는 독립된 카드로 분리. rounded + shadow로 "떠 있는" 카드 느낌 부여.
          overflow-hidden 필수: 명판 등 장식 오버레이가 카드 바깥으로 삐져나오지 않도록 경계에서 잘라낸다 */}
      <div
        ref={stageRef}
        className="absolute overflow-hidden rounded-[22px] shadow-[0_18px_36px_-14px_rgba(70,48,14,0.4)]"
        style={{
          left: STAGE_MARGIN,
          right: STAGE_MARGIN,
          top: 'max(16px, env(safe-area-inset-top))',
          bottom: `calc(${FOOTER_H}px + max(14px, env(safe-area-inset-bottom)))`,
        }}
      >
        <img
          src={BG_SRC}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* 배경 이미지에 그려진 예시 상호명("명동찜닭")을 가리고 실제 매장명을 표시.
            딱딱한 박스 테두리 대신 하단 얇은 골드 라인 하나로만 캐비닛 영역과 자연스럽게 구분 */}
        {layout.w > 0 && storeName && (
          <div
            className="pointer-events-none absolute z-10 flex items-center justify-center overflow-hidden bg-[#FFF6E7]"
            style={{
              left: layout.x + SIGN_LEFT * layout.scale,
              top: layout.y + SIGN_TOP * layout.scale,
              width: (SIGN_RIGHT - SIGN_LEFT) * layout.scale,
              height: (SIGN_BOTTOM - SIGN_TOP) * layout.scale,
              borderBottom: `${Math.max(1, 2 * layout.scale)}px solid #D8AF55`,
            }}
          >
            <span
              className="truncate px-2 font-extrabold text-[#3A2A18]"
              style={{ fontSize: Math.max(12, 56 * layout.scale), letterSpacing: Math.max(0.5, 2.2 * layout.scale) }}
            >
              {storeName}
            </span>
          </div>
        )}

        {/* 캐비닛 내부 배경 연출 — 은은한 조명 빔 + 비네트 + 보케 + 바닥 그림자 (전부 장식용, 클릭 불가) */}
        {layout.w > 0 && (
          <>
            {/* 조명 빔: 천장 조명에서 아래로 부드럽게 퍼지는 빛
                — 사각 경계가 눈에 보이지 않도록 여유 폭 + blur로 가장자리를 완전히 흐린다 */}
            <div
              className="pointer-events-none absolute z-[4]"
              style={{
                left: layout.x + (LIGHT_X - 300) * layout.scale,
                top: layout.y + (LIGHT_Y - 20) * layout.scale,
                width: 600 * layout.scale,
                height: (CHAR_Y - LIGHT_Y + 20) * layout.scale,
                background: 'radial-gradient(ellipse at 50% 0%, rgba(255,248,225,0.45), rgba(255,248,225,0) 55%)',
                mixBlendMode: 'screen',
                filter: 'blur(14px)',
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
                background: 'radial-gradient(ellipse at center, rgba(60,40,20,0.34), rgba(60,40,20,0) 75%)',
              }}
            />
            {/* 방사형 비네트 — 가장자리를 살짝 어둡게 해 중앙(크레인·캐릭터)에 시선 집중
                — 유리 안쪽 경계선 바로 위에 사각 경계가 겹쳐 보이지 않도록 여유 있게 넓히고 blur로 마무리 */}
            <div
              className="pointer-events-none absolute z-[4]"
              style={{
                left: layout.x + (GLASS_LEFT - 40) * layout.scale,
                top: layout.y + (GLASS_TOP - 30) * layout.scale,
                width: (GLASS_RIGHT - GLASS_LEFT + 80) * layout.scale,
                height: (CHAR_Y + 170 - GLASS_TOP) * layout.scale,
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 62%, rgba(35,22,8,0.14) 100%)',
                filter: 'blur(10px)',
              }}
            />
          </>
        )}

        {layout.w > 0 && (
          <>
            {/* 크레인 케이블 — 천장 레일 마운트(고정 y, 크레인을 따라 좌우로만 이동)와
                집게 사이를 잇는 코일형 케이블. 하강 시 길이가, 좌우 탐색 시 x위치만 따라간다 */}
            <motion.svg
              className="pointer-events-none absolute z-[19] overflow-visible"
              style={{
                left: restLeft + clawW / 2 - cableBoxWidth / 2,
                top: restTop,
                width: cableBoxWidth,
                height: 1,
                x: clawX,
              }}
            >
              <defs>
                <linearGradient id="cableGoldGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#9C6B10" />
                  <stop offset="45%" stopColor="#F0C868" />
                  <stop offset="55%" stopColor="#F0C868" />
                  <stop offset="100%" stopColor="#8A5D0C" />
                </linearGradient>
              </defs>
              <motion.path
                d={cablePathD}
                stroke="url(#cableGoldGrad)"
                strokeWidth={Math.max(1.5, clawW * 0.035)}
                fill="none"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 1px 1px rgba(60,40,10,0.35))' }}
              />
            </motion.svg>

            <motion.div
              className="absolute z-20"
              style={{
                left: restLeft,
                top: restTop,
                width: clawW,
                height: clawH,
                x: clawX,
                y: clawY,
              }}
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
          </>
        )}
      </div>

      {/* 하단 버튼 + 안내문구 — 캐비닛과 겹치지 않는 독립된 여백(FOOTER_H) 안에서 수직 중앙 정렬.
          안내문구를 버튼 위 캡션으로 두어 하나의 세트로 묶는다 */}
      <div
        className="absolute bottom-0 z-30 flex flex-col justify-center"
        style={{
          left: STAGE_MARGIN,
          right: STAGE_MARGIN,
          height: `calc(${FOOTER_H}px + max(14px, env(safe-area-inset-bottom)))`,
          paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
        }}
      >
        <p className="mb-2.5 text-center text-xs font-semibold text-[#222222]/70">
          뽑기 시작을 누르면 집게가 자동으로 상품을 찾아요
        </p>
        <motion.button
          type="button"
          disabled={isAnimating}
          onClick={triggerDrop}
          className="mx-auto block w-full max-w-[300px] rounded-full bg-[#00C7A7] px-8 py-3.5 text-lg font-bold tracking-tight text-white transition-colors hover:bg-[#00B399] disabled:opacity-60"
          animate={
            !isAnimating
              ? {
                  boxShadow: [
                    '0 0 0px 0px rgba(0,199,167,0)',
                    '0 0 22px 7px rgba(0,199,167,0.4)',
                    '0 0 0px 0px rgba(0,199,167,0)',
                  ],
                }
              : { boxShadow: '0 0 0px 0px rgba(0,199,167,0)' }
          }
          transition={
            !isAnimating
              ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
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
