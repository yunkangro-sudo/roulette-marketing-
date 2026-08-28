'use client'

import { useState, useRef, type TouchEvent } from 'react'
import { Quote, Megaphone, Eye, Footprints, HelpCircle, ArrowRight, Repeat } from 'lucide-react'
import ScreenshotSlot from './ScreenshotSlot'
import BeforeAfterSlider from './BeforeAfterSlider'
import { PRICING, formatMonthlyPrice } from '@/lib/landing-v5/config'

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

/** 문제제기 섹션 우측 시각물 — "광고→노출→방문" 다음 화살표가 물음표에서 끊기는 다이어그램.
 *  회색 톤으로만 구성해 "불확실함"을 표현한다(그린은 이 다이어그램 안에는 쓰지 않음 — 문제는 아직 해결 전 상태). */
function AdUncertaintyDiagram() {
  const chain = [
    { icon: Megaphone, label: '광고' },
    { icon: Eye, label: '노출' },
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
          <span className="text-[12px] font-semibold text-dg-ink-soft/40">???</span>
        </div>
      </div>
      <p className="mt-7 text-center text-[13px] leading-relaxed text-dg-ink-soft/80">
        그 손님이 다시 왔는지, 광고는 알려주지 않습니다
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
              손님이 와도
              <br />
              광고비는 이미 나갔습니다
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-dg-ink-soft md:text-[17px]">
              네이버, 인스타그램, 당근 광고로 손님을 데려오는 것까지는 가능합니다. 밥을 먹고, 결제하고, 손님은 나갑니다. 그 손님이 다시 왔는지는 광고가 알려주지 않습니다. 사장님은 그 손님이 누구인지도 모릅니다.
            </p>
            <div className="relative mt-10 overflow-hidden bg-[#171717] px-6 py-8 pl-8 text-white shadow-[0_20px_44px_rgba(0,0,0,0.28)] md:px-10 md:pl-12" style={{ borderRadius: 6 }}>
              <span className="absolute inset-y-0 left-0 w-1 bg-dg-green" />
              <Quote size={20} strokeWidth={2.25} className="mb-3 text-dg-green" />
              <p className="text-[24px] font-extrabold leading-snug tracking-tight md:text-[32px]">
                한 번 온 손님을 그냥 보내지 않는 것.
                <br />
                단골팅은 여기서 시작합니다.
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

/** 포지셔닝 전환 섹션 좌측 시각물 — 회색 "광고" 아이콘이 화살표를 거쳐 그린 "마케팅" 아이콘으로
 *  전환되는 미니 다이어그램. 문제제기 섹션과 좌우가 반대라 스크롤 리듬이 생긴다. */
function AdToMarketingDiagram() {
  return (
    <div className="rounded-2xl border border-dg-line bg-dg-bg p-8 shadow-[0_20px_48px_rgba(17,17,17,0.06)]">
      <div className="flex items-center justify-center gap-5">
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-dg-ink-soft shadow-sm">
            <Megaphone size={24} strokeWidth={1.75} />
          </span>
          <span className="text-[13px] font-semibold text-dg-ink-soft">광고</span>
        </div>
        <ArrowRight size={20} className="text-dg-ink-soft/30" />
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-dg-green text-dg-ink shadow-sm">
            <Repeat size={24} strokeWidth={1.75} />
          </span>
          <span className="text-[13px] font-bold text-dg-ink">마케팅</span>
        </div>
      </div>
      <p className="mt-7 text-center text-[13px] leading-relaxed text-dg-ink-soft">
        한 번의 방문에서, 반복되는 방문으로
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
            <AdToMarketingDiagram />
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

        <BeforeAfterSlider />
      </div>
    </section>
  )
}

export function DifferenceSection() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">무엇이 다른가</p>
          <h2 className="mt-3 text-[32px] leading-tight text-dg-ink md:text-[44px]">
            게임으로 끝내지 않습니다
          </h2>
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-[20px] text-dg-ink">게임이 목적이 아닙니다</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-dg-ink-soft">
                게임은 고객을 움직이게 만드는 첫 번째 장치입니다.
              </p>
            </div>
            <div>
              <h3 className="text-[20px] text-dg-ink">정보 수집으로 끝나지 않습니다</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-dg-ink-soft">
                카카오 로그인과 당근마켓 단골 전환을 함께 연결합니다. &quot;누가 참여했는가&quot;가 아니라 &quot;누가 다시 오는가&quot;까지 봅니다.
              </p>
            </div>
          </div>
        </div>
        <ScreenshotSlot shotId="01" caption="로그인 없이 바로 시작" />
      </div>
    </section>
  )
}

