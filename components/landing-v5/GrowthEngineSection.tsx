'use client'

import { motion } from 'framer-motion'

type Node = {
  label: string
  tier: 0 | 1 | 2
  isFinal?: boolean
}

const NODES: Node[] = [
  { label: '게임 참여', tier: 0 },
  { label: '데이터 축적', tier: 0 },
  { label: '리워드 재방문', tier: 0 },
  { label: '정교해진 혜택', tier: 1 },
  { label: '재방문 증가', tier: 1 },
  { label: '당근 소식·이벤트로 단골 재호출', tier: 1 },
  { label: '누적 단골 + 신규 유입', tier: 2 },
  { label: '재구매·객단가 상승', tier: 2 },
  { label: '매출 증가', tier: 2, isFinal: true },
]

const TIER_SCALE = [1, 1.15, 1.3]
const TIER_RADIUS = [96, 158, 220]
const ANGLE_START = -160
const ANGLE_STEP = 38
const CX = 300
const CY = 320
const VIEW_W = 600
const VIEW_H = 640

function polar(radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) }
}

const positions = NODES.map((n, i) => ({
  ...n,
  ...polar(TIER_RADIUS[n.tier], ANGLE_START + i * ANGLE_STEP),
  angle: ANGLE_START + i * ANGLE_STEP,
  radius: TIER_RADIUS[n.tier],
}))

function curvePath(a: { x: number; y: number; angle: number; radius: number }, b: { x: number; y: number; angle: number; radius: number }) {
  const midAngle = (a.angle + b.angle) / 2
  const midRadius = ((a.radius + b.radius) / 2) * 1.08
  const ctrl = polar(midRadius, midAngle)
  return `M ${a.x} ${a.y} Q ${ctrl.x} ${ctrl.y} ${b.x} ${b.y}`
}

const TIER_LABELS = ['1회차', '2회차', '3회차']

function tierNodeClass(tier: 0 | 1 | 2, isFinal?: boolean) {
  if (isFinal) return 'bg-dg-gold text-dg-ink border-dg-gold-deep/30'
  if (tier === 0) return 'bg-dg-green-tint text-dg-green-deep border-dg-green/20'
  if (tier === 1) return 'bg-dg-green text-white border-transparent'
  return 'bg-dg-green-deep text-white border-transparent'
}

export default function GrowthEngineSection() {
  return (
    <section className="bg-dg-bg py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">성장 엔진</p>
        <h2 className="mt-3 text-[28px] leading-tight text-dg-ink md:text-[40px]">
          이건 한 번 쓰고 끝나는 이벤트가 아닙니다.
          <br />
          <span className="text-dg-green-deep">돌릴수록 커지는 매출 엔진입니다.</span>
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-dg-ink-soft md:text-[16px]">
          게임 참여 한 번으로 끝나지 않습니다. 손님이 참여할 때마다 방문 데이터가 쌓이고, 그 데이터로 더 정교한 리워드가
          만들어지고, 당근 소식과 이벤트로 기존 단골에게 다시 다가갑니다. 매달, 매 이벤트마다 — 손님도 매출도 늘어날 수밖에
          없는 구조입니다.
        </p>

        {/* 데스크톱: 나선형 다이어그램 */}
        <div className="relative mt-14 hidden md:block">
          <div className="relative mx-auto aspect-[600/640] w-full max-w-[600px]">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <marker id="growth-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#019C87" />
                </marker>
              </defs>
              {positions.slice(0, -1).map((node, i) => {
                const next = positions[i + 1]
                return (
                  <motion.path
                    key={`edge-${i}`}
                    d={curvePath(node, next)}
                    fill="none"
                    stroke="#019C87"
                    strokeWidth={2}
                    strokeOpacity={0.45}
                    strokeDasharray="4 5"
                    markerEnd="url(#growth-arrow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.12 }}
                  />
                )
              })}
            </svg>

            {[0, 1, 2].map((tier) => {
              const first = positions.find((p) => p.tier === tier)!
              const labelPos = polar(TIER_RADIUS[tier] - 34, ANGLE_START + tier * 3 * ANGLE_STEP - 20)
              return (
                <span
                  key={tier}
                  className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-dg-green-deep shadow-sm"
                  style={{ left: `${(labelPos.x / VIEW_W) * 100}%`, top: `${(labelPos.y / VIEW_H) * 100}%` }}
                >
                  {TIER_LABELS[tier]}
                </span>
              )
            })}

            {positions.map((node, i) => (
              <motion.div
                key={node.label}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${(node.x / VIEW_W) * 100}%`,
                  top: `${(node.y / VIEW_H) * 100}%`,
                  transform: `translate(-50%, -50%) scale(${TIER_SCALE[node.tier]})`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: i * 0.12, type: 'spring', stiffness: 220, damping: 18 }}
              >
                <span
                  className={`inline-flex max-w-[132px] items-center justify-center rounded-full border px-3.5 py-2 text-center text-[12.5px] font-bold leading-snug shadow-[0_4px_14px_rgba(0,0,0,0.08)] ${tierNodeClass(node.tier, node.isFinal)}`}
                >
                  {node.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 모바일: 세로 타임라인 */}
        <div className="mt-12 space-y-8 md:hidden">
          {[0, 1, 2].map((tier) => (
            <div key={tier}>
              <span className="inline-flex items-center rounded-full bg-dg-green-tint px-3 py-1 text-[12px] font-bold text-dg-green-deep">
                {TIER_LABELS[tier]}
              </span>
              <div className="mt-3 space-y-2.5">
                {positions
                  .filter((n) => n.tier === tier)
                  .map((node, idx) => (
                    <motion.div
                      key={node.label}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.35, delay: idx * 0.08 }}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={`inline-flex flex-1 items-center rounded-lg border font-bold leading-snug ${tierNodeClass(node.tier, node.isFinal)}`}
                        style={{
                          fontSize: 13 + tier * 1.5,
                          padding: `${10 + tier * 2}px ${14 + tier * 2}px`,
                        }}
                      >
                        {node.label}
                      </span>
                    </motion.div>
                  ))}
              </div>
              {tier < 2 && (
                <div className="mt-3 flex justify-center text-dg-green-deep/60" aria-hidden="true">
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-[12px] text-dg-ink-soft">
          ※ 위 순환 구조는 이해를 돕기 위한 예시이며, 실제 성과는 매장·업종·운영 방식에 따라 달라질 수 있습니다.
        </p>
      </div>
    </section>
  )
}
