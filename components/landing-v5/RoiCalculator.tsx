'use client'

import { useMemo, useState } from 'react'
import { MessageCircle, HeartHandshake, Search, Star } from 'lucide-react'
import { ROI_ASSUMPTIONS, ROI_EXAMPLE_ASSUMPTIONS, ROI_INTERACTIVE_ASSUMPTIONS, formatWon } from '@/lib/landing-v5/config'

/** 경품(쿠폰) 하나가 나갈 때 매장이 함께 얻는 4가지 부수 효과 — 두 비교 카드 바로 아래
 *  강조 배너에서 보여준다. 손익 계산만으로는 안 보이는 "채널·신뢰 자산"을 짚어준다. */
const BENEFIT_ITEMS = [
  {
    icon: MessageCircle,
    title: '카카오 친구 추가',
    body: '손님에게 매번 다시 알릴 수 있는 우리 매장 전용 채널이 하나 생깁니다',
  },
  {
    icon: HeartHandshake,
    title: '당근 단골 추가',
    body: '동네 안에서 우리 매장의 존재감과 신뢰도가 함께 쌓입니다',
  },
  {
    icon: Search,
    title: '네이버 후기',
    body: '처음 검색하는 손님이 매장을 선택하는 바로 그 순간에 나타납니다',
  },
  {
    icon: Star,
    title: '당근마켓 후기',
    body: '"실제로 가본 이웃이 인증한 매장"이라는 신뢰를 동네에 남깁니다',
  },
] as const

/** "데이터로 증명" 섹션 하단에 이어붙는 손익 계산 블록. PC/모바일 모두 항상 펼쳐서 보여준다. */
export default function RoiCalculator() {
  const { sliderMin, sliderMax, sliderStep, sliderDefault, exampleGuests } = ROI_ASSUMPTIONS
  const [dailyGuests, setDailyGuests] = useState<number>(sliderDefault)

  const live = useMemo(() => calc(dailyGuests, ROI_INTERACTIVE_ASSUMPTIONS), [dailyGuests])
  const example = useMemo(() => calc(exampleGuests, ROI_EXAMPLE_ASSUMPTIONS), [exampleGuests])

  return (
    <div>
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
            <span className="font-num text-[48px] font-bold leading-none text-dg-green md:text-[52px]">
              {dailyGuests}
            </span>
            <span className="pb-1.5 text-[13px] text-white/45">명</span>
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
          <div className="mt-2 flex items-center justify-between text-[11px] text-white/35">
            {ROI_ASSUMPTIONS.sliderHints.map((hint) => (
              <span key={hint}>{hint.toLocaleString('ko-KR')}명</span>
            ))}
          </div>
        </label>
        <p className="mt-3 text-center text-[12px] text-white/40">
          ← 손님 수를 직접 조절해보세요 →
        </p>

        <dl className="mt-8 space-y-4 text-[15px]">
          <Row label="월 예상 재방문 손님" value={`${live.revisits.toLocaleString('ko-KR')}명`} />
          <Row label="월 예상 혜택 비용" value={formatWon(live.cost)} muted />
          <Row label="월 예상 재방문 매출" value={formatWon(live.revenue)} />
          <div className="border-t border-white/10 pt-4">
            <Row label="재방문으로 인한 예상 추가 매출" value={formatWon(live.profit)} accent />
          </div>
        </dl>

        <p className="mt-6 text-[12px] leading-relaxed text-white/40">
          재방문율 {(ROI_INTERACTIVE_ASSUMPTIONS.revisitRate * 100).toFixed(0)}%, 1인당 평균 혜택{' '}
          {formatWon(ROI_INTERACTIVE_ASSUMPTIONS.benefitPerGuest)}, 평균 결제{' '}
          {formatWon(ROI_INTERACTIVE_ASSUMPTIONS.spendPerGuest)}, 한 달 {ROI_ASSUMPTIONS.daysPerMonth}일 운영 가정
        </p>
      </article>
    </div>

    {/* 손익 계산만으로는 안 보이는 부수 효과 강조 — 두 비교 카드 바로 아래 이어붙인다 */}
    <div className="mt-8 border-l-4 border-dg-green bg-dg-green-tint px-6 py-7 md:px-8 md:py-8" style={{ borderRadius: 8 }}>
      <h3 className="text-center text-[19px] font-bold leading-snug text-dg-ink md:text-[21px]">
        혜택 하나 드릴 때마다, <span className="text-dg-green-deep">매장은 4가지를 동시에 얻습니다</span>
      </h3>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {BENEFIT_ITEMS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3 border border-dg-line bg-white p-4" style={{ borderRadius: 6 }}>
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dg-green-tint text-dg-green-deep">
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[14px] font-bold text-dg-ink">{title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-dg-ink-soft">{body}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-[14px] font-semibold leading-relaxed text-dg-ink">
        경품 하나가 나갈 때마다, 우리 매장은 신규 손님을 불러오는 광고판을 하나씩 늘려가는 셈입니다.
      </p>
    </div>
    </div>
  )
}

type RoiAssumptions = {
  revisitRate: number
  benefitPerGuest: number
  spendPerGuest: number
}

/** dailyGuests(하루 평균 손님 수) 기준으로 한 달(daysPerMonth) 예상 손익을 계산한다.
 *  좌측 고정 예시 카드와 우측 인터랙티브 슬라이더 카드가 서로 다른 가정치를 쓰므로
 *  assumptions를 인자로 받는다. */
function calc(dailyGuests: number, assumptions: RoiAssumptions) {
  const dailyRevisits = Math.round(dailyGuests * assumptions.revisitRate)
  const dailyCost = dailyRevisits * assumptions.benefitPerGuest
  const dailyRevenue = dailyRevisits * assumptions.spendPerGuest
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