export function ProofSection() {
  const funnel = [
    { label: '게임 참여', value: '1,000명' },
    { label: '쿠폰 사용', value: '380명' },
    { label: '2회 방문', value: '210명' },
    { label: '3회 이상 방문', value: '126명' },
    { label: '30일 재방문율', value: '32%' },
  ]

  return (
    <section id="proof" className="scroll-mt-20 bg-[#141414] py-20 text-white md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-[13px] font-semibold tracking-wide text-dg-green">데이터로 증명</p>
          <h2 className="mt-3 text-[32px] md:text-[44px]">다시 오는 숫자가 남습니다</h2>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {funnel.map((item, i) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="border border-white/15 bg-white/5 px-3 py-2 text-[13px]"
                  style={{ borderRadius: 4 }}
                >
                  <span className="block text-[11px] text-white/45">{item.label}</span>
                  <span className="font-num text-dg-green">{item.value}</span>
                </span>
                {i < funnel.length - 1 && <span className="text-white/25">→</span>}
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="border border-white/10 p-5" style={{ borderRadius: 6 }}>
              <p className="text-[12px] text-white/45">6개월 재방문율 변화</p>
              <p className="mt-2 font-num text-[36px] font-bold">
                12% → <span className="text-dg-green">32%</span>
              </p>
            </div>
            <div className="border border-white/10 p-5" style={{ borderRadius: 6 }}>
              <p className="text-[12px] text-white/45">누적 추정 재방문 매출</p>
              <p className="mt-2 font-num text-[36px] font-bold text-dg-green">2,100만원+</p>
            </div>
          </div>
        </div>
        <ScreenshotSlot shotId="10" tone="dark" />
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-5 text-[12px] text-white/40">
        ※ 실제 운영 데이터가 축적되기 전까지는 예시·시뮬레이션 수치로 표기합니다.
      </p>
    </section>
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
            <h2 className="mt-3 text-[32px] text-dg-ink md:text-[44px]">흩어지지 않고 한 흐름으로</h2>
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
          <ScreenshotSlot shotId="12" />
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
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

export function PricingSection({ onCta }: CtaProps) {
  const plans = [PRICING.basic, PRICING.full]
  const [activeIdx, setActiveIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const goTo = (idx: number) => setActiveIdx((idx + plans.length) % plans.length)

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) {
      goTo(activeIdx + (delta < 0 ? 1 : -1))
    }
    touchStartX.current = null
  }

  const plan = plans[activeIdx]
  const featured = plan.id === 'full'

  return (
    <section id="pricing" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">요금제</p>
        <h2 className="mt-3 text-[32px] text-dg-ink md:text-[44px]">매장 규모에 맞게 시작하세요</h2>

        {/* 탭 */}
        <div
          role="tablist"
          aria-label="요금제 선택"
          className="mt-10 inline-flex rounded-full border border-dg-line bg-white p-1"
        >
          {plans.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === activeIdx}
              onClick={() => setActiveIdx(i)}
              className={`min-h-[44px] rounded-full px-6 text-[14px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dg-green ${
                i === activeIdx ? 'bg-dg-ink text-white' : 'text-dg-ink-soft hover:text-dg-ink'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div
          className="mt-6 max-w-xl"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <article
            key={plan.id}
            className={`border p-7 ${featured ? 'border-dg-green bg-white' : 'border-dg-line bg-white'}`}
            style={{ borderRadius: 6 }}
          >
            <p className="text-[13px] font-semibold text-dg-ink-soft">{plan.hint}</p>
            <h3 className="mt-2 text-[28px] text-dg-ink">{plan.name}</h3>
            <p className="mt-4 font-num text-[36px] font-bold text-dg-ink">{formatMonthlyPrice(plan.monthlyPrice)}</p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-[15px] text-dg-ink">
                  <span className="text-dg-green">•</span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onCta}
              className={`mt-8 min-h-[44px] w-full py-3.5 text-[14px] font-bold transition-opacity hover:opacity-90 ${
                featured ? 'bg-dg-green text-dg-ink' : 'border border-dg-ink bg-white text-dg-ink'
              }`}
              style={{ borderRadius: 4 }}
            >
              우리 매장 재방문 설계하기
            </button>
          </article>
        </div>

        {/* 페이지네이션 점 */}
        <div className="mt-6 flex items-center gap-2">
          {plans.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`${p.name} 요금제 보기`}
              onClick={() => setActiveIdx(i)}
              className="flex h-11 w-11 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dg-green"
            >
              <span
                className={`block h-2 rounded-full transition-all ${
                  i === activeIdx ? 'w-6 bg-dg-ink' : 'w-2 bg-dg-line'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
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
            <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-dg-ink-soft">
              <li>상호명: 단골팅</li>
              <li>대표: 대표자명</li>
              <li>사업자등록번호: 000-00-00000</li>
              <li>주소: 사업장 주소 입력</li>
              <li>고객센터: 카카오톡 채널 문의</li>
              <li>이메일: contact@dgting.co.kr</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-dg-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-5 text-[13px] text-dg-ink-soft">
            <a href="/privacy" className="inline-flex min-h-[24px] items-center hover:text-dg-ink">개인정보처리방침</a>
            <a href="/terms" className="inline-flex min-h-[24px] items-center hover:text-dg-ink">이용약관</a>
          </div>
          <p className="text-[12px] text-dg-ink-soft">© {new Date().getFullYear()} 단골팅. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
