'use client'

import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Footprints, HelpCircle, ArrowRight, Repeat, MapPin, Smartphone, HeartHandshake, Check, Gift } from 'lucide-react'
import ScreenshotSlot from './ScreenshotSlot'
import RoiCalculator from './RoiCalculator'
import { BasicApplyModal, AeoWaitlistModal, BankRow } from './PricingModals'
import {
  PRICING,
  PRICING_BASIC_DISCOUNT_PERCENT,
  PRICING_BASIC_TODAY_TOTAL,
  LAUNCH_EVENT,
  BANK_ACCOUNT,
  formatMonthlyPrice,
  formatWon,
} from '@/lib/landing-v5/config'

type CtaProps = { onCta: () => void }

/** 인형뽑기 게임 프레임과 무관한 실사 이미지(QR 스탠드, 쿠폰함, 카카오톡 캡처)를 담는 카드 —
 *  원본 비율이 제각각이라도 카드 박스 크기(3:4)는 통일하고, object-contain으로 잘림 없이 담는다. */
function TouchpointCard({
  src,
  alt,
  cardBg = 'bg-dg-bg',
}: {
  src: string
  alt: string
  cardBg?: string
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-[240px] items-center justify-center overflow-hidden p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] ${cardBg}`}
      style={{ borderRadius: 16, aspectRatio: '3 / 4' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-h-full max-w-full rounded-lg object-contain" />
    </div>
  )
}

export function ProductShowcase() {
  return (
    <section
      id="service"
      className="scroll-mt-20 py-20 text-white md:py-28"
      style={{
        background: 'radial-gradient(120% 120% at 50% 25%, #1C2C25 0%, #14201C 55%, #0E1714 100%)',
      }}
    >
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green">실제 접점</p>
        <h2 className="mt-3 max-w-2xl text-[32px] leading-tight md:text-[44px]">
          손님이 실제로 만나는
          <br />
          단골팅의 순간들
        </h2>
        {/* 손님이 매장에서 실제로 마주치는 3가지 접점 — QR / 쿠폰함 / 카톡 알림 (게임 플레이 흐름은 03번 섹션에서 별도로 다룸) */}
        <div className="mt-12 flex gap-8 overflow-x-auto pb-4 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
          <div className="min-w-[240px] flex-shrink-0 text-center sm:min-w-0">
            <TouchpointCard src="/landing-v5/screens/06-qr.webp" alt="매장 테이블에 놓인 단골팅 QR 코드 스탠드" />
            <h3 className="mt-5 text-[17px] font-bold text-white">테이블 QR 코드</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">매장 어디서나, QR 하나로 시작</p>
          </div>
          <div className="min-w-[240px] flex-shrink-0 text-center sm:min-w-0">
            <TouchpointCard src="/landing-v5/screens/07-wallet.webp" alt="포인트 잔액과 리워드 교환 목록이 보이는 내 쿠폰함 화면" />
            <h3 className="mt-5 text-[17px] font-bold text-white">당첨 쿠폰함</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">받은 혜택을 한눈에</p>
          </div>
          <div className="min-w-[240px] flex-shrink-0 text-center sm:min-w-0">
            <TouchpointCard
              src="/landing-v5/screens/08-kakao.webp"
              alt="카카오 알림톡으로 도착한 매장 쿠폰 발급 안내 메시지"
              cardBg="bg-white"
            />
            <h3 className="mt-5 text-[17px] font-bold text-white">카카오 알림톡</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">당첨되면 카톡으로 바로 알려드려요</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/** 문제제기 섹션 우측 시각물 — "광고→방문" 다음 화살표가 물음표에서 끊기는 다이어그램.
 *  회색 톤으로만 구성해 "불확실함"을 표현한다(그린은 이 다이어그램 안에는 쓰지 않음 — 문제는 아직 해결 전 상태). */
function AdUncertaintyDiagram() {
  const chain = [
    { icon: Megaphone, label: '광고' },
    { icon: Footprints, label: '방문' },
  ]
  return (
    <div className="rounded-2xl border border-dg-line bg-white p-8 shadow-[0_20px_48px_rgba(17,17,17,0.08)]">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4">
        {chain.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-dg-bg text-dg-ink-soft">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="text-[12px] font-semibold text-dg-ink-soft">{label}</span>
            </div>
            <ArrowRight size={16} className="text-dg-ink-soft/30" />
          </div>
        ))}
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-dg-ink-soft/25 text-dg-ink-soft/30">
            <HelpCircle size={22} strokeWidth={1.75} />
          </span>
          <span className="text-[12px] font-semibold text-dg-ink-soft/40">그 다음은?</span>
        </div>
      </div>
      <p className="mt-7 text-center text-[13px] leading-relaxed text-dg-ink-soft/80">
        광고는 방문을 만들지만, 다시 올 이유까지 만들지는 않습니다
      </p>
    </div>
  )
}

export function ProblemSection() {
  return (
    <section className="pt-20 pb-8 md:pt-28 md:pb-10">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div>
            <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">문제제기</p>
            <h2 className="mt-3 text-[34px] leading-tight text-dg-ink md:text-[50px]">
              손님을 데려오는 것까지는
              <br />
              가능합니다. 하지만{' '}
              <span className="text-dg-green-deep">다시 오게 만드는 건 어렵습니다.</span>
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-dg-ink-soft md:text-[17px]">
              네이버, 인스타그램, 당근 광고로 새로운 손님을 매장으로 데려올 수는 있습니다. 하지만 한 번 방문한 손님이 다시 돌아오는 과정까지 만들어주는 마케팅은 많지 않습니다.
            </p>
            <div className="relative mt-10 overflow-hidden bg-[#171717] px-6 py-8 pl-8 text-white shadow-[0_20px_44px_rgba(0,0,0,0.28)] md:px-10 md:pl-12" style={{ borderRadius: 6 }}>
              <span className="absolute inset-y-0 left-0 w-1 bg-dg-green" />
              <p className="text-[13px] font-semibold text-dg-green">문제는 방문 이후입니다</p>
              <p className="mt-3 text-[24px] font-extrabold leading-snug tracking-tight md:text-[32px]">
                한 번 온 손님,
                <br />
                다시 만날 방법은 있나요?
              </p>
              <p className="mt-4 text-[14px] leading-relaxed text-white/55">
                광고로 데려온 고객을 다시 연결하는 구조가 필요합니다.
              </p>
            </div>
          </div>
          <div>
            <AdUncertaintyDiagram />
          </div>
        </div>
      </div>
    </section>
  )
}

/** 포지셔닝 전환 섹션 좌측 시각물 — "광고→방문→참여→보상" 흐름이 그린 "재방문"으로 완성되는
 *  프로세스 다이어그램. 문제제기 섹션의 끊긴 흐름(AdUncertaintyDiagram)과 대비되도록, 같은
 *  체인 스타일에서 마지막 단계만 그린으로 채워 "이어짐"을 보여준다. */
function AdToRevisitDiagram() {
  const chain = [
    { icon: Megaphone, label: '광고' },
    { icon: Footprints, label: '방문' },
    { icon: Smartphone, label: '참여' },
    { icon: Gift, label: '보상' },
  ]
  return (
    <div className="rounded-2xl border border-dg-line bg-dg-bg p-8 shadow-[0_20px_48px_rgba(17,17,17,0.06)]">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4">
        {chain.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-dg-ink-soft shadow-sm">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="text-[12px] font-semibold text-dg-ink-soft">{label}</span>
            </div>
            <ArrowRight size={16} className="text-dg-ink-soft/30" />
          </div>
        ))}
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-dg-green text-dg-ink shadow-sm">
            <Repeat size={20} strokeWidth={1.75} />
          </span>
          <span className="text-[12px] font-bold text-dg-ink">재방문</span>
        </div>
      </div>
      <p className="mt-7 text-center text-[13px] leading-relaxed text-dg-ink-soft">
        한 번의 방문을 다음 방문으로 연결합니다.
      </p>
    </div>
  )
}

export function PositioningSection() {
  return (
    <section className="bg-white pt-8 pb-20 md:pt-10 md:pb-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
          {/* 모바일: 텍스트가 항상 먼저 노출되도록 DOM 순서는 텍스트 우선, 데스크톱만 order로 좌측 이동 */}
          <div className="lg:order-2">
            <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">포지셔닝 전환</p>
            <h2 className="mt-3 text-[34px] leading-tight text-dg-ink md:text-[50px]">
              첫 방문을 만드는 광고에서
              <br />
              <span className="text-dg-green-deep">두 번째 방문을 만드는 마케팅</span>으로.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-dg-ink-soft md:text-[17px]">
              새 손님을 계속 사오는 것만으로는 매장이 성장하기 어렵습니다. 한 번 온 손님이 다시 오고, 또 오게 만드는 것 — 단골팅은 광고 이후의 고객 행동을 설계합니다.
            </p>
          </div>
          <div className="lg:order-1">
            <AdToRevisitDiagram />
          </div>
        </div>
      </div>
    </section>
  )
}

export function HowItWorks({ onCta }: CtaProps) {
  const steps = [
    {
      n: '01',
      title: '게임에 참여합니다',
      body: 'QR 하나면 충분합니다. 로그인 없이, 부담 없이 바로 게임이 시작됩니다.',
      shot: '01' as const,
    },
    {
      n: '02',
      title: '선물을 확인합니다',
      body: '게임이 끝나면 카카오 로그인 한 번으로 결과를 확인합니다.',
      shot: '04' as const,
    },
    {
      n: '03',
      title: '단골이 됩니다',
      body: '선물을 받으려면 당근마켓 단골 인증이 필요합니다.',
      shot: '09' as const,
    },
  ]

  return (
    <section id="process" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">작동 원리</p>
        <h2 className="mt-3 text-[32px] text-dg-ink md:text-[44px]">게임 한 판이, 다음 방문의 이유가 됩니다</h2>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.n} className="border border-dg-line bg-white p-5" style={{ borderRadius: 6 }}>
              <p className="font-num text-[12px] tracking-widest text-dg-green-deep">{step.n}</p>
              <h3 className="mt-3 text-[22px] text-dg-ink">{step.title}</h3>
              <p className="mt-3 min-h-[64px] text-[15px] leading-relaxed text-dg-ink-soft">{step.body}</p>
              <div className="mt-6">
                <ScreenshotSlot shotId={step.shot} />
              </div>
            </article>
          ))}
        </div>

        {/* 프로세스 3단계를 요약하는 문구라 특정 단계 카드에 종속시키지 않고,
            전체 폭을 쓰는 독립 배너로 분리 — 그리드 stretch로 옆 카드 높이에
            억지로 맞춰지며 하단에 빈 공간이 생기던 문제를 근본적으로 없앤다 */}
        <article className="mt-4 flex flex-col items-start justify-between gap-6 bg-dg-ink p-6 text-white sm:flex-row sm:items-center sm:p-8" style={{ borderRadius: 6 }}>
          <div>
            <p className="text-[13px] font-semibold text-dg-green">이게 전부입니다</p>
            <h3 className="mt-3 text-[26px] leading-snug">
              이 세 걸음이면 단골이 만들어집니다
            </h3>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/60">
              복잡한 앱 설치도, 어려운 세팅도 없습니다. QR 하나로 시작하는 가장 쉬운 재방문 설계입니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onCta}
            className="inline-flex min-h-[44px] w-fit shrink-0 items-center gap-2 rounded-full bg-dg-green px-6 py-3 text-[14px] font-bold text-dg-ink transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dg-green active:translate-y-0"
          >
            궁금하면, 단골팅
            <span aria-hidden="true">→</span>
          </button>
        </article>
      </div>
    </section>
  )
}

/** DifferenceSection 우측 — 실제 관리자 화면 캡처 대신, "데이터를 관리하는 SaaS"라는 메시지를
 *  증명하는 가상의 통계 카드. 메뉴·탭 없이 핵심 KPI 3개 + 추이 그래프 + 참여 흐름만 담아
 *  전체 화면 캡처처럼 보이지 않게 한다. 수치는 모두 예시 데이터다. */
function ImpactDashboardMock() {
  const kpis = [
    { label: '게임 참여자', value: '248', unit: '명' },
    { label: '재방문 고객', value: '86', unit: '명' },
    { label: '단골 전환', value: '34', unit: '명' },
  ]
  const trend = [18, 24, 22, 35, 48, 61, 74, 86]
  const max = Math.max(...trend)
  const stepX = 100 / (trend.length - 1)
  const points = trend.map((v, i) => ({ x: i * stepX, y: 32 - (v / max) * 28 }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L 100 32 L 0 32 Z`

  return (
    <div>
      <div className="rounded-2xl border border-dg-line bg-white p-5 shadow-[0_16px_40px_rgba(17,17,17,0.07)] md:p-7">
        <p className="text-[12px] font-semibold text-dg-ink-soft">이번 달 성과</p>

        <div className="mt-3 grid grid-cols-3 gap-2.5 md:gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-dg-line bg-dg-bg px-3 py-3 md:px-4 md:py-4">
              <p className="text-[11px] leading-tight text-dg-ink-soft">{kpi.label}</p>
              <p className="mt-1 text-[22px] font-extrabold leading-none text-dg-ink md:text-[26px]">
                {kpi.value}
                <span className="text-[13px] font-bold text-dg-ink-soft">{kpi.unit}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-dg-line p-4">
          <p className="text-[12px] font-semibold text-dg-ink-soft">재방문 고객 추이</p>
          <div className="mt-2 h-[88px] w-full">
            <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="h-full w-full overflow-visible">
              <path d={areaPath} fill="var(--green)" opacity={0.12} />
              <path d={linePath} fill="none" stroke="var(--green-deep)" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={i === points.length - 1 ? 2 : 1.2}
                  fill="var(--green-deep)"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-dg-bg px-4 py-3.5 md:px-5">
          {['게임 참여', '결과 확인', '재방문'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-dg-ink md:text-[13px]">{step}</span>
              {i < arr.length - 1 && (
                <span className="text-dg-ink-soft/40" aria-hidden="true">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-[13px] text-dg-ink-soft">참여부터 재방문까지, 한눈에 확인합니다</p>
    </div>
  )
}

export function DifferenceSection() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">무엇이 다른가</p>
          <h2 className="mt-3 text-[32px] leading-tight text-dg-ink md:text-[44px]">
            게임은 시작일 뿐입니다
            <br />
            <span className="text-dg-green-deep">남는 것은 고객입니다</span>
          </h2>
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-[20px] text-dg-ink">게임이 목적이 아닙니다</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-dg-ink-soft">
                게임은 손님을 움직이게 만드는 첫 번째 이유입니다.
              </p>
            </div>
            <div>
              <h3 className="text-[20px] text-dg-ink">참여에서 끝나지 않습니다</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-dg-ink-soft">
                참여 이후의 행동까지 확인하고, 다음 방문으로 연결합니다.
              </p>
            </div>
            <div>
              <h3 className="text-[20px] text-dg-ink">광고로 끝나지 않습니다</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-dg-ink-soft">
                새 손님을 데려오는 것보다, 한 번 온 손님을 다시 오게 만듭니다.
              </p>
            </div>
          </div>
        </div>
        <ImpactDashboardMock />
      </div>
    </section>
  )
}

export function ProofSection() {
  const funnel = [
    { label: '게임 참여', value: '1,000명' },
    { label: '매장으로 돌아온 손님', value: '380명', percent: '38%' },
    { label: '두 번째로 재방문한 손님', value: '218명', percent: '22%' },
    { label: '완전한 단골이 된 손님', value: '126명', percent: '13%' },
  ]

  return (
    <section id="proof" className="scroll-mt-20">
      {/* 상단 블록 — 데이터로 증명 (어두운 톤) */}
      <div className="bg-[#141414] pb-16 pt-20 text-white md:pb-20 md:pt-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-[13px] font-semibold tracking-wide text-dg-green">데이터로 증명</p>
            <h2 className="mt-3 text-[32px] md:text-[44px]">게임 한 번이, 단골 한 명이 됩니다</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/55">
              참여자 10명 중 3명은 당근 단골 추가를 눌러요. 매장 규모가 커질수록 그만큼 더 늘어나요.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="border border-white/10 p-5" style={{ borderRadius: 6 }}>
              <p className="text-[12px] text-white/45">재방문율</p>
              <p className="mt-2 whitespace-nowrap font-num text-[32px] font-bold sm:text-[36px] md:text-[44px]">
                12% → <span className="text-dg-green">32%</span>
              </p>
                <p className="mt-2 text-[13px] text-white/55">게임 시작 6개월 만에, 거의 3배가 됐어요</p>
              </div>
              <div className="border border-white/10 p-5" style={{ borderRadius: 6 }}>
              <p className="text-[12px] text-white/45">누적 추정 재방문 매출</p>
              <p className="mt-2 whitespace-nowrap font-num text-[28px] font-bold text-dg-green sm:text-[32px]">
                2,100만원+
              </p>
                <p className="mt-2 text-[13px] text-white/55">구독료의 수십배 이득*</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-white/45">
              {funnel.map((item, i) => (
                <span key={item.label} className="flex items-center gap-2">
                  <span>
                    {item.label} <span className="font-num text-white/80">{item.value}</span>
                    {item.percent && <span className="text-dg-green"> ({item.percent})</span>}
                  </span>
                  {i < funnel.length - 1 && <span className="text-white/25">→</span>}
                </span>
              ))}
            </div>
          </div>
          <ScreenshotSlot shotId="10" tone="dark" fit="contain" />
        </div>
      </div>

      {/* 전환 구간 — 증명(어두운 톤) → 손익 계산(밝은 톤)으로 자연스럽게 이어지도록 */}
      <div className="h-16 bg-gradient-to-b from-[#141414] to-white md:h-20" aria-hidden />

      {/* 하단 블록 — 매장 손익 계산 (밝은 톤) */}
      <div className="bg-white pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl px-5">
          <h3 className="text-center text-[22px] font-bold text-dg-ink md:text-[26px]">
            그래서, 우리 매장은 얼마나 남을까요?
          </h3>
          <div className="mt-8">
            <RoiCalculator />
          </div>
          <p className="mt-6 text-[12px] text-dg-ink-soft">
            ※ 본 자료의 수치(재방문율, 매출 기여, 참여율, 손익 계산 포함)는 이해를 돕기 위한 예시 데이터입니다.
            실제 성과는 업종·매장 조건에 따라 달라질 수 있습니다.
          </p>
        </div>
      </div>
    </section>
  )
}

/** "당근 마케팅을 왜 해야 하는가"에 대한 설득 논리를 담는 섹션 —
 *  데이터로 증명(재방문 성과) 다음, 채널과 운영(당근·카카오·게임 연동 흐름) 앞에 위치해
 *  "당근이 왜 좋은 채널인지 → 그래서 어떻게 연동되는지"로 자연스럽게 이어지도록 한다. */
export function CarrotChannelSection() {
  const reasons = [
    {
      icon: MapPin,
      title: '지역 기반',
      body: '우리 매장 반경 손님에게만 정확히 도달합니다',
    },
    {
      icon: Smartphone,
      title: '이미 쓰는 채널',
      body: '별도 앱 설치나 학습 없이 바로 시작합니다',
    },
    {
      icon: HeartHandshake,
      title: '신뢰 기반',
      body: "'이웃'이라는 정서가 실제 방문 전환으로 이어집니다",
    },
  ]

  return (
    <section className="bg-dg-bg py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">당근 연동</p>
        <h2 className="mt-3 text-[32px] leading-tight text-dg-ink md:text-[44px]">
          당근에서 고객을 만나고,
          <br />
          게임으로 다시 연결합니다
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-dg-ink-soft md:text-[17px]">
          당근마켓은 이미 누적 가입자 4,000만 명, 월간 활성 이용자(MAU) 2,300만 명이 넘는 우리 동네 채널입니다. 새
          광고 채널을 따로 배울 필요 없이, 이미 손님이 매일 들여다보는 곳에서 매장을 알리고, 그 손님을 게임으로
          다시 연결합니다.
        </p>
        <p className="mt-3 text-[12px] text-dg-ink-soft/70">
          ※ 누적 가입자 4,000만 명(당근 자체 발표, 2024년 10월 기준), MAU 2,300만 명(와이즈앱·리테일 조사, 2026년
          1분기 기준)
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-5xl px-5">
        <p className="text-center text-[13px] font-semibold tracking-wide text-dg-ink-soft">왜 당근인가</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {reasons.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="border border-dg-line bg-white p-6 text-center"
              style={{ borderRadius: 6 }}
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-dg-green-tint text-dg-green-deep">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-[16px] font-bold text-dg-ink">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-dg-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** 유튜브 쇼츠(세로 9:16)를 폰 프레임과 비슷한 비율로 재생하는 임베드. */
function ChannelVideoEmbed() {
  return (
    <div
      className="relative mx-auto w-full max-w-[300px] overflow-hidden border border-dg-line bg-black shadow-[0_20px_48px_rgba(0,0,0,0.18)]"
      style={{ aspectRatio: '9 / 16', borderRadius: 12 }}
    >
      <iframe
        className="absolute inset-0 h-full w-full"
        src="https://www.youtube.com/embed/zASgln9XkCs?start=15"
        title="당근 단골이 많으면 좋은 이유"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}

export function ChannelTrust() {
  const roles = [
    { name: '당근', role: '지역 고객 유입' },
    { name: '카카오', role: '고객 참여 및 로그인' },
    { name: '게임', role: '참여를 만드는 장치' },
    { name: '쿠폰', role: '방문을 만드는 혜택' },
    { name: '데이터', role: '재방문 성과 측정' },
  ]

  const ops = [
    { n: '1', title: '고객이 게임합니다', body: 'QR을 찍고 게임 참여' },
    { n: '2', title: '고객이 단골이 됩니다', body: '당근마켓 단골 추가' },
    { n: '3', title: '고객이 다시 방문합니다', body: '계산대 QR로 쿠폰 사용' },
  ]

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">채널과 운영</p>
            <h2 className="mt-3 text-[32px] text-dg-ink md:text-[44px]">단골팅 시스템 소개</h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-dg-ink-soft">
              당근, 카카오, 게임, 쿠폰, 데이터 — 앞서 하나씩 살펴본 요소들이 이렇게 하나로 연결됩니다.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {roles.map((row) => (
                <div
                  key={row.name}
                  className="flex min-h-[104px] flex-col justify-center border border-dg-line bg-dg-bg px-4 py-4"
                  style={{ borderRadius: 6 }}
                >
                  <p className="text-[15px] font-semibold text-dg-ink">{row.name}</p>
                  <p className="mt-1.5 text-[13px] leading-snug text-dg-ink-soft">{row.role}</p>
                </div>
              ))}
              <div
                className="flex min-h-[104px] flex-col items-start justify-center bg-dg-green px-4 py-4"
                style={{ borderRadius: 6 }}
              >
                <p className="text-[17px] font-extrabold leading-snug tracking-tight text-dg-ink">연동됩니다</p>
                <p className="mt-1.5 text-[13px] leading-snug text-dg-ink/70">따로 관리할 필요 없이</p>
              </div>
            </div>
          </div>
          <ChannelVideoEmbed />
        </div>

        <p className="mt-14 text-[13px] font-semibold tracking-wide text-dg-green-deep">전체 흐름 요약</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {ops.map((item) => (
            <article key={item.n} className="border border-dg-line bg-dg-bg p-6" style={{ borderRadius: 6 }}>
              <p className="font-num text-[12px] text-dg-green-deep">{item.n}</p>
              <h3 className="mt-2 text-[20px] text-dg-ink">{item.title}</h3>
              <p className="mt-2 text-[14px] text-dg-ink-soft">{item.body}</p>
            </article>
          ))}
        </div>

        <p className="mt-6 text-[12px] text-dg-ink-soft">
          ※ 카카오·당근마켓은 연동됩니다. 확인되지 않은 제휴 표현은 사용하지 않습니다.
        </p>
      </div>
    </section>
  )
}

export function PricingSection() {
  const [applyOpen, setApplyOpen] = useState(false)
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const basic = PRICING.basic
  const aeo = PRICING.aeo

  function copyBank(text: string, key: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 1500)
    })
  }

  return (
    <section id="pricing" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">요금제</p>
        <h2 className="mt-3 text-[32px] text-dg-ink md:text-[44px]">지금 가입하면, 이 가격입니다</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* 베이직 — 판매중, 강조 */}
          <motion.article
            className="relative overflow-visible border-2 border-dg-green bg-white p-7"
            style={{ borderRadius: 10 }}
            animate={{
              boxShadow: [
                '0 0 0px 0px rgba(0,199,167,0)',
                '0 0 28px 4px rgba(0,199,167,0.35)',
                '0 0 0px 0px rgba(0,199,167,0)',
              ],
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* 리본형 배지 — 카드 좌측 상단 코너 */}
            <div className="absolute -left-2 -top-2 z-10 h-[86px] w-[86px] overflow-hidden">
              <span
                className="absolute left-[-38px] top-[16px] block w-[160px] -rotate-45 bg-dg-gold py-1.5 text-center text-[10.5px] font-bold text-white shadow-[0_4px_10px_rgba(184,134,47,0.4)]"
              >
                {basic.ribbonLabel}
              </span>
            </div>

            <h3 className="mt-10 text-[26px] font-bold text-dg-ink">{basic.name}</h3>

            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-num text-[16px] font-medium text-dg-ink-soft line-through decoration-2 decoration-dg-danger">
                  {formatMonthlyPrice(basic.regularPrice)}
                </p>
                <span className="text-dg-ink-soft">→</span>
                <span
                  className="inline-flex items-center bg-dg-green px-2 py-0.5 text-[12px] font-extrabold text-dg-ink"
                  style={{ borderRadius: 4 }}
                >
                  {PRICING_BASIC_DISCOUNT_PERCENT}% 할인
                </span>
              </div>
              <p className="mt-1 font-num text-[54px] font-bold leading-none text-dg-green-deep">
                {formatMonthlyPrice(basic.promoPrice)}
              </p>
              <p className="mt-2.5 text-[14px] text-dg-ink">
                + 초기 세팅비 {formatWon(basic.setupFee)} (최초 1회)
              </p>
              <p className="mt-1 text-[12px] text-dg-ink-soft">모든 요금 VAT 포함</p>
            </div>

            <ul className="mt-6 space-y-3">
              {basic.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-[15px] text-dg-ink">
                  <span className="text-dg-green">•</span>
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] leading-relaxed text-dg-ink-soft">{basic.qrPrintNote}</p>

            {/* 안심 문구 블록 */}
            <div className="mt-6 border border-dg-green/30 bg-dg-green-tint p-4" style={{ borderRadius: 8 }}>
              <p className="text-[13px] font-bold text-dg-ink">이 가격에 뭐가 더 필요하냐고요? 없습니다.</p>
              <ul className="mt-3 space-y-2">
                {basic.reassurance.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-[13px] text-dg-ink">
                    <Check size={15} className="mt-0.5 shrink-0 text-dg-green-deep" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {/* 오늘 결제하실 금액 — 총 결제 안내 */}
            <div className="mt-5 border border-dg-ink/15 bg-dg-bg p-4" style={{ borderRadius: 8 }}>
              <p className="text-[12px] font-semibold text-dg-ink-soft">오늘 결제하실 금액</p>
              <p className="mt-1 text-[13px] text-dg-ink-soft">
                초기 세팅비 {formatWon(basic.setupFee)} + 첫 달 이용료 {formatWon(basic.promoPrice)}
              </p>
              <p className="mt-1.5 font-num text-[24px] font-bold text-dg-ink">
                {formatWon(PRICING_BASIC_TODAY_TOTAL)}
              </p>
            </div>
          </motion.article>

          {/* AEO마케팅 — 준비중, 톤다운 */}
          <article
            className="relative overflow-hidden border border-dg-line bg-dg-bg/60 p-7 opacity-90"
            style={{ borderRadius: 10 }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center border border-dg-ink-soft/30 bg-white px-2.5 py-1 text-[11px] font-bold text-dg-ink-soft"
                style={{ borderRadius: 999 }}
              >
                준비중 · Coming Soon
              </span>
            </div>

            <h3 className="mt-4 text-[26px] font-bold text-dg-ink-soft">{aeo.name}</h3>

            <p className="mt-4 text-[15px] font-bold text-dg-ink-soft">{aeo.subheadline}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-dg-ink-soft">{aeo.description}</p>

            <p className="mt-6 font-num text-[26px] font-bold text-dg-ink-soft">
              {formatWon(aeo.price)} <span className="text-[14px] font-normal">(1회) · 출시 예정</span>
            </p>
            <p className="mt-1 text-[12px] text-dg-ink-soft">모든 요금 VAT 별도</p>

            <button
              type="button"
              onClick={() => setWaitlistOpen(true)}
              className="mt-7 min-h-[52px] w-full border border-dg-ink-soft/40 bg-white py-3.5 text-[15px] font-bold text-dg-ink-soft transition-colors hover:border-dg-ink hover:text-dg-ink"
              style={{ borderRadius: 6 }}
            >
              출시 알림 받기
            </button>

            <p className="mt-4 text-center text-[12px] text-dg-ink-soft">{aeo.launchNote}</p>
          </article>
        </div>

        {/* 구분 — 요금제 안내와 별도 이벤트 참여는 다른 성격의 콘텐츠임을 명확히 */}
        <div className="mt-14 border-t border-dg-line pt-14">
          <div className="text-center">
            <h3 className="text-[24px] font-bold text-dg-ink md:text-[28px]">{LAUNCH_EVENT.headline}</h3>
            <p className="mt-2 text-[14px] text-dg-ink-soft">{LAUNCH_EVENT.subcopy}</p>
          </div>

          <div
            className="mx-auto mt-7 max-w-xl border-2 border-dg-gold bg-gradient-to-b from-dg-cream to-white p-7 text-center shadow-[0_20px_48px_rgba(217,169,79,0.18)]"
            style={{ borderRadius: 12 }}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center bg-dg-gold" style={{ borderRadius: 999 }}>
              <Gift size={22} className="text-white" />
            </div>
            <p className="mt-3 text-[19px] font-bold text-dg-ink">{LAUNCH_EVENT.cardTitle}</p>

            <ul className="mt-5 space-y-2 text-left">
              {LAUNCH_EVENT.prizes.map((prize) => (
                <li key={prize} className="flex items-center gap-2 text-[14px] text-dg-ink">
                  <span className="text-dg-gold-deep">🎁</span>
                  {prize}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[12px] font-semibold text-dg-green-deep">{LAUNCH_EVENT.note}</p>

            <a
              href={LAUNCH_EVENT.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex min-h-[52px] w-full items-center justify-center bg-dg-gold text-[15px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ borderRadius: 6 }}
            >
              {LAUNCH_EVENT.ctaLabel}
            </a>
          </div>

          {/* 최종 CTA */}
          <div className="mx-auto mt-10 max-w-xl">
            <button
              type="button"
              onClick={() => setApplyOpen(true)}
              className="min-h-[56px] w-full py-4 text-[17px] font-bold text-dg-ink transition-opacity hover:opacity-90"
              style={{ borderRadius: 6, background: 'linear-gradient(180deg, #00E0BB 0%, #00C7A7 100%)' }}
            >
              지금 신청하기
            </button>
          </div>

          {/* 입금 계좌 안내 — 폼을 거치지 않아도 바로 확인 가능하도록 섹션 하단에 상시 노출 */}
          <div
            className="mx-auto mt-10 max-w-xl border border-dg-line bg-white p-6"
            style={{ borderRadius: 10 }}
          >
            <p className="text-[14px] font-bold text-dg-ink">입금 계좌 안내</p>
            <div className="mt-4 space-y-3">
              <BankRow
                label="은행"
                value={BANK_ACCOUNT.bank}
                copied={copiedKey === 'section-bank'}
                onCopy={() => copyBank(BANK_ACCOUNT.bank, 'section-bank')}
              />
              <BankRow
                label="계좌번호"
                value={BANK_ACCOUNT.account}
                copied={copiedKey === 'section-account'}
                onCopy={() => copyBank(BANK_ACCOUNT.account, 'section-account')}
              />
              <BankRow
                label="예금주"
                value={BANK_ACCOUNT.holder}
                copied={copiedKey === 'section-holder'}
                onCopy={() => copyBank(BANK_ACCOUNT.holder, 'section-holder')}
              />
            </div>
            <div className="mt-4 border-t border-dg-line pt-4">
              <p className="text-[13px] text-dg-ink-soft">첫 달 결제 금액</p>
              <p className="mt-1 font-num text-[20px] font-bold text-dg-ink">
                {formatWon(PRICING_BASIC_TODAY_TOTAL)}
                <span className="ml-1.5 text-[12px] font-normal text-dg-ink-soft">
                  (설치비 {formatWon(basic.setupFee)} + 1개월 구독료 {formatWon(basic.promoPrice)})
                </span>
              </p>
            </div>
            <p className="mt-3 text-[13px] text-dg-ink-soft">
              입금자명은 <b className="font-semibold text-dg-ink">매장명</b>으로 해주세요
            </p>
          </div>
        </div>
      </div>

      {applyOpen && <BasicApplyModal onClose={() => setApplyOpen(false)} />}
      {waitlistOpen && <AeoWaitlistModal onClose={() => setWaitlistOpen(false)} />}
    </section>
  )
}

export function FinalCta({ onCta }: CtaProps) {
  return (
    <section className="bg-dg-green py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <p className="text-[14px] font-semibold" style={{ color: 'rgba(34,34,34,0.7)' }}>손님은 이미 왔습니다</p>
        <h2 className="mt-3 text-[34px] leading-tight text-dg-ink md:text-[52px]">
          이제 그 손님이
          <br />
          다시 올 이유를 만들어주세요
        </h2>
        <p className="mt-5 text-[16px]" style={{ color: 'rgba(34,34,34,0.75)' }}>
          광고는 첫 만남을 만듭니다. 단골팅은 두 번째 만남부터 설계합니다.
        </p>
        <button
          type="button"
          onClick={onCta}
          className="mt-10 bg-white px-8 py-4 text-[15px] font-bold text-dg-ink transition-transform hover:-translate-y-0.5"
          style={{ borderRadius: 4 }}
        >
          우리 매장 재방문 설계하기
        </button>
      </div>
    </section>
  )
}

function FooterInfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="shrink-0 text-dg-ink-soft">{label}</span>
      <span className="text-dg-ink/80">{children}</span>
    </li>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-dg-line bg-dg-bg pb-8 pt-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="font-han text-[28px] text-dg-ink">
              단골<span className="text-dg-green">팅</span>
            </p>
            <p className="mt-3 max-w-[220px] text-[14px] leading-relaxed text-dg-ink-soft">
              손님을 모으는 게 아니라 다시 오게 만듭니다
            </p>
            <p className="mt-4 text-[13px] text-dg-ink-soft">광고 → 게임 → 단골 → 쿠폰 → 재방문</p>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-dg-ink">서비스</p>
            <ul className="mt-4 space-y-3 text-[14px] text-dg-ink-soft">
              <li><a href="#service" className="inline-flex min-h-[24px] items-center hover:text-dg-ink">단골팅 게임</a></li>
              <li><a href="#process" className="inline-flex min-h-[24px] items-center hover:text-dg-ink">작동 원리</a></li>
              <li><a href="#pricing" className="inline-flex min-h-[24px] items-center hover:text-dg-ink">요금제</a></li>
              <li><a href="#proof" className="inline-flex min-h-[24px] items-center hover:text-dg-ink">도입 성과</a></li>
            </ul>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-dg-ink">회사 정보</p>
            <ul className="mt-4 space-y-2 text-[13px] leading-relaxed">
              <FooterInfoRow label="상호">아크웍스(ARK WORKS)</FooterInfoRow>
              <FooterInfoRow label="대표">양경직</FooterInfoRow>
              <FooterInfoRow label="사업자등록번호">628-33-01601</FooterInfoRow>
              <FooterInfoRow label="통신판매업신고번호">제 2026-충남천안-1482호</FooterInfoRow>
              <FooterInfoRow label="주소">충남 천안시 서북구 2공단5로 52, 룩소르비즈타워 863호</FooterInfoRow>
              <FooterInfoRow label="대표전화">
                <a href="tel:16883893" className="hover:text-dg-ink hover:underline">1688-3893</a>
              </FooterInfoRow>
              <FooterInfoRow label="이메일">
                <a href="mailto:yangpro03@gmail.com" className="hover:text-dg-ink hover:underline">yangpro03@gmail.com</a>
              </FooterInfoRow>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-dg-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-5 text-[13px] text-dg-ink-soft">
            <a href="/privacy" className="inline-flex min-h-[24px] items-center hover:text-dg-ink">개인정보처리방침</a>
            <a href="/terms" className="inline-flex min-h-[24px] items-center hover:text-dg-ink">이용약관</a>
          </div>
          <p className="text-[12px] text-dg-ink-soft">© {new Date().getFullYear()} 아크웍스(단골팅). All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
