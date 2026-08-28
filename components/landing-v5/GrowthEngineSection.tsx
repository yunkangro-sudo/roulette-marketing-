'use client'

import { motion } from 'framer-motion'
import { Repeat } from 'lucide-react'

type Round = {
  label: string
  steps: string[]
}

const ROUNDS: Round[] = [
  { label: '1회차', steps: ['게임 참여', '데이터 축적', '리워드 재방문'] },
  { label: '2회차', steps: ['정교해진 혜택', '재방문 증가', '당근 소식·이벤트로 단골 재호출'] },
  { label: '3회차', steps: ['누적 단골 + 신규 유입', '재구매·객단가 상승', '매출 증가'] },
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
const TIER_CHIP_CLASS = [
  'border border-dg-green/25 bg-white text-dg-ink',
  'border border-transparent bg-white text-dg-ink',
  'border border-transparent bg-white text-dg-ink',
]
const TIER_ARROW_CLASS = ['text-dg-green-deep/50', 'text-white/70', 'text-white/70']
const TIER_CAPTION = ['가장 작게 시작합니다', '데이터가 쌓이면서 커집니다', '누적된 단골이 매출로 이어집니다']
const TIER_CAPTION_CLASS = ['text-dg-ink-soft', 'text-white/70', 'text-white/70']
const TIER_SCALE = [
  { pad: 'p-5 md:p-6', chip: 'px-3 py-2 text-[13px] md:text-[13.5px]', gap: 'gap-2' },
  { pad: 'p-6 md:p-7', chip: 'px-3.5 py-2.5 text-[13.5px] md:text-[14.5px]', gap: 'gap-2.5' },
  { pad: 'p-7 md:p-8', chip: 'px-4 py-3 text-[14px] md:text-[15.5px]', gap: 'gap-3' },
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
            이건 한 번 쓰고 끝나는 이벤트가 아닙니다.
            <br />
            <span className="text-dg-green-deep">돌릴수록 커지는 매출 엔진입니다.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-dg-ink-soft md:text-[16px]">
            게임 참여 한 번으로 끝나지 않습니다. 손님이 참여할 때마다 방문 데이터가 쌓이고, 그 데이터로 더 정교한 리워드가
            만들어지고, 당근 소식과 이벤트로 기존 단골에게 다시 다가갑니다. 매달, 매 이벤트마다 — 손님도 매출도 늘어날 수밖에
            없는 구조입니다.
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
                    <div className={`mt-4 flex flex-wrap items-center ${scale.gap}`}>
                      {round.steps.map((step, i) => {
                        const isFinalStep = isFinalRound && i === round.steps.length - 1
                        return (
                          <div key={step} className="flex items-center gap-2.5">
                            <span
                              className={`font-bold leading-snug ${scale.chip} ${
                                isFinalStep
                                  ? 'border border-transparent bg-dg-gold text-dg-ink'
                                  : TIER_CHIP_CLASS[tier]
                              }`}
                              style={{ borderRadius: 6 }}
                            >
                              {step}
                            </span>
                            {i < round.steps.length - 1 && (
                              <span className={TIER_ARROW_CLASS[tier]} aria-hidden="true">
                                →
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <p className={`mt-4 text-[13px] ${TIER_CAPTION_CLASS[tier]}`}>{TIER_CAPTION[tier]}</p>
                  </motion.article>

                  {tier < ROUNDS.length - 1 && (
                    <div className="flex justify-center py-2" aria-hidden="true">
                      <span className="text-[18px] leading-none text-dg-green-deep/50">↓</span>
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
            <p className="text-[14px] leading-relaxed text-dg-ink-soft">
              그리고 다음 달, 이 순환이 <span className="font-bold text-dg-ink">더 큰 1회차</span>로 다시 시작됩니다.
            </p>
          </motion.div>

          <p className="mt-6 text-[12px] text-dg-ink-soft">
            ※ 위 순환 구조는 이해를 돕기 위한 예시이며, 실제 성과는 매장·업종·운영 방식에 따라 달라질 수 있습니다.
          </p>
        </div>
      </div>
    </section>
  )
}
