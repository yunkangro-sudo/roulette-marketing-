'use client'

import { useMemo, useState } from 'react'
import { ROI_ASSUMPTIONS, formatWon } from '@/lib/landing-v5/config'

/** "데이터로 증명" 섹션 하단에 이어붙는 손익 계산 블록.
 *  PC에서는 항상 펼쳐져 있고, 모바일에서는 "직접 계산해보기" 버튼을 눌러야 펼쳐진다
 *  (모바일에서 섹션이 과도하게 길어져 스크롤 피로감을 주는 것을 방지). */
export default function RoiCalculator() {
  const { sliderMin, sliderMax, sliderStep, sliderDefault, exampleGuests } = ROI_ASSUMPTIONS
  const [dailyGuests, setDailyGuests] = useState<number>(sliderDefault)
  const [expanded, setExpanded] = useState(false)

  const live = useMemo(() => calc(dailyGuests), [dailyGuests])
  const example = useMemo(() => calc(exampleGuests), [exampleGuests])

  return (
    <>
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-2 border border-dg-line bg-white py-4 text-[15px] font-semibold text-dg-ink-soft transition hover:border-dg-green-deep hover:text-dg-green-deep lg:hidden"
          style={{ borderRadius: 6 }}
        >
          우리 매장은 얼마나 남을지 직접 계산해보기
          <span aria-hidden>↓</span>
        </button>
      )}

      <div className={expanded ? 'block' : 'hidden lg:block'}>
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="border border-dg-line bg-white p-6 md:p-8" style={{ borderRadius: 6 }}>
            <p className="text-[13px] font-semibold text-dg-ink-soft">
              하루 게임 참여 {exampleGuests}명 기준, 한 달 예상
            </p>
            <ul className="mt-6 space-y-4 text-[15px]">
              <li className="flex items-start justify-between gap-4">
                <span>한 달 재방문한 손님</span>
                <span className="font-num font-semibold">{example.revisits.toLocaleString('ko-KR')}명</span>
              </li>
              <li className="flex items-start justify-between gap-4 text-dg-danger">
                <span>그 {example.revisits.toLocaleString('ko-KR')}명에게 나간 비용</span>
                <span className="font-num">-{formatWon(example.cost)}</span>
              </li>
              <li className="flex items-start justify-between gap-4">
                <span>재방문 손님이 매장에서 쓴 돈</span>
                <span className="font-num text-dg-green-deep">+{formatWon(example.revenue)}</span>
              </li>
            </ul>
            <div className="mt-6 border-t border-dg-line pt-5">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold">재방문으로 인한 예상 추가 매출</span>
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
            <p className="text-[13px] font-semibold text-white/55">단골 추가 매출 예상</p>
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
              <Row label="월 예상 재방문 손님" value={`${live.revisits.toLocaleString('ko-KR')}명`} />
              <Row label="월 예상 혜택 비용" value={formatWon(live.cost)} muted />
              <Row label="월 예상 재방문 매출" value={formatWon(live.revenue)} />
              <div className="border-t border-white/10 pt-4">
                <Row label="재방문으로 인한 예상 추가 매출" value={formatWon(live.profit)} accent />
              </div>
            </dl>

            <p className="mt-6 text-[12px] leading-relaxed text-white/40">
              재방문율 {(ROI_ASSUMPTIONS.revisitRate * 100).toFixed(0)}%, 1인당 평균 혜택{' '}
              {formatWon(ROI_ASSUMPTIONS.benefitPerGuest)}, 평균 결제 {formatWon(ROI_ASSUMPTIONS.spendPerGuest)},
              한 달 {ROI_ASSUMPTIONS.daysPerMonth}일 운영 가정
            </p>
          </article>
        </div>
      </div>
    </>
  )
}

/** dailyGuests(하루 평균 손님 수) 기준으로 한 달(daysPerMonth) 예상 손익을 계산한다. */
function calc(dailyGuests: number) {
  const dailyRevisits = Math.round(dailyGuests * ROI_ASSUMPTIONS.revisitRate)
  const dailyCost = dailyRevisits * ROI_ASSUMPTIONS.benefitPerGuest
  const dailyRevenue = dailyRevisits * ROI_ASSUMPTIONS.spendPerGuest
  const days = ROI_ASSUMPTIONS.daysPerMonth

  return {
    revisits: dailyRevisits * days,
    cost: dailyCost * days,
    revenue: dailyRevenue * days,
    profit: (dailyRevenue - dailyCost) * days,
  }
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
