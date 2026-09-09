'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Megaphone, Video, Target, Check } from 'lucide-react'
import '@/components/landing-v5/landing-v5.css'
import Navbar from '@/components/landing-v5/Navbar'
import BottomBar from '@/components/landing-v5/BottomBar'
import { CarrotChannelSection, Footer } from '@/components/landing-v5/Sections'
import { ContentOpsModal } from '@/components/landing-v5/PricingModals'
import { CONTENT_OPS_ADDONS, formatWon, SIGNUP_PATH } from '@/lib/landing-v5/config'

type ServiceCard = {
  n: string
  icon: typeof Sparkles
  name: string
  priceLabel: string
  subtitle: string
  bullets: string[]
  footnote?: string
}

/** 이름·가격은 CONTENT_OPS_ADDONS(=요금제 계산기 02번 그룹과 공통 소스)에서 가져오고,
 *  이 페이지 전용 소개 문구(아이콘/부제/불릿)만 여기서 관리한다. */
function addon(id: (typeof CONTENT_OPS_ADDONS)[number]['id']) {
  const item = CONTENT_OPS_ADDONS.find((a) => a.id === id)!
  const priceLabel =
    item.kind === 'monthly'
      ? `${item.freqLabel} · ${formatWon(item.price)}`
      : `${item.freqLabel} ${formatWon(item.price)}`
  return { name: item.name, priceLabel }
}

const CARDS: ServiceCard[] = [
  {
    n: '01',
    icon: Sparkles,
    ...addon('biz-profile'),
    subtitle: '고객이 매장을 발견했을 때, 방문으로 이어지게 만드는 기본 세팅',
    bullets: [
      '비즈프로필 정보 및 구성 최적화',
      '매장 소개·메뉴·대표 콘텐츠 점검',
      '고객 관점의 프로필 문구 개선',
      '매장 경쟁력을 높이는 프로필 구조 설계',
    ],
  },
  {
    n: '02',
    icon: Megaphone,
    ...addon('viral'),
    subtitle: '광고비를 쓰지 않아도 매장이 자연스럽게 노출될 수 있도록',
    bullets: [
      '매장 맞춤형 후킹 콘텐츠 기획',
      '콘텐츠 제작 및 당근 소식글 발행',
      '고객의 관심을 끌 수 있는 소재 발굴',
      '당근 내 자연 유입과 바이럴을 고려한 콘텐츠 운영',
    ],
  },
  {
    n: '03',
    icon: Video,
    ...addon('shorts'),
    subtitle: '사진 한 장보다 강하게, 매장의 매력을 영상으로 전달',
    bullets: [
      '매장 숏츠 영상 제작',
      '당근 스토리 콘텐츠 기획·발행',
      '매장·메뉴·서비스를 활용한 영상 콘텐츠 구성',
      '당근에서 지속적으로 매장을 노출할 수 있는 콘텐츠 운영',
    ],
    footnote: '※ 사진 및 영상 원본은 광고주 제공',
  },
  {
    n: '04',
    icon: Target,
    ...addon('target-ad'),
    subtitle: '불특정 다수가 아닌, 우리 매장에 필요한 고객에게 집중 노출',
    bullets: [
      '상권·업종 기반 타깃 분석',
      '매장에 맞는 고객층 설정',
      '당근 광고 캠페인 구성 및 집행',
      '광고 소재·문구 최적화',
      '집행 결과 확인 및 운영 방향 제안',
    ],
    footnote: '※ 광고비 별도',
  },
]

const SUMMARY_ROWS = [
  { name: CARDS[0].name, cost: CARDS[0].priceLabel, goal: '매장 기본 경쟁력 구축' },
  { name: CARDS[1].name, cost: CARDS[1].priceLabel, goal: '자연 유입·노출 확대' },
  { name: CARDS[2].name, cost: CARDS[2].priceLabel, goal: '영상 콘텐츠를 통한 매장 홍보' },
  { name: CARDS[3].name, cost: CARDS[3].priceLabel, goal: '원하는 고객에게 집중 노출' },
]

