'use client'

import { useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  ClipboardList,
  Gamepad2,
  Layers,
  Megaphone,
  MapPin,
  Network,
  Repeat,
  Ticket,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react'
import '@/components/landing-v5/landing-v5.css'
import Navbar from '@/components/landing-v5/Navbar'
import BottomBar from '@/components/landing-v5/BottomBar'
import { Footer } from '@/components/landing-v5/Sections'
import { ContentOpsModal } from '@/components/landing-v5/PricingModals'
import { DEMO_PLAY_URL } from '@/lib/landing-v5/config'

/* ───────────── 데이터 (제안서 PPT 4종 기준) ───────────── */

const CARROT = '#ff8a00'

const GOALS = [
  {
    n: '01',
    icon: Megaphone,
    name: '브랜드 홍보',
    lead: '더 많은 지역 고객에게 브랜드 알리기',
    bullets: ['브랜드 대표 상품과 차별점 강조', '여러 지점의 브랜드 광고를 통합 운영', '브랜드 인지도 확대 캠페인에 활용'],
  },
  {
    n: '02',
    icon: MapPin,
    name: '지점 홍보',
    lead: '가까운 고객을 매장으로 연결하기',
    bullets: ['차도 거리 기준 선택', '도보 시간 기준 선택', '지점별 지역 특성에 맞게 운영'],
    note: '세부 설정 가능 범위는 광고 계정 및 상품 조건에 따릅니다.',
  },
  {
    n: '03',
    icon: TrendingUp,
    name: '매출 확대',
    lead: '상품·할인·쿠폰 혜택을 광고하세요',
    bullets: ['대표 상품 이미지 + 할인 혜택', '쿠폰·이벤트 안내', '매장 방문 또는 구매 행동 유도'],
    note: '실제 광고 성과는 소재·지역·예산 등에 따라 달라집니다.',
  },
  {
    n: '04',
    icon: Building2,
    name: '가맹점 모집',
    lead: '창업 상담 고객을 확보하세요',
    bullets: ['브랜드 경쟁력과 창업 혜택 소개', '가맹 상담 신청 유도', '신청 고객 후속 상담 진행'],
    note: '수익·매출 등은 실제 근거가 있는 정보만 광고에 사용합니다.',
  },
]

const HQ_POINTS = [
  { icon: Layers, title: '여러 지점 광고를 통합 관리', desc: '하나의 캠페인에서 최대 3,000개 지점 광고를 운영할 수 있습니다.' },
  { icon: BarChart3, title: '지점별 예산·입찰가 설정', desc: '본사가 예산을 정하고, 지점마다 입찰가를 세밀하게 조정합니다.' },
  { icon: Network, title: '공통 기준 또는 지점별 맞춤', desc: '본사 공통 소재와 지역 맞춤 운영을 필요에 따라 함께 씁니다.' },
]

const LEAD_FLOW = ['브랜드 소개', '질문 문항', '신청 정보', '개인정보 동의', '제출 완료']

const DANGOLTING_FLOW = [
  { icon: Megaphone, title: '광고 유입', desc: '당근에서 매장·브랜드를 발견' },
  { icon: Gamepad2, title: '게임 참여', desc: 'QR로 인형뽑기 이벤트 참여' },
  { icon: Ticket, title: '쿠폰 혜택', desc: '브랜드 정책에 맞는 혜택 안내' },
  { icon: BarChart3, title: '성과 확인', desc: '게임·쿠폰 관련 데이터 확인' },
]

const DIFFS = [
  {
    icon: Repeat,
    tag: 'DIFFERENCE 01',
    title: '광고 이후에도 고객과 다시 만나는 구조',
    desc: '광고 노출에서 끝나지 않도록, 게임 참여와 후속 홍보를 연결합니다.',
    steps: ['QR 게임 참여', '단골 등록 유도', '지속적인 고객 소통'],
    foot: '확보한 단골 대상 소식·쿠폰 발행으로 추가 홍보 기회를 넓힙니다.',
    note: '실제 소식·쿠폰 노출 및 알림 범위는 당근의 기능과 운영 정책에 따라 달라질 수 있습니다.',
  },
  {
    icon: Video,
    tag: 'DIFFERENCE 02',
    title: '하나의 콘텐츠를 여러 홍보 접점으로',
    desc: '브랜드 행사와 프로모션 콘텐츠를 제작해 유료 광고부터 추가 홍보까지 다양하게 활용합니다.',
    steps: ['정기 소식 발행', '유료 광고 소재 활용', '당근 스토리 등 추가 노출'],
    foot: '하나의 콘텐츠를 광고와 추가 홍보에 함께 활용해 홍보 기회를 넓힙니다.',
    note: '월 10회 공통 소식 발행은 기존 운영 범위 기준입니다. 쇼츠 제작은 계약 포함 여부를 별도 확인하세요.',
  },
]

const MONTHLY_SERVICES = [
  '당근 브랜드 프로필 통합 관리',
  '브랜드 프로필 바이럴 소식 월 10회 작성·발행',
  '본사 공통 프로모션 및 이벤트 콘텐츠 운영',
  '본사 광고 예산에 따른 광고 집행 및 관리',
  '단골팅 QR 게임 이벤트 연동',
  '지점별 광고 및 이벤트 운영 현황 관리',
]

const PROCESS = [
  { n: '01', title: '본사가 광고 예산 결정', desc: '지점당 월 광고비 3만~10만 원 기준' },
  { n: '02', title: '당근 광고 운영', desc: '브랜드·지역·상품·가맹 모집 홍보' },
  { n: '03', title: '단골팅 게임 이벤트', desc: 'QR 참여와 혜택으로 고객 참여 유도' },
  { n: '04', title: '결과 확인 및 운영 관리', desc: '지점별 광고·이벤트 현황 확인' },
]

/** 지점 수별 요금표. 단골팅 지점당 월 3만 원 + 광고비 지점당 월 2만 원 가정(제안서 기준) */
const PRICE_COLS = [
  { branches: '10개 지점', service: '30만 원', ad: '20만 원', monthly: '50만 원', setup: '50만 원', first: '100만 원' },
  { branches: '20개 지점', service: '60만 원', ad: '40만 원', monthly: '100만 원', setup: '50만 원', first: '150만 원' },
  { branches: '50개 지점', service: '150만 원', ad: '100만 원', monthly: '250만 원', setup: '50만 원', first: '300만 원' },
  { branches: '100개 지점', service: '300만 원', ad: '200만 원', monthly: '500만 원', setup: '50만 원', first: '550만 원', best: true },
]

const PRICE_ROWS: { label: string; key: 'service' | 'ad' | 'monthly' | 'setup' | 'first'; strong?: boolean }[] = [
  { label: '단골팅 이용요금', key: 'service' },
  { label: '당근 광고비', key: 'ad' },
  { label: '월 예상 합계', key: 'monthly', strong: true },
  { label: '최초 운영 세팅비', key: 'setup' },
  { label: '첫 달 예상 합계', key: 'first', strong: true },
]

const FORECAST_FUNNEL = [
  { label: '광고 노출', value: '약 60만~370만 회' },
  { label: '광고 클릭', value: '약 3,900~57,000회' },
  { label: '후속 행동', value: '매장 방문 · 구매 · 가맹 상담 문의' },
]

const FORECAST_EFFECTS = [
  { icon: Megaphone, title: '브랜딩 효과', desc: '지역 고객에게 브랜드와 대표 상품을 반복 노출할 기회' },
  { icon: TrendingUp, title: '판매 촉진 효과', desc: '상품·할인·쿠폰 광고로 지점 방문과 구매 행동 유도' },
  { icon: Users, title: '지점 확보 효과', desc: '창업 혜택과 브랜드 경쟁력을 알리고 상담 신청 유도' },
]

/* ───────────── 공통 UI ───────────── */

function SectionHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[12px] font-bold tracking-[0.16em] text-dg-green-deep">{eyebrow}</p>
      <h2 className="mt-3 text-[26px] text-dg-ink md:text-[34px]">{title}</h2>
      {desc && <p className="mt-3 text-[14px] leading-relaxed text-dg-ink-soft md:text-[15px]">{desc}</p>}
    </div>
  )
}

