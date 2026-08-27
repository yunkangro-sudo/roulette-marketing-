'use client'

import { useMemo, useState } from 'react'
import { ROI_ASSUMPTIONS, formatWon } from '@/lib/landing-v5/config'

export default function RoiCalculator() {
  const { sliderMin, sliderMax, sliderStep, sliderDefault, exampleGuests } = ROI_ASSUMPTIONS
  const [dailyGuests, setDailyGuests] = useState<number>(sliderDefault)

  const live = useMemo(() => calc(dailyGuests), [dailyGuests])
  const example = useMemo(() => calc(exampleGuests), [exampleGuests])

  return (
    <section id="profit" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">매장 손익</p>
        <h2 className="mt-3 max-w-3xl text-[32px] leading-tight text-dg-ink md:text-[44px]">
          손님이 다시 오면,
          <br />
          계산이 달라집니다
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="border border-dg-line bg-white p-6 md:p-8" style={{ borderRadius: 6 }}>
            <p className="text-[13px] font-semibold text-dg-ink-soft">
              게임 참여 {exampleGuests}명 기준 예시
            </p>
            <ul className="mt-6 space-y-4 text-[15px]">
              <li className="flex items-start justify-between gap-4">
                <span>재방문한 손님</span>
                <span className="font-num font-semibold">{example.revisits}명</span>
              </li>
              <li className="flex items-start justify-between gap-4 text-dg-danger">
                <span>그 {example.revisits}명에게 나간 비용</span>
                <span className="font-num">-{formatWon(example.cost)}</span>
              </li>
              <li className="flex items-start justify-between gap-4">
                <span>재방문 손님이 매장에서 쓴 돈</span>
                <span className="font-num text-dg-green-deep">+{formatWon(example.revenue)}</span>
              </li>
            </ul>
            <div className="mt-6 border-t border-dg-line pt-5">
              <div className="flex items-center justify-between">
                <span className="font-semibold">이번 이벤트로 실제로 남은 이익</span>
                <span className="font-num text-[28px] font-bold text-dg-green-deep">
                  +{formatWon(example.profit)}
                </span>
              </div>
            </div>
            <p className="mt-6 text-[13px] leading-relaxed text-dg-ink-soft">
              손님이 안 오면 매장은 한 푼도 안 씁니다. 혜택이 나가는 순간은, 이미 손님이 돈을 쓴 뒤입니다.
            </p>
          </article>

          <article className="border border-white/10 bg-[#171717] p-6 text-white md:p-8" style={{ borderRadius: 6 }}>
            <p className="text-[13px] font-semibold text-white/55">우리 매장 예상 손익</p>
            <label className="mt-6 block">
              <span className="text-[14px] text-white/70">우리 매장 하루 평균 손님 수</span>
              <div className="mt-3 flex items-end justify-between">
                <span className="font-num text-[42px] font-bold leading-none text-dg-green">{dailyGuests}</span>
                <span className="pb-1 text-[13px] text-white/45">명</span>
              </div>
              <input
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                value={dailyGuests}
                onChange={(e) => setDailyGuests(Number(e.target.value))}
                className="mt-5"
              />
            </label>

            <dl className="mt-8 space-y-4 text-[15px]">
              <Row label="예상 재방문 손님" value={`${live.revisits}명`} />
              <Row label="예상 혜택 비용" value={formatWon(live.cost)} muted />
              <Row label="예상 재방문 매출" value={formatWon(live.revenue)} />
              <div className="border-t border-white/10 pt-4">
                <Row label="예상 순이익" value={formatWon(live.profit)} accent />
              </div>
            </dl>

            <p className="mt-6 text-[12px] leading-relaxed text-white/40">
              재방문율 {(ROI_ASSUMPTIONS.revisitRate * 100).toFixed(0)}%, 1인당 평균 혜택 {formatWon(ROI_ASSUMPTIONS.benefitPerGuest)}, 평균 결제 {formatWon(ROI_ASSUMPTIONS.spendPerGuest)} 가정
            </p>
          </article>
        </div>

        <p className="mt-6 text-[12px] text-dg-ink-soft">
          ※ 위 수치는 이해를 돕기 위한 예시 데이터이며, 실제 성과는 매장·업종 조건에 따라 달라질 수 있습니다.
        </p>
      </div>
    </section>
  )
}

function calc(dailyGuests: number) {
  const revisits = Math.round(dailyGuests * ROI_ASSUMPTIONS.revisitRate)
  const cost = revisits * ROI_ASSUMPTIONS.benefitPerGuest
  const revenue = revisits * ROI_ASSUMPTIONS.spendPerGuest
  return { revisits, cost, revenue, profit: revenue - cost }
}

function Row({
  label,
  value,
  muted,
  accent,
}: {
  label: string
  value: string
  muted?: boolean
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-white/65">{label}</dt>
      <dd
        className={`font-num ${
          accent ? 'text-[22px] text-dg-green' : muted ? 'text-white/50' : 'text-white'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