export default function GrowthDanggeunClient() {
  const [consultOpen, setConsultOpen] = useState(false)

  return (
    <div className="landing-v5 min-h-screen">
      <Navbar />
      <main className="pt-16">
        <CarrotChannelSection />

        {/* 브릿지 카피 — 앞선 소개에서 서비스 구성으로 전환 */}
        <section className="bg-white py-14 md:py-16">
          <p className="mx-auto max-w-2xl px-5 text-center text-[18px] font-bold text-dg-ink md:text-[22px]">
            그럼, 당근에서는 구체적으로 무엇을 해야 할까요?
          </p>
        </section>

        {/* 서비스 구성 — 4개 상세 카드 */}
        <section className="bg-dg-bg py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-center text-[13px] font-semibold tracking-wide text-dg-ink-soft">서비스 구성</p>
            <h2 className="mt-3 text-center text-[26px] font-bold text-dg-ink md:text-[32px]">
              당근 안에서, 이렇게 매장을 키웁니다
            </h2>
            <p className="mt-2 text-center text-[13px] text-dg-ink-soft">※ 모든 금액은 VAT 포함가입니다</p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {CARDS.map((card) => (
                <article
                  key={card.n}
                  className="flex flex-col border border-dg-line bg-white p-6 sm:p-7"
                  style={{ borderRadius: 10 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-num text-[15px] font-bold text-dg-carrot">{card.n}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-dg-cream text-dg-carrot">
                      <card.icon size={20} strokeWidth={1.75} />
                    </span>
                  </div>

                  <h3 className="mt-4 text-[19px] font-bold text-dg-ink">{card.name}</h3>
                  <span
                    className="mt-3 inline-flex w-fit items-center bg-dg-green px-3 py-1 font-num text-[13px] font-bold text-white"
                    style={{ borderRadius: 999 }}
                  >
                    {card.priceLabel}
                  </span>
                  <p className="mt-3 text-[13px] leading-relaxed text-dg-ink-soft">{card.subtitle}</p>

                  <ul className="mt-5 space-y-2.5 border-t border-dg-line pt-5">
                    {card.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-[13px] leading-relaxed text-dg-ink">
                        <Check size={15} className="mt-0.5 shrink-0 text-dg-green-deep" strokeWidth={2.25} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {card.footnote && <p className="mt-4 text-[11px] text-dg-ink-soft/70">{card.footnote}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 요약 비교표 */}
        <section className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-5">
            <h2 className="text-center text-[22px] font-bold text-dg-ink md:text-[26px]">한눈에 보는 서비스 구성</h2>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-dg-line">
                    <th className="whitespace-nowrap py-3 pr-4 text-[13px] font-bold text-dg-ink-soft">서비스</th>
                    <th className="whitespace-nowrap py-3 pr-4 text-[13px] font-bold text-dg-ink-soft">비용</th>
                    <th className="whitespace-nowrap py-3 text-[13px] font-bold text-dg-ink-soft">목적</th>
                  </tr>
                </thead>
                <tbody>
                  {SUMMARY_ROWS.map((row) => (
                    <tr key={row.name} className="border-b border-dg-line/60">
                      <td className="whitespace-nowrap py-4 pr-4 text-[14px] font-bold text-dg-ink">{row.name}</td>
                      <td className="whitespace-nowrap py-4 pr-4 font-num text-[14px] text-dg-ink">{row.cost}</td>
                      <td className="py-4 text-[14px] text-dg-ink-soft">{row.goal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[12px] text-dg-ink-soft/70">
              ※ 모든 금액은 VAT 포함가입니다. 03번 서비스의 사진 및 영상 원본은 광고주가 제공합니다. 04번 서비스는
              광고비가 별도로 발생합니다.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-dg-ink py-20 text-center md:py-28">
          <div className="mx-auto max-w-2xl px-5">
            <h2 className="text-[24px] font-bold text-white md:text-[30px]">
              지금 당근 안에서, 우리 매장을 키워보세요
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-white/60">
              매장 정보만 남겨주시면 담당자가 상황에 맞는 구성을 상담해드려요.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <span className="flex items-center gap-1.5 text-[13px] text-white/70">
                <Check size={15} className="text-dg-green" strokeWidth={2.25} />
                숨겨진 비용 없음
              </span>
              <span className="flex items-center gap-1.5 text-[13px] text-white/70">
                <Check size={15} className="text-dg-green" strokeWidth={2.25} />
                약정 기간 없음
              </span>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setConsultOpen(true)}
                className="flex h-12 w-full min-w-[44px] items-center justify-center bg-dg-green px-8 text-[15px] font-bold text-dg-ink transition-opacity hover:opacity-90 sm:w-auto"
                style={{ borderRadius: 6 }}
              >
                상담 신청하기
              </button>
              <Link
                href={SIGNUP_PATH}
                className="flex h-12 w-full min-w-[44px] items-center justify-center border border-white/20 px-8 text-[15px] font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
                style={{ borderRadius: 6 }}
              >
                바로 가입하기
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <BottomBar />

      {consultOpen && (
        <ContentOpsModal onClose={() => setConsultOpen(false)} source="landing_v5_growth_danggeun" />
      )}
    </div>
  )
}
