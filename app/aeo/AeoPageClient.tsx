'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe,
  Link2,
  MessageCircle,
  Search,
  Sparkles,
  Store,
} from 'lucide-react'
import '@/components/landing-v5/landing-v5.css'
import Navbar from '@/components/landing-v5/Navbar'
import BottomBar from '@/components/landing-v5/BottomBar'
import { Footer } from '@/components/landing-v5/Sections'
import { PricingCalculatorModal } from '@/components/landing-v5/PricingModals'
import { HOMEPAGE_SERVICE, KAKAO_CONSULT_URL, SIGNUP_PATH, formatWon } from '@/lib/landing-v5/config'
import { AEO_FAQ } from './faq'

const SETUP_PRICE = formatWon(HOMEPAGE_SERVICE.setup.price)
const MONTHLY_PRICE = formatWon(HOMEPAGE_SERVICE.subscription.price)
const FREE_MONTHS = HOMEPAGE_SERVICE.subscription.freeMonths

const INCLUDED = [
  {
    icon: Store,
    title: '우리 가게 전용 홈페이지',
    body: '매장 소개, 메뉴·서비스, 위치, 영업시간, 연락처, 리뷰 연결까지. 손님이 궁금한 정보를 한 곳에 정리합니다.',
  },
  {
    icon: Globe,
    title: '독립 도메인 발급',
    body: '다른 플랫폼 안이 아니라, 우리 가게만의 주소를 갖게 됩니다. 명함·간판·문자에도 그대로 쓸 수 있어요.',
  },
  {
    icon: Search,
    title: '구글·네이버 등록',
    body: '검색엔진과 AI가 읽을 수 있도록 사이트 등록과 정보 구조 정리를 본사가 대신 진행합니다.',
    fine: '사이트맵 제출 · 구조화 데이터 적용 포함',
  },
  {
    icon: Link2,
    title: '단골팅과 연결',
    body: '게임, 쿠폰, 혜택이 홈페이지와 이어집니다. 사람에게는 다시 올 이유를, 검색에는 읽을 자료를 줍니다.',
  },
]

const STEPS = [
  { n: '1', title: '신청하고 입금', body: '요금 계산 창에서 상품을 확인하고, 안내된 계좌로 세팅비를 입금합니다.' },
  { n: '2', title: '자료만 전달', body: '네이버 플레이스 주소와 매장 사진을 전달해 주세요. 주소가 없어도 매장명으로 확인합니다.' },
  { n: '3', title: '본사가 제작·등록', body: '홈페이지 제작, 도메인 연결, 구글·네이버 등록까지 본사가 진행합니다.' },
]

function PriceBlock({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark'
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div
        className={`p-5 ${dark ? 'border border-white/15 bg-white/5' : 'border border-dg-line bg-white'}`}
        style={{ borderRadius: 10 }}
      >
        <p className={`text-[13px] font-semibold ${dark ? 'text-white/60' : 'text-dg-ink-soft'}`}>
          {HOMEPAGE_SERVICE.setup.label} · 최초 1회
        </p>
        <p className={`font-num mt-2 text-[30px] font-bold leading-none ${dark ? 'text-white' : 'text-dg-ink'}`}>
          {SETUP_PRICE}
        </p>
        <p className={`mt-2 text-[12px] ${dark ? 'text-white/50' : 'text-dg-ink-soft'}`}>VAT 포함</p>
      </div>
      <div
        className={`p-5 ${dark ? 'border border-dg-green/40 bg-white/5' : 'border border-dg-green bg-dg-green-tint'}`}
        style={{ borderRadius: 10 }}
      >
        <p className={`text-[13px] font-semibold ${dark ? 'text-dg-green' : 'text-dg-green-deep'}`}>
          월 구독료
        </p>
        <p className={`mt-2 text-[24px] font-bold leading-tight ${dark ? 'text-white' : 'text-dg-ink'}`}>
          첫 {FREE_MONTHS}개월 무료
        </p>
        <p className={`mt-2 text-[12px] ${dark ? 'text-white/60' : 'text-dg-ink-soft'}`}>
          {FREE_MONTHS + 1}개월차부터 월 {MONTHLY_PRICE}
        </p>
      </div>
    </div>
  )
}