const CARD = 'border border-dg-line bg-white'

/* ───────────── 페이지 ───────────── */

export default function FranchiseClient() {
  const [consultOpen, setConsultOpen] = useState(false)
  const openConsult = () => setConsultOpen(true)

  return (
    <div className="landing-v5 min-h-screen">
      <Navbar />
      <main className="pt-16">
        {/* 1. HERO */}
        <section className="relative overflow-hidden bg-dg-bg">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl md:h-[420px] md:w-[420px]"
            style={{ background: 'radial-gradient(circle, #ffd9a3 0%, rgba(255,217,163,0) 70%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full opacity-40 blur-3xl md:h-[380px] md:w-[380px]"
            style={{ background: 'radial-gradient(circle, #b6f2e6 0%, rgba(182,242,230,0) 70%)' }}
          />
          <div className="relative mx-auto max-w-4xl px-5 py-16 text-center md:py-28">
            <span
              className="inline-flex items-center gap-2 border border-dg-line bg-white/80 px-3.5 py-1.5 text-[12px] font-bold text-dg-ink backdrop-blur"
              style={{ borderRadius: 999 }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: CARROT }} />
              FRANCHISE MARKETING
            </span>
            <h1 className="mt-6 text-[32px] leading-[1.25] text-dg-ink md:text-[52px]">
              본사 광고는 통합하고,
              <br />
              지점 홍보는 <span className="text-dg-green-deep">지역에 맞게.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-dg-ink-soft md:text-[17px]">
              당근 광고 × 단골팅 — 브랜드 홍보부터 고객·단골 확보까지,
              <br className="hidden sm:block" />
              프랜차이즈 마케팅을 하나의 운영 체계로 지원합니다.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              {['브랜드 홍보', '지점 홍보', '매출 확대', '가맹점 모집'].map((g) => (
                <span
                  key={g}
                  className="border border-dg-line bg-white px-3.5 py-1.5 text-[13px] font-semibold text-dg-ink"
                  style={{ borderRadius: 999 }}
                >
                  {g}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={openConsult}
                className="group flex h-12 w-full items-center justify-center gap-2 bg-dg-green px-8 text-[15px] font-bold text-dg-ink shadow-[0_8px_24px_rgba(0,199,167,0.28)] transition-all hover:-translate-y-0.5 hover:opacity-95 sm:w-auto"
                style={{ borderRadius: 6 }}
              >
                도입 상담 신청
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <a
                href={DEMO_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2 border border-dg-ink/20 bg-white px-8 text-[15px] font-bold text-dg-ink transition-colors hover:bg-dg-cream sm:w-auto"
                style={{ borderRadius: 6 }}
              >
                <Gamepad2 size={17} />
                게임 직접 체험하기
              </a>
            </div>
          </div>
        </section>

        {/* 2. 기회 — 4가지 목표 */}
        <section className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead
              eyebrow="THE OPPORTUNITY"
              title="브랜드와 전국 지점 광고를 한 번에 운영하세요"
              desc="당근의 프랜차이즈 광고 기능을 활용해 본사 캠페인과 지점별 광고를 함께 운영할 수 있습니다."
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {GOALS.map((g) => (
                <article
                  key={g.n}
                  className={`${CARD} flex flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(34,34,34,0.08)] sm:p-7`}
                  style={{ borderRadius: 12 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-num text-[15px] font-bold" style={{ color: CARROT }}>
                      {g.n}
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-dg-cream" style={{ color: CARROT }}>
                      <g.icon size={20} strokeWidth={1.75} />
                    </span>
                  </div>
                  <p className="mt-4 text-[12px] font-bold tracking-wide text-dg-green-deep">목표 {g.n}</p>
                  <h3 className="mt-1 text-[20px] text-dg-ink">{g.name}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-dg-ink-soft">{g.lead}</p>
                  <ul className="mt-5 space-y-2.5 border-t border-dg-line pt-5">
                    {g.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-[14px] leading-relaxed text-dg-ink">
                        <Check size={15} className="mt-1 shrink-0 text-dg-green-deep" strokeWidth={2.25} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  {g.note && <p className="mt-4 text-[11.5px] leading-relaxed text-dg-ink-soft/70">※ {g.note}</p>}
                </article>
              ))}
            </div>
            <p className="mt-8 text-center text-[15px] font-bold text-dg-ink">
              하나의 광고 시스템으로 네 가지 사업 목표를 지원합니다.
            </p>
          </div>
        </section>

        {/* 3. 본사 통합 운영 + 리드폼 */}
        <section className="bg-dg-bg py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead
              eyebrow="MULTI-LOCATION"
              title="여러 지점 광고를 한 번에 — 본사 통합 운영"
              desc="공식 안내서 기준, 하나의 캠페인에서 최대 3,000개 지점 광고를 운영할 수 있습니다."
            />
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {HQ_POINTS.map((p) => (
                <div key={p.title} className={`${CARD} p-6`} style={{ borderRadius: 12 }}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-dg-green-tint text-dg-green-deep">
                    <p.icon size={20} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 text-[17px] text-dg-ink">{p.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-dg-ink-soft">{p.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[11.5px] text-dg-ink-soft/70">
              ※ 최대 운영 지점 수는 당근 공식 자료의 적용 조건을 확인해 표기했습니다.
            </p>

            {/* 리드폼 */}
            <div className={`${CARD} mt-12 p-6 md:p-9`} style={{ borderRadius: 14 }}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-dg-cream" style={{ color: CARROT }}>
                  <ClipboardList size={20} strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-[12px] font-bold tracking-[0.14em] text-dg-green-deep">LEAD FORM</p>
                  <h3 className="text-[18px] text-dg-ink md:text-[21px]">
                    리드폼으로 상담 신청과 이벤트 참여 정보를 간편하게 수집
                  </h3>
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-dg-ink-soft">
                고객이 신청 정보를 제출하도록 유도하고, 후속 상담이나 안내에 활용할 수 있습니다.
              </p>
              <ol className="mt-6 grid gap-2 sm:grid-cols-5">
                {LEAD_FLOW.map((s, i) => (
                  <li
                    key={s}
                    className="flex items-center gap-2 border border-dg-line bg-dg-bg px-3 py-3 text-[13px] font-semibold text-dg-ink"
                    style={{ borderRadius: 8 }}
                  >
                    <span className="font-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dg-ink text-[11px] text-white">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 4. 단골팅 연결 */}
        <section className="bg-dg-ink py-20 text-white md:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[12px] font-bold tracking-[0.16em] text-dg-green">DANGOLTING</p>
              <h2 className="mt-3 text-[26px] text-white md:text-[34px]">
                당근 광고에 단골팅을 더해
                <br />
                고객 참여와 재방문을 유도하세요
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-white/60 md:text-[15px]">
                당근 광고가 고객 유입을 지원하고, 단골팅은 게임 이벤트와 쿠폰 활용으로 참여 경험을 만듭니다.
              </p>
            </div>

            <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {DANGOLTING_FLOW.map((s, i) => (
                <li
                  key={s.title}
                  className="relative border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-colors hover:bg-white/[0.07]"
                  style={{ borderRadius: 12 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-num text-[13px] font-bold text-dg-green">0{i + 1}</span>
                    <s.icon size={20} strokeWidth={1.75} className="text-dg-green" />
                  </div>
                  <h3 className="mt-4 text-[17px] text-white">{s.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/60">{s.desc}</p>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={DEMO_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2 bg-dg-green px-8 text-[15px] font-bold text-dg-ink transition-opacity hover:opacity-90 sm:w-auto"
                style={{ borderRadius: 6 }}
              >
                <Gamepad2 size={17} />
                게임 직접 체험하기
              </a>
              <span className="font-num text-[12px] text-white/40">dgting.co.kr/play/ca-01</span>
            </div>

            {/* 차별점 2종 */}
            <div className="mt-16 grid gap-5 md:grid-cols-2">
              {DIFFS.map((d) => (
                <article
                  key={d.tag}
                  className="border border-white/10 bg-white/[0.04] p-6 sm:p-8"
                  style={{ borderRadius: 14 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-num text-[11px] font-bold tracking-[0.14em] text-dg-green">{d.tag}</span>
                    <d.icon size={20} strokeWidth={1.75} className="text-dg-green" />
                  </div>
                  <h3 className="mt-4 text-[20px] leading-snug text-white">{d.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/60">{d.desc}</p>
                  <ol className="mt-5 space-y-2">
                    {d.steps.map((s, i) => (
                      <li key={s} className="flex items-center gap-3 text-[14px] text-white/90">
                        <span className="font-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dg-green text-[11px] font-bold text-dg-ink">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-5 border-t border-white/10 pt-4 text-[13.5px] font-semibold leading-relaxed text-white">
                    {d.foot}
                  </p>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-white/40">※ {d.note}</p>
                </article>
              ))}
            </div>
            <p className="mt-8 text-center text-[16px] font-bold text-white md:text-[18px]">
              광고로 알리고, 게임으로 연결하고, 소식과 혜택으로 다시 만날 기회를 만듭니다.
            </p>
          </div>
        </section>

        {/* 5. 운영 방식 + 월간 서비스 6가지 */}
        <section className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead
              eyebrow="HOW IT WORKS"
              title="광고 운영부터 단골 확보까지, 한 번에"
              desc="본사가 광고 예산을 정하고, 아크웍스가 당근 광고와 단골팅 운영을 지원합니다."
            />
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PROCESS.map((p) => (
                <li key={p.n} className={`${CARD} p-6`} style={{ borderRadius: 12 }}>
                  <span className="font-num text-[13px] font-bold" style={{ color: CARROT }}>
                    {p.n}
                  </span>
                  <h3 className="mt-3 text-[17px] leading-snug text-dg-ink">{p.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-dg-ink-soft">{p.desc}</p>
                </li>
              ))}
            </ol>

            <div className="mt-12 bg-dg-bg p-6 md:p-9" style={{ borderRadius: 14 }}>
              <h3 className="text-center text-[20px] text-dg-ink md:text-[24px]">월간 운영 서비스 6가지</h3>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {MONTHLY_SERVICES.map((s, i) => (
                  <li
                    key={s}
                    className="flex items-center gap-3 border border-dg-line bg-white px-4 py-3.5 text-[14px] font-semibold text-dg-ink"
                    style={{ borderRadius: 8 }}
                  >
                    <span className="font-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dg-green text-[11px] font-bold text-dg-ink">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-center text-[12px] text-dg-ink-soft/80">
                ※ 월 10회 소식은 본사 공통 콘텐츠로, 등록된 지점에 동일하게 노출됩니다.
              </p>
            </div>
          </div>
        </section>

        {/* 6. 요금 */}
        <section className="bg-dg-bg py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-5">
            <SectionHead
              eyebrow="PRICING"
              title="지점 규모에 맞춰 합리적으로 시작하세요"
              desc="당근 광고비는 지점당 월 20,000원을 가정한 예시입니다. 부가세 별도."
            />

            {/* 핵심 가격 2개 */}
            <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
              <div className={`${CARD} p-6 text-center`} style={{ borderRadius: 12 }}>
                <p className="text-[13px] font-semibold text-dg-ink-soft">단골팅 이용요금</p>
                <p className="mt-2 text-dg-ink">
                  <span className="font-num text-[30px] font-bold">30,000원</span>
                </p>
                <p className="mt-1 text-[13px] text-dg-ink-soft">지점당 / 월</p>
              </div>
              <div className={`${CARD} p-6 text-center`} style={{ borderRadius: 12 }}>
                <p className="text-[13px] font-semibold text-dg-ink-soft">초기 운영 세팅비</p>
                <p className="mt-2 text-dg-ink">
                  <span className="font-num text-[30px] font-bold">500,000원</span>
                </p>
                <p className="mt-1 text-[13px] text-dg-ink-soft">브랜드 전체 · 최초 1회</p>
              </div>
            </div>

            {/* 요금표 */}
            <div className={`${CARD} mt-8 overflow-x-auto`} style={{ borderRadius: 12 }}>
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-dg-line bg-dg-bg">
                    <th className="py-3.5 pl-5 pr-3 text-[13px] font-bold text-dg-ink-soft">비용 항목</th>
                    {PRICE_COLS.map((c) => (
                      <th
                        key={c.branches}
                        className={`px-3 py-3.5 text-right text-[13px] font-bold ${c.best ? 'text-dg-green-deep' : 'text-dg-ink'}`}
                      >
                        {c.branches}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PRICE_ROWS.map((r) => (
                    <tr key={r.key} className={`border-b border-dg-line/60 ${r.strong ? 'bg-dg-green-tint' : ''}`}>
                      <td className={`py-4 pl-5 pr-3 text-[14px] ${r.strong ? 'font-bold text-dg-ink' : 'text-dg-ink'}`}>
                        {r.label}
                      </td>
                      {PRICE_COLS.map((c) => (
                        <td
                          key={c.branches}
                          className={`font-num whitespace-nowrap px-3 py-4 text-right text-[14px] ${
                            r.strong ? 'font-bold text-dg-ink' : 'text-dg-ink'
                          }`}
                        >
                          {c[r.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-dg-ink-soft/80">
              ※ 최초 세팅비는 브랜드 전체 최초 1회입니다. 실제 광고비는 본사 예산과 운영 조건에 따라 달라질 수 있습니다.
              광고비·부가세 별도.
            </p>

            {/* 100개 지점 견적 요약 */}
            <div className="mt-10 bg-dg-ink p-6 text-white md:p-9" style={{ borderRadius: 14 }}>
              <p className="text-[12px] font-bold tracking-[0.16em] text-dg-green">100개 지점 통합 운영 견적 요약</p>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-[13px] text-white/60">월 예상 합계 (서비스비 + 광고비)</p>
                  <p className="font-num mt-1 text-[22px] font-bold md:text-[26px]">600만~1,300만 원</p>
                  <p className="mt-1 text-[12px] text-white/50">
                    서비스비 300만 원 + 광고비 300만~1,000만 원 (지점당 월 3만~10만 원)
                  </p>
                </div>
                <div>
                  <p className="text-[13px] text-white/60">첫 달 예상 합계 (+ 세팅비 50만 원)</p>
                  <p className="font-num mt-1 text-[22px] font-bold md:text-[26px]">650만~1,350만 원</p>
                  <p className="mt-1 text-[12px] text-white/50">부가세 별도 · 견적 유효기간 발행일로부터 30일</p>
                </div>
              </div>
              <button
                type="button"
                onClick={openConsult}
                className="mt-6 flex h-11 items-center justify-center gap-2 border border-white/20 px-6 text-[14px] font-bold text-white transition-colors hover:bg-white/10"
                style={{ borderRadius: 6 }}
              >
                우리 브랜드 맞춤 견적 받기
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* 7. 광고 효과 예상 */}
        <section className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-5">
            <SectionHead
              eyebrow="AD FORECAST"
              title="100개 지점 통합 광고 효과 예상"
              desc="당근 광고를 통해 브랜드·지점 홍보부터 판매 촉진과 가맹 상담 유도까지 지원합니다."
            />

            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { k: '월 광고 예산', v: '300만~1,000만 원', s: '본사 결정 예산' },
                { k: '예상 노출', v: '약 60만~370만 회', s: '업종 참고치 환산' },
                { k: '예상 클릭', v: '약 3,900~57,000회', s: '업종 참고치 환산' },
                { k: '대상 규모', v: '100개 지점', s: '본사 통합 운영' },
              ].map((x) => (
                <div key={x.k} className={`${CARD} p-4 text-center md:p-5`} style={{ borderRadius: 12 }}>
                  <p className="text-[12px] font-semibold text-dg-ink-soft">{x.k}</p>
                  <p className="font-num mt-2 text-[15px] font-bold leading-snug text-dg-ink md:text-[16px]">{x.v}</p>
                  <p className="mt-1.5 text-[11px] text-dg-ink-soft/70">{x.s}</p>
                </div>
              ))}
            </div>

            {/* 퍼널 */}
            <div className="mt-8 bg-dg-bg p-6 md:p-8" style={{ borderRadius: 14 }}>
              <p className="text-center text-[14px] font-bold text-dg-ink">예상 광고 퍼널</p>
              <p className="mt-1 text-center text-[12px] text-dg-ink-soft">산출 기준: 지점당 월 3만~10만 원</p>
              <div className="mt-6 space-y-2.5">
                {FORECAST_FUNNEL.map((f, i) => (
                  <div
                    key={f.label}
                    className="mx-auto flex items-center justify-between gap-3 bg-white px-5 py-3.5 text-[14px]"
                    style={{ borderRadius: 8, width: `${100 - i * 8}%`, border: '1px solid var(--line)' }}
                  >
                    <span className="font-bold text-dg-ink">{f.label}</span>
                    <span className="font-num text-right text-[13px] font-bold text-dg-green-deep md:text-[14px]">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {FORECAST_EFFECTS.map((e) => (
                <div key={e.title} className={`${CARD} p-6`} style={{ borderRadius: 12 }}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-dg-cream" style={{ color: CARROT }}>
                    <e.icon size={18} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-3 text-[16px] text-dg-ink">{e.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-dg-ink-soft">{e.desc}</p>
                </div>
              ))}
            </div>

            {/* CPC 계산 예시 */}
            <div className={`${CARD} mt-8 p-6 md:p-8`} style={{ borderRadius: 14 }}>
              <h3 className="text-[17px] text-dg-ink md:text-[19px]">클릭당 약 250원 기준, 광고 성과를 예상해 보세요</h3>
              <p className="mt-1.5 text-[13px] text-dg-ink-soft">
                평균 CPC 250원을 가정한 단순 계산 예시입니다. 예상 클릭 수 = 광고비 ÷ 250원
              </p>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-dg-line">
                      <th className="py-3 pr-3 text-[13px] font-bold text-dg-ink-soft">구분</th>
                      <th className="px-3 py-3 text-right text-[13px] font-bold text-dg-ink">월 1만 원 계산 예시</th>
                      <th className="py-3 pl-3 text-right text-[13px] font-bold text-dg-green-deep">20개 지점 × 월 2만 원</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['월 광고비', '10,000원', '400,000원'],
                      ['월 조회수', '약 3,000회', '약 60,000회'],
                      ['예상 클릭 수', '약 40회', '약 1,600회'],
                    ].map(([a, b, c]) => (
                      <tr key={a} className="border-b border-dg-line/60">
                        <td className="py-3.5 pr-3 text-[14px] font-semibold text-dg-ink">{a}</td>
                        <td className="font-num px-3 py-3.5 text-right text-[14px] text-dg-ink">{b}</td>
                        <td className="font-num py-3.5 pl-3 text-right text-[14px] font-bold text-dg-ink">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-[11.5px] leading-relaxed text-dg-ink-soft/70">
                ※ 월 1만 원은 클릭당 비용을 이해하기 위한 계산 예시이며, 실제 광고 집행 최소 예산은 지점당 월 2만 원입니다.
                노출 수는 CTR에 따라 달라지며 업종·지역·소재·입찰 조건에 따라 실제 결과가 달라집니다.
              </p>
            </div>

            <p className="mt-6 text-center text-[12px] leading-relaxed text-dg-ink-soft/80">
              ※ 노출·클릭은 과거 공유된 업종별 참고 범위를 예산에 비례해 환산한 추정치입니다. 매출·방문·가맹 계약 수는
              전환율 데이터가 없어 수치로 단정하지 않았습니다.
            </p>
          </div>
        </section>

        {/* 8. CTA */}
        <section className="bg-dg-ink py-20 text-center md:py-28">
          <div className="mx-auto max-w-2xl px-5">
            <p className="text-[12px] font-bold tracking-[0.16em] text-dg-green">LET&apos;S TALK</p>
            <h2 className="mt-3 text-[26px] text-white md:text-[34px]">
              우리 브랜드에 맞는 프랜차이즈
              <br />
              마케팅 구성을 상담해 보세요
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-white/60">
              브랜드명과 연락처만 남겨주시면, 담당자가 지점 수와 예산에 맞춰 연락드려요.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={openConsult}
                className="flex h-12 w-full items-center justify-center bg-dg-green px-8 text-[15px] font-bold text-dg-ink transition-opacity hover:opacity-90 sm:w-auto"
                style={{ borderRadius: 6 }}
              >
                도입 상담 신청
              </button>
              <a
                href="tel:16883893"
                className="flex h-12 w-full items-center justify-center border border-white/20 px-8 text-[15px] font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
                style={{ borderRadius: 6 }}
              >
                1688-3893 전화 상담
              </a>
            </div>
            <p className="mt-6 text-[12px] text-white/40">아크웍스 | 당근 광고 × 단골팅 | 광고비·부가세 별도</p>
          </div>
        </section>
      </main>
      <Footer />
      <BottomBar />

      {consultOpen && (
        <ContentOpsModal
          onClose={() => setConsultOpen(false)}
          source="landing_v5_franchise"
          title="당근 프랜차이즈 마케팅 상담"
          description="브랜드 정보를 남겨주시면, 담당자가 지점 수와 예산에 맞춰 상담을 위해 연락드려요."
          nameLabel="브랜드명"
          namePlaceholder="예: 단골팅 치킨"
        />
      )}
    </div>
  )
}
