import ScreenshotSlot from './ScreenshotSlot'
import BeforeAfterSlider from './BeforeAfterSlider'
import { PRICING, formatMonthlyPrice } from '@/lib/landing-v5/config'

type CtaProps = { onCta: () => void }

export function ProductShowcase() {
  return (
    <section id="service" className="scroll-mt-20 bg-[#141414] py-20 text-white md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green">실제 제품</p>
        <h2 className="mt-3 max-w-2xl text-[32px] leading-tight md:text-[44px]">
          손님이 실제로 보는
          <br />
          단골팅 게임 화면
        </h2>
        <div className="mt-12 flex gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          <div className="min-w-[220px] flex-1">
            <ScreenshotSlot shotId="01" tone="dark" />
          </div>
          <div className="min-w-[220px] flex-1">
            <ScreenshotSlot shotId="05" tone="dark" />
          </div>
          <div className="min-w-[220px] flex-1">
            <ScreenshotSlot shotId="09" tone="dark" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function ProblemSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5">
        <h2 className="text-[32px] leading-tight text-dg-ink md:text-[48px]">
          손님이 와도
          <br />
          광고비는 이미 나갔습니다
        </h2>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-dg-ink-soft md:text-[18px]">
          네이버, 인스타그램, 당근 광고로 손님을 데려오는 것까지는 가능합니다. 밥을 먹고, 결제하고, 손님은 나갑니다. 그 손님이 다시 왔는지는 광고가 알려주지 않습니다. 사장님은 그 손님이 누구인지도 모릅니다.
        </p>
        <div className="mt-10 bg-[#171717] px-6 py-8 text-white md:px-10" style={{ borderRadius: 6 }}>
          <p className="font-han text-[24px] leading-snug md:text-[32px]">
            한 번 온 손님을 그냥 보내지 않는 것.
            <br />
            단골팅은 여기서 시작합니다.
          </p>
        </div>
      </div>
    </section>
  )
}

export function PositioningSection() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5">
        <h2 className="text-[32px] leading-tight text-dg-ink md:text-[48px]">
          첫 방문을 만드는 광고에서
          <br />
          <span className="text-dg-green-deep">두 번째 방문을 만드는 마케팅</span>으로.
        </h2>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-dg-ink-soft md:text-[18px]">
          새 손님을 계속 사오는 것만으로는 매장이 성장하기 어렵습니다. 한 번 온 손님이 다시 오고, 또 오게 만드는 것 — 단골팅은 광고 이후의 고객 행동을 설계합니다.
        </p>
      </div>
    </section>
  )
}

export function HowItWorks() {
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

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.n} className="border border-dg-line bg-white p-5" style={{ borderRadius: 6 }}>
              <p className="font-num text-[12px] tracking-widest text-dg-green-deep">{step.n}</p>
              <h3 className="mt-3 text-[24px] text-dg-ink">{step.title}</h3>
              <p className="mt-3 min-h-[72px] text-[14px] leading-relaxed text-dg-ink-soft">{step.body}</p>
              <div className="mt-6">
                <ScreenshotSlot shotId={step.shot} />
              </div>
            </article>
          ))}
        </div>

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
    <section className="bg-[#141414] py-20 text-white md:py-28">
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
              <p className="mt-2 font-han text-[36px]">
                12% → <span className="text-dg-green">32%</span>
              </p>
            </div>
            <div className="border border-white/10 p-5" style={{ borderRadius: 6 }}>
              <p className="text-[12px] text-white/45">누적 추정 재방문 매출</p>
              <p className="mt-2 font-han text-[36px] text-dg-green">2,100만원+</p>
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
            <div className="mt-8 overflow-hidden border border-dg-line" style={{ borderRadius: 6 }}>
              {roles.map((row, i) => (
                <div
                  key={row.name}
                  className={`grid grid-cols-[120px_1fr] ${i !== 0 ? 'border-t border-dg-line' : ''}`}
                >
                  <div className="bg-dg-bg px-4 py-3 text-[14px] font-semibold text-dg-ink">{row.name}</div>
                  <div className="px-4 py-3 text-[14px] text-dg-ink-soft">{row.role}</div>
                </div>
              ))}
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

  return (
    <section id="pricing" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">요금제</p>
        <h2 className="mt-3 text-[32px] text-dg-ink md:text-[44px]">매장 규모에 맞게 시작하세요</h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const featured = plan.id === 'full'
            return (
              <article
                key={plan.id}
                className={`border p-7 ${featured ? 'border-dg-green bg-white' : 'border-dg-line bg-white'}`}
                style={{ borderRadius: 6 }}
              >
                <p className="text-[13px] font-semibold text-dg-ink-soft">{plan.hint}</p>
                <h3 className="mt-2 text-[28px] text-dg-ink">{plan.name}</h3>
                <p className="mt-4 font-han text-[36px] text-dg-ink">{formatMonthlyPrice(plan.monthlyPrice)}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-[14px] text-dg-ink">
                      <span className="text-dg-green">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={onCta}
                  className={`mt-8 w-full py-3.5 text-[14px] font-bold transition-opacity hover:opacity-90 ${
                    featured ? 'bg-dg-green text-dg-ink' : 'border border-dg-ink bg-white text-dg-ink'
                  }`}
                  style={{ borderRadius: 4 }}
                >
                  우리 매장 재방문 설계하기
                </button>
              </article>
            )
          })}
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
    <footer className="border-t border-dg-line bg-dg-bg py-14">
      <div className="mx-auto max-w-6xl px-5">
        <p className="font-han text-[28px] text-dg-ink">
          단골<span className="text-dg-green">팅</span>
        </p>
        <p className="mt-3 text-[15px] text-dg-ink">손님을 모으는 게 아니라 다시 오게 만듭니다</p>
        <p className="mt-8 text-[13px] text-dg-ink-soft">게임형 재방문 마케팅</p>
        <p className="mt-1 text-[13px] text-dg-ink-soft">광고 → 게임 → 단골 → 쿠폰 → 재방문</p>
        <div className="mt-8 flex gap-5 text-[13px] text-dg-ink-soft">
          <a href="/privacy" className="hover:text-dg-ink">개인정보처리방침</a>
          <a href="/terms" className="hover:text-dg-ink">이용약관</a>
        </div>
      </div>
    </footer>
  )
}