export default function AeoPageClient() {
  const [calcOpen, setCalcOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const kakaoReady = Boolean(KAKAO_CONSULT_URL)

  const primaryCta = (extra = '') => (
    <button
      type="button"
      onClick={() => setCalcOpen(true)}
      className={`flex h-14 w-full items-center justify-center gap-2 bg-dg-green px-8 text-[16px] font-bold text-dg-ink transition-opacity hover:opacity-90 sm:w-auto ${extra}`}
      style={{ borderRadius: 8 }}
    >
      요금 계산하고 신청하기
      <ArrowRight size={18} strokeWidth={2.25} />
    </button>
  )

  return (
    <div className="landing-v5 min-h-screen">
      <Navbar />
      <main className="pt-16">
        {/* 1. 히어로 */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center md:py-24">
            <span
              className="inline-flex items-center gap-1.5 bg-dg-cream px-3 py-1.5 text-[12px] font-bold text-dg-gold-deep"
              style={{ borderRadius: 999 }}
            >
              <Sparkles size={13} strokeWidth={2.25} />
              AEO 미니홈피
            </span>
            <h1 className="mt-5 break-keep text-[30px] leading-[1.35] text-dg-ink md:text-[46px]">
              손님이 AI에게 묻는 시대,
              <br />
              우리 가게의 <span className="text-dg-green-deep">공식 자료</span>가 있나요?
            </h1>
            <p className="mx-auto mt-5 max-w-xl break-keep text-[15px] leading-relaxed text-dg-ink-soft md:text-[17px]">
              &ldquo;이 동네 괜찮은 가게 알려줘&rdquo; 이제 손님은 검색창보다 AI에게 먼저 묻기도 합니다.
              AI는 읽고 확인할 수 있는 정보가 있는 가게를 참고합니다.
            </p>

            <div className="mx-auto mt-8 max-w-xl text-left">
              <PriceBlock />
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {primaryCta()}
              <a
                href="#included"
                className="flex h-14 w-full items-center justify-center border border-dg-line px-8 text-[15px] font-bold text-dg-ink transition-colors hover:bg-dg-bg sm:w-auto"
                style={{ borderRadius: 8 }}
              >
                들어 있는 내용 보기
              </a>
            </div>
            <p className="mt-4 text-[12px] text-dg-ink-soft">
              독립 도메인 발급 · 구글·네이버 등록 포함
            </p>
          </div>
        </section>

        {/* 2. 문제 — 예시 화면 */}
        <section className="bg-dg-bg py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-5">
            <p className="text-center text-[13px] font-semibold tracking-wide text-dg-ink-soft">왜 지금인가요</p>
            <h2 className="mt-3 break-keep text-center text-[24px] text-dg-ink md:text-[32px]">
              AI는 확인할 수 있는 정보만 답변에 씁니다
            </h2>
            <p className="mx-auto mt-3 max-w-xl break-keep text-center text-[14px] leading-relaxed text-dg-ink-soft md:text-[15px]">
              공식 자료가 없으면 AI도 우리 가게를 설명하기 어렵습니다. 같은 질문이라도 자료가 있느냐에 따라 답변이 달라집니다.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="border border-dg-line bg-white p-5 sm:p-6" style={{ borderRadius: 10 }}>
                <p className="text-[12px] font-bold text-dg-danger">공식 자료가 없을 때</p>
                <div className="mt-4 space-y-3">
                  <div className="ml-auto w-fit max-w-[85%] bg-dg-ink px-4 py-2.5 text-[14px] text-white" style={{ borderRadius: 14 }}>
                    근처에 조용한 카페 추천해줘
                  </div>
                  <div className="w-fit max-w-[92%] bg-dg-bg px-4 py-3 text-[14px] leading-relaxed text-dg-ink" style={{ borderRadius: 14 }}>
                    정보가 확인되는 몇 곳을 안내해 드릴게요. 그 외 매장은 영업시간과 메뉴를 확인하기 어렵습니다.
                  </div>
                </div>
                <p className="mt-4 text-[13px] text-dg-ink-soft">우리 가게는 답변 후보에 오르기 어렵습니다.</p>
              </div>

              <div className="border border-dg-green bg-white p-5 sm:p-6" style={{ borderRadius: 10 }}>
                <p className="text-[12px] font-bold text-dg-green-deep">공식 자료가 있을 때</p>
                <div className="mt-4 space-y-3">
                  <div className="ml-auto w-fit max-w-[85%] bg-dg-ink px-4 py-2.5 text-[14px] text-white" style={{ borderRadius: 14 }}>
                    근처에 조용한 카페 추천해줘
                  </div>
                  <div className="w-fit max-w-[92%] bg-dg-green-tint px-4 py-3 text-[14px] leading-relaxed text-dg-ink" style={{ borderRadius: 14 }}>
                    공식 홈페이지에서 영업시간, 위치, 대표 메뉴가 확인되는 매장을 함께 안내해 드릴게요.
                  </div>
                </div>
                <p className="mt-4 text-[13px] font-semibold text-dg-green-deep">
                  읽을 수 있는 자료가 있으니 참고될 가능성이 생깁니다.
                </p>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-dg-ink-soft/70">
              ※ 이해를 돕기 위한 예시 화면입니다. 실제 AI 답변과 노출 여부는 달라질 수 있습니다.
            </p>
          </div>
        </section>

        {/* 3. 해결 + 단골팅 연결 */}
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-5 text-center">
            <p className="text-[13px] font-semibold tracking-wide text-dg-ink-soft">그래서 미니홈피입니다</p>
            <h2 className="mt-3 break-keep text-[24px] text-dg-ink md:text-[32px]">
              검색과 AI가 읽을 수 있는 우리 가게의 공식 공간
            </h2>
            <p className="mx-auto mt-4 max-w-2xl break-keep text-[14px] leading-relaxed text-dg-ink-soft md:text-[16px]">
              AEO는 검색 결과 링크를 늘리는 일이 아니라, AI가 우리 가게 정보를 정확히 읽고 참고하기 쉽도록 만드는 일입니다.
              미니홈피는 그 기준이 되는 공식 자료가 되고, 단골팅의 게임·쿠폰·혜택이 그 홈페이지와 이어집니다.
            </p>
            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
              {['손님이 오는 이유 · 단골팅 게임과 쿠폰', '손님이 확인하는 곳 · 미니홈피', '검색과 AI가 읽는 곳 · 구글·네이버 등록'].map((t) => (
                <div key={t} className="flex items-start gap-2 bg-dg-bg p-4 text-[13px] font-semibold leading-snug text-dg-ink" style={{ borderRadius: 10 }}>
                  <Check size={16} className="mt-0.5 shrink-0 text-dg-green-deep" strokeWidth={2.5} />
                  <span className="break-keep">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. 들어 있는 것 */}
        <section id="included" className="scroll-mt-20 bg-dg-bg py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-5">
            <p className="text-center text-[13px] font-semibold tracking-wide text-dg-ink-soft">들어 있는 것</p>
            <h2 className="mt-3 break-keep text-center text-[24px] text-dg-ink md:text-[32px]">
              홈페이지만이 아니라, 읽히는 구조까지
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {INCLUDED.map((item, i) => (
                <article key={item.title} className="border border-dg-line bg-white p-6" style={{ borderRadius: 10 }}>
                  <div className="flex items-center justify-between">
                    <span className="font-num text-[14px] font-bold text-dg-gold-deep">0{i + 1}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-dg-green-tint text-dg-green-deep">
                      <item.icon size={20} strokeWidth={1.75} />
                    </span>
                  </div>
                  <h3 className="mt-4 text-[18px] text-dg-ink">{item.title}</h3>
                  <p className="mt-2 break-keep text-[14px] leading-relaxed text-dg-ink-soft">{item.body}</p>
                  {'fine' in item && item.fine && (
                    <p className="mt-3 text-[11px] text-dg-ink-soft/70">{item.fine}</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 5. 사장님이 할 일 */}
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-5">
            <p className="text-center text-[13px] font-semibold tracking-wide text-dg-ink-soft">진행 방식</p>
            <h2 className="mt-3 break-keep text-center text-[24px] text-dg-ink md:text-[32px]">
              사장님이 하실 일은 세 가지뿐입니다
            </h2>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="border border-dg-line bg-dg-bg p-6" style={{ borderRadius: 10 }}>
                  <span className="font-num flex h-9 w-9 items-center justify-center rounded-full bg-dg-ink text-[15px] font-bold text-white">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-[17px] text-dg-ink">{s.title}</h3>
                  <p className="mt-2 break-keep text-[14px] leading-relaxed text-dg-ink-soft">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6. 가격 */}
        <section className="bg-dg-ink py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <p className="text-[13px] font-semibold tracking-wide text-white/50">스탠다드 모델</p>
            <h2 className="mt-3 break-keep text-[24px] text-white md:text-[32px]">
              부담 없이 시작하는 AEO 미니홈피
            </h2>
            <div className="mt-8 text-left">
              <PriceBlock tone="dark" />
            </div>
            <ul className="mx-auto mt-6 flex max-w-md flex-col gap-2 text-left">
              {['독립 도메인 발급 포함', '구글 · 네이버 사이트 등록 포함', '단골팅 게임·쿠폰·혜택 연결'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-[14px] text-white/80">
                  <Check size={16} className="shrink-0 text-dg-green" strokeWidth={2.5} />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex justify-center">{primaryCta()}</div>
            <p className="mt-4 text-[12px] text-white/50">
              모든 금액은 VAT 포함이며, 단골팅에 추가하는 옵션 상품입니다.
            </p>
          </div>
        </section>

        {/* 7. FAQ */}
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="text-center text-[24px] text-dg-ink md:text-[30px]">자주 묻는 질문</h2>
            <div className="mt-8 divide-y divide-dg-line border-y border-dg-line">
              {AEO_FAQ.map((item, i) => {
                const open = openFaq === i
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="flex min-h-[56px] w-full items-center justify-between gap-4 py-4 text-left"
                    >
                      <span className="break-keep text-[15px] font-bold text-dg-ink md:text-[16px]">{item.q}</span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-dg-ink-soft transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {open && (
                      <p className="break-keep pb-5 pr-8 text-[14px] leading-relaxed text-dg-ink-soft">{item.a}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 8. 맞춤 상담 (보조) */}
        <section className="bg-dg-bg pb-4 pt-12 md:pt-16">
          <div
            className="mx-auto flex max-w-3xl flex-col gap-4 border border-dg-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderRadius: 10 }}
          >
            <div>
              <p className="text-[15px] font-bold text-dg-ink">더 세밀한 AI 답변 설계가 필요하신가요?</p>
              <p className="mt-1 break-keep text-[13px] leading-relaxed text-dg-ink-soft">
                업종과 매장 상황에 맞춰 AI 응답용 콘텐츠를 지속적으로 운영하는 맞춤형 구독 모델은 상담 후 견적을 안내해 드립니다.
              </p>
            </div>
            <a
              href={kakaoReady ? KAKAO_CONSULT_URL : SIGNUP_PATH}
              target={kakaoReady ? '_blank' : undefined}
              rel={kakaoReady ? 'noopener noreferrer' : undefined}
              className="flex h-12 shrink-0 items-center justify-center gap-2 border border-dg-ink px-5 text-[14px] font-bold text-dg-ink transition-colors hover:bg-dg-bg"
              style={{ borderRadius: 8 }}
            >
              <MessageCircle size={16} />
              맞춤 상담 문의
            </a>
          </div>
        </section>

        {/* 9. 마무리 */}
        <section className="bg-dg-bg py-16 text-center md:py-24">
          <div className="mx-auto max-w-2xl px-5">
            <h2 className="break-keep text-[24px] leading-snug text-dg-ink md:text-[32px]">
              사람에게는 재방문할 이유를,
              <br />
              AI에게는 추천할 이유를.
            </h2>
            <p className="mt-4 break-keep text-[15px] text-dg-ink-soft">
              먼저 준비하는 매장이, AI 시대에 앞서갑니다.
            </p>
            <div className="mt-8 flex justify-center">{primaryCta()}</div>
          </div>
        </section>
      </main>
      <Footer />
      <BottomBar />

      {calcOpen && <PricingCalculatorModal initialHomepage onClose={() => setCalcOpen(false)} />}
    </div>
  )
}
