'use client'

import { motion } from 'framer-motion'
import { Repeat, ChevronDown } from 'lucide-react'

type Round = {
  label: string
  steps: string[]
}

const ROUNDS: Round[] = [
  { label: '1회차', steps: ['게임 참여', '데이터 축적', '리워드 재방문'] },
  { label: '2회차', steps: ['재방문 참여', '단골 증가', '당근·카카오 단골 자산 축적'] },
  { label: '3회차', steps: ['누적 단골', '재구매·재방문 상승', '매출 증가'] },
]

const TIER_CARD_CLASS = [
  'border border-dg-green/25 bg-dg-green-tint',
  'border border-transparent bg-dg-green',
  'border border-transparent bg-dg-green-deep',
]
const TIER_BADGE_CLASS = [
  'bg-white text-dg-green-deep',
  'bg-dg-ink/90 text-white',
  'bg-dg-ink text-white',
]
const TIER_STEP_TEXT_CLASS = ['text-dg-ink', 'text-white', 'text-white']
const TIER_ARROW_CLASS = ['text-dg-green-deep/40', 'text-white/50', 'text-white/50']
const TIER_FINAL_STEP_CLASS = ['text-dg-green-deep', 'text-dg-ink', 'text-dg-gold']
const TIER_CAPTION = ['가장 작게 시작합니다', '데이터가 쌓이면서 커집니다', '누적된 단골이 매출로 이어집니다']
const TIER_CAPTION_CLASS = ['text-dg-ink-soft', 'text-white/70', 'text-white/70']
const TIER_SCALE = [
  { pad: 'p-6 md:p-8', text: 'text-[15px] md:text-[17px]', gap: 'gap-x-2.5 gap-y-3' },
  { pad: 'p-7 md:p-9', text: 'text-[16px] md:text-[18px]', gap: 'gap-x-3 gap-y-3' },
  { pad: 'p-8 md:p-10', text: 'text-[17px] md:text-[19px]', gap: 'gap-x-3 gap-y-3' },
]

export default function GrowthEngineSection() {
  return (
    <section className="bg-dg-green-tint py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5">
        <div
          className="rounded-[24px] border border-dg-green/15 bg-white p-6 shadow-[0_24px_56px_rgba(1,156,135,0.10)] sm:p-10 md:p-14"
        >
          <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">성장 엔진</p>
          <h2 className="mt-3 text-[28px] leading-tight text-dg-ink md:text-[40px]">
            한 번의 이벤트가,
            <br />
            <span className="text-dg-green-deep">다음 방문을 계속 만듭니다.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-dg-ink-soft md:text-[16px]">
            손님이 게임에 참여하고,
            <br />
            다시 방문하면서 데이터와 단골이 쌓입니다.
            <br />
            그리고 그 경험이 다음 이벤트와 재방문으로 이어집니다.
          </p>

          <div className="mt-12 space-y-0">
            {ROUNDS.map((round, tier) => {
              const scale = TIER_SCALE[tier]
              const isFinalRound = tier === ROUNDS.length - 1
              return (
                <div key={round.label}>
                  <motion.article
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.45, delay: tier * 0.1 }}
                    className={`${scale.pad} ${TIER_CARD_CLASS[tier]}`}
                    style={{ borderRadius: 10 }}
                  >
                    <span
                      className={`inline-flex w-fit items-center px-3 py-1.5 text-[13px] font-extrabold ${TIER_BADGE_CLASS[tier]}`}
                      style={{ borderRadius: 999 }}
                    >
                      {round.label}
                    </span>
                    {/* 버튼(칩) 대신 텍스트 + 화살표만으로 흐름을 표현 — 정보 밀도를 낮춰 한눈에 읽히게 함 */}
                    <div className={`mt-5 flex flex-wrap items-center ${scale.gap}`}>
                      {round.steps.map((step, i) => {
                        const isFinalStep = isFinalRound && i === round.steps.length - 1
                        return (
                          <div key={step} className="flex items-center gap-2.5">
                            <span
                              className={`font-bold leading-snug ${scale.text} ${
                                isFinalStep ? TIER_FINAL_STEP_CLASS[tier] : TIER_STEP_TEXT_CLASS[tier]
                              }`}
                            >
                              {step}
                            </span>
                            {i < round.steps.length - 1 && (
                              <span className={`text-[15px] ${TIER_ARROW_CLASS[tier]}`} aria-hidden="true">
                                →
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <p className={`mt-5 text-[13px] ${TIER_CAPTION_CLASS[tier]}`}>{TIER_CAPTION[tier]}</p>
                  </motion.article>

                  {tier < ROUNDS.length - 1 && (
                    <div className="flex justify-center py-3" aria-hidden="true">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-dg-green-tint text-dg-green-deep">
                        <ChevronDown size={20} strokeWidth={2.5} />
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="mt-6 flex items-center gap-3 border border-dg-line bg-dg-bg px-5 py-4"
            style={{ borderRadius: 10 }}
          >
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dg-green-tint text-dg-green-deep"
              aria-hidden="true"
            >
              <Repeat size={18} strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-[14px] leading-relaxed text-dg-ink-soft">
                그리고 <span className="font-bold text-dg-ink">다음 이벤트</span>에서, 쌓인 단골을 기반으로 다시
                시작됩니다.
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-dg-ink-soft/70">
                방문 → 참여 → 데이터 → 단골 → 재방문 → 다시 성장
              </p>
            </div>
          </motion.div>

          <p className="mt-6 text-[12px] text-dg-ink-soft">
            ※ 위 순환 구조는 이해를 돕기 위한 예시이며, 실제 성과는 매장·업종·운영 방식에 따라 달라질 수 있습니다.
          </p>
        </div>
      </div>
    </section>
  )
}
