'use client'

import Image from 'next/image'
import { KAKAO_CONSULT_URL, SIGNUP_PATH } from '@/lib/landing-v5/config'
import './promo.css'

const CONSULT_HREF = KAKAO_CONSULT_URL || SIGNUP_PATH
const CONSULT_EXTERNAL = Boolean(KAKAO_CONSULT_URL)

function ConsultLink({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <a
      href={CONSULT_HREF}
      target={CONSULT_EXTERNAL ? '_blank' : undefined}
      rel={CONSULT_EXTERNAL ? 'noopener noreferrer' : undefined}
      className={className}
    >
      {children}
    </a>
  )
}

function MiniConsult() {
  return (
    <p className="mt-8 text-center">
      <ConsultLink className="text-[16px] font-bold text-[#019c87] underline underline-offset-4">
        궁금하면 상담받아보기 →
      </ConsultLink>
    </p>
  )
}

const GUEST_STEPS = [
  { n: '1', title: '발견해요', desc: '포스터 QR이든, 블로그 링크든' },
  { n: '2', title: '뽑기 시작만 눌러요', desc: '가입·로그인 없이 바로 시작돼요' },
  { n: '3', title: '결과가 나와요', desc: '크레인이 선물을 찾아줘요' },
  { n: '4', title: '쿠폰은 카톡으로 받아요', desc: '결과 확인할 때만 한 번이면 돼요' },
  { n: '5', title: '쓰러 또 가요', desc: '손님이 스스로 다시 오고 싶어져요' },
]

const FLOW = [
  { t: '유입', d: '광고 · 블로그 · SNS · 매장' },
  { t: '게임', d: '인형뽑기 한 판' },
  { t: '혜택', d: '쿠폰 · 리워드' },
  { t: '재방문', d: '쿠폰 쓰러 다시 와요' },
  { t: '단골', d: '반복 방문이 쌓여요' },
  { t: '매출', d: '손님과 매장의 관계' },
]

const START_STEPS = [
  { n: '01', t: '매장 이벤트를 만들어요' },
  { n: '02', t: '쿠폰이랑 혜택을 정해요' },
  { n: '03', t: '게임 링크나 QR을 걸어요' },
  { n: '04', t: '손님이 참여하고, 쿠폰을 받아요' },
  { n: '05', t: '관리자 화면에서 결과를 봐요' },
]

const SHOPS = [
  { k: '음식점', v: '방문 → 게임 → 다음 방문 쿠폰' },
  { k: '카페', v: '방문 → 게임 → 음료 할인' },
  { k: '미용실', v: '첫 방문 → 게임 → 다음 시술 혜택' },
  { k: '네일샵', v: '시술 → 이벤트 → 다음 예약' },
  { k: '헬스장', v: '상담 → 게임 → 등록 혜택' },
  { k: '학원', v: '상담 → 게임 → 등록 이벤트' },
]

export default function PromoDetailPage() {
  return (
    <div className="promo-page min-h-screen pb-[88px]">
      <header className="sticky top-0 z-30 border-b border-[#e7e3d8] bg-[#faf7f0]/92 backdrop-blur-md">
        <div className="promo-col flex h-14 items-center justify-between px-5">
          <a href="/" className="text-[18px] font-extrabold tracking-tight text-[#222]">
            단골팅
          </a>
          <ConsultLink className="rounded-full bg-[#00c7a7] px-3.5 py-1.5 text-[13px] font-bold text-white">
            상담 신청
          </ConsultLink>
        </div>
      </header>

      {/* 01 Hero */}
      <section className="bg-[#faf7f0] px-5 pb-16 pt-10">
        <div className="promo-col">
          <p className="mb-5 text-[13px] font-bold tracking-[0.14em] text-[#00c7a7]">
            DANGOLTING
          </p>
          <h1 className="text-[32px]">
            한 번 온 손님,
            <br />
            <span className="promo-hl">그냥 보내지 마세요.</span>
          </h1>
          <p className="mt-5 text-[18px] leading-[1.7] text-[#3a3a3a]">
            손님이 오면 → 게임 한 판 → 쿠폰 하나
            <br />
            이렇게만 해도, 손님은 다시 옵니다.
          </p>
          <div className="relative mx-auto mt-8 h-[240px] w-[240px]">
            <Image
              src="/characters/char_result_jackpot.webp"
              alt="단골팅 캐릭터 목업"
              fill
              className="object-contain"
              priority
            />
          </div>
          <ConsultLink className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-[#222] text-[17px] font-extrabold text-white">
            상담 신청하기 →
          </ConsultLink>
        </div>
      </section>

      {/* 02 Problem */}
      <section className="bg-[#222] px-5 py-20 text-white">
        <div className="promo-col">
          <p className="text-[13px] font-bold tracking-[0.12em] text-[#00c7a7]">고민</p>
          <h2 className="mt-3 text-[28px]">
            이런 고민
            <br />
            있으시죠?
          </h2>
          <div className="mt-8 rounded-[22px] bg-[#2c2c2c] px-5 py-5 text-[18px] leading-[1.7]">
            “광고해서 손님은 왔는데,
            <br />
            그 다음엔 어떻게 해야 할지
            <br />
            모르겠어요.”
          </div>
          <p className="mt-8 text-[18px] leading-[1.75] text-white/80">
            맞아요. 많은 사장님들이 여기서 막혀요.
          </p>
          <p className="mt-5 text-[18px] leading-[1.75] text-white/80">
            광고비 써서 데려오고
            <br />
            → 밥 먹고 → 그냥 가고
            <br />
            → 또 광고비 쓰고…
          </p>
          <p className="mt-8 text-[22px] font-extrabold leading-snug">
            이 반복,
            <br />
            <span className="text-[#00c7a7]">이제 끊어보세요.</span>
          </p>
        </div>
      </section>

      {/* 03 What + guest journey */}
      <section className="bg-[#faf7f0] px-5 py-20">
        <div className="promo-col">
          <p className="text-[13px] font-bold tracking-[0.12em] text-[#00c7a7]">이게 단골팅이에요</p>
          <h2 className="mt-3 text-[28px]">
            쉽게 말하면
            <br />
            이거예요.
          </h2>
          <p className="mt-5 text-[18px] leading-[1.75] text-[#3a3a3a]">
            손님이 매장에서 인형뽑기 한 판 하고,
            <br />
            쿠폰 받고, 그 쿠폰 쓰러 다시 오는 거예요.
          </p>
          <p className="mt-4 text-[18px] leading-[1.75] text-[#3a3a3a]">
            복잡한 프로그램이 아니에요.
            <br />
            재미있는 이벤트 하나라고 생각하시면 돼요.
          </p>

          <div className="relative mx-auto mt-8 aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-[28px] bg-[#111] shadow-[0_16px_40px_rgba(34,34,34,0.18)]">
            <Image
              src="/landing-v5/screens/01-entry.jpg"
              alt="게임 시작 화면 목업"
              fill
              className="object-cover object-top"
            />
          </div>

          <h3 className="mt-12 text-[22px] font-extrabold">손님한테는 그냥 재밌는 이벤트예요.</h3>
          <ol className="mt-8">
            {GUEST_STEPS.map((step, i) => (
              <li key={step.n} className="relative flex gap-4 pb-8 last:pb-0">
                {i < GUEST_STEPS.length - 1 && (
                  <span className="absolute left-[17px] top-10 h-[calc(100%-24px)] w-px border-l border-dashed border-[#00c7a7]/50" />
                )}
                <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00c7a7] text-[14px] font-extrabold text-white">
                  {step.n}
                </span>
                <div>
                  <p className="text-[18px] font-extrabold">{step.title}</p>
                  <p className="mt-1 text-[16px] leading-relaxed text-[#6b7280]">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <MiniConsult />
        </div>
      </section>

      {/* 04 Strength */}
      <section className="bg-[#e3fbf6] px-5 py-20">
        <div className="promo-col">
          <p className="inline-block rounded-full bg-[#00c7a7] px-3 py-1 text-[12px] font-extrabold text-white">
            진짜 강점
          </p>
          <h2 className="mt-4 text-[28px]">
            QR 없어도 돼요.
            <br />
            <span className="promo-hl">링크 하나면</span>
            <br />
            어디서든 열려요.
          </h2>
          <p className="mt-6 text-[18px] leading-[1.75] text-[#3a3a3a]">
            블로그에 한 줄,
            <br />
            홈페이지에 버튼 하나,
            <br />
            문자·SNS·광고에도 링크만 넣으면 끝이에요.
          </p>
          <div className="mt-8 overflow-hidden rounded-[24px] bg-white p-4 shadow-[0_10px_28px_rgba(0,199,167,0.12)]">
            <div className="relative aspect-[16/10] w-full">
              <Image
                src="/landing-v5/screens/06-qr.jpg"
                alt="QR·링크 참여 목업"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <p className="mt-8 text-[18px] leading-[1.75] font-bold text-[#222]">
            매장 손님은 QR로,
            <br />
            온라인 손님은 링크로.
          </p>
          <p className="mt-3 text-[18px] leading-[1.75] text-[#3a3a3a]">
            게임 하나로 둘 다 잡아요.
          </p>
        </div>
      </section>

      {/* 05 Owner + coupon */}
      <section className="bg-[#faf7f0] px-5 py-20">
        <div className="promo-col">
          <p className="text-[13px] font-bold tracking-[0.12em] text-[#00c7a7]">사장님이 직접</p>
          <h2 className="mt-3 text-[28px]">
            이벤트와 쿠폰은
            <br />
            사장님이 정해요.
          </h2>
          <p className="mt-5 text-[18px] leading-[1.75] text-[#3a3a3a]">
            이번 주는 신규 손님,
            <br />
            다음 달은 재방문,
            <br />
            명절엔 특별 이벤트.
          </p>
          <ul className="mt-6 space-y-2 text-[17px] leading-relaxed text-[#3a3a3a]">
            <li>· 이벤트 이름 · 기간</li>
            <li>· 쿠폰 종류 · 사용 기간 · 수량</li>
          </ul>
          <p className="mt-4 text-[17px] leading-relaxed text-[#3a3a3a]">
            경품 수량만 넣으면, 당첨 확률은 저희가 계산해요.
          </p>

          <div className="relative mt-10 rounded-[22px] bg-[#eceae4] px-5 py-4 text-[17px] leading-[1.65] text-[#222]">
            <span className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 bg-[#eceae4]" />
            “쿠폰 나눠주다가
            <br />
            손해 보면 어떡하죠?”
          </div>

          <p className="mt-8 text-[18px] leading-[1.75] text-[#3a3a3a]">
            걱정 안 하셔도 돼요.
            <br />
            매장이 감당할 수 있는 만큼만 정하면 돼요.
          </p>
          <p
            className="mt-5 inline-block rotate-[-2deg] rounded-md bg-[#fff3de] px-4 py-2 text-[16px] font-extrabold shadow-[2px_3px_0_rgba(34,34,34,0.08)]"
          >
            1,000원도, 10,000원도 사장님 맘대로
          </p>
          <p className="mt-6 text-[17px] leading-relaxed text-[#6b7280]">
            누가 언제 썼는지도 화면에서 바로 보여드려요.
          </p>
        </div>
      </section>

      {/* 06 Flow climax */}
      <section className="bg-[#fff3de] px-5 py-20">
        <div className="promo-col">
          <p className="text-[13px] font-bold tracking-[0.12em] text-[#b8862f]">한눈에</p>
          <h2 className="mt-3 text-[28px]">
            단골팅의 흐름은
            <br />
            이렇게 쌓여요.
          </h2>
          <ol className="mt-10 space-y-3">
            {FLOW.map((item, i) => (
              <li
                key={item.t}
                className="flex items-center gap-4 rounded-2xl px-4 py-4"
                style={{
                  background: `rgba(0, 199, 167, ${0.08 + i * 0.07})`,
                }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00c7a7] text-[14px] font-extrabold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[18px] font-extrabold">{item.t}</p>
                  <p className="text-[15px] text-[#6b7280]">{item.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="relative mx-auto mt-8 h-[160px] w-[160px]">
            <Image
              src="/characters/char_display_mint.webp"
              alt="단골팅 캐릭터"
              fill
              className="object-contain"
            />
          </div>
          <p className="mt-2 text-center text-[18px] font-extrabold leading-snug">
            같은 광고비인데,
            <br />
            <span className="promo-hl">다시 오는 이유</span>가 남아요.
          </p>
          <MiniConsult />
        </div>
      </section>

      {/* 07 Admin */}
      <section className="bg-[#faf7f0] px-5 py-20">
        <div className="promo-col">
          <p className="text-[13px] font-bold tracking-[0.12em] text-[#00c7a7]">관리자 화면</p>
          <h2 className="mt-3 text-[28px]">
            감으로 짐작하지 마세요.
            <br />
            숫자로 봐요.
          </h2>
          <div className="relative mt-8 aspect-[16/11] w-full overflow-hidden rounded-2xl bg-[#111] shadow-[0_14px_32px_rgba(34,34,34,0.14)]">
            <Image
              src="/landing-v5/screens/11-admin-dashboard.webp"
              alt="관리자 화면 목업"
              fill
              className="object-cover object-top"
            />
          </div>
          <ul className="mt-8 space-y-3 text-[17px] leading-relaxed text-[#3a3a3a]">
            <li>· 유입 수 · 게임 참여 수 · 참여율</li>
            <li>· 쿠폰 발급 / 사용 / 미사용 / 만료</li>
            <li>· 재방문</li>
            <li>· 카톡 친구 · 당근 단골 연결</li>
          </ul>
        </div>
      </section>

      {/* 08 Industries */}
      <section className="bg-[#e3fbf6] px-5 py-20">
        <div className="promo-col">
          <p className="text-[13px] font-bold tracking-[0.12em] text-[#00c7a7]">잘 맞는 매장</p>
          <h2 className="mt-3 text-[28px]">
            이런 매장이라면
            <br />
            특히 잘 맞아요.
          </h2>
          <ul className="mt-8 space-y-3">
            {SHOPS.map((s) => (
              <li key={s.k} className="rounded-2xl bg-white px-4 py-4">
                <p className="text-[17px] font-extrabold">{s.k}</p>
                <p className="mt-1 text-[15px] text-[#6b7280]">{s.v}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[17px] leading-relaxed text-[#3a3a3a]">
            우리 매장에 재미있는 이벤트를 만들고 싶은 사장님이라면요.
          </p>
          <MiniConsult />
        </div>
      </section>

      {/* 09 Start */}
      <section className="bg-[#faf7f0] px-5 py-20">
        <div className="promo-col">
          <p className="text-[13px] font-bold tracking-[0.12em] text-[#00c7a7]">시작</p>
          <h2 className="mt-3 text-[28px]">
            어렵게 배우실
            <br />
            필요 없어요.
          </h2>
          <ol className="mt-10">
            {START_STEPS.map((step, i) => (
              <li key={step.n} className="relative flex gap-4 pb-7 last:pb-0">
                {i < START_STEPS.length - 1 && (
                  <span className="absolute left-[17px] top-10 h-[calc(100%-20px)] w-px border-l border-dashed border-[#00c7a7]/50" />
                )}
                <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#222] text-[11px] font-extrabold text-white">
                  {step.n}
                </span>
                <p className="pt-1.5 text-[18px] font-bold leading-snug">{step.t}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-[18px] font-extrabold">이게 단골팅의 전부예요.</p>
        </div>
      </section>

      {/* 10 Final */}
      <section className="bg-[#222] px-5 py-20 text-white">
        <div className="promo-col">
          <div className="relative mx-auto mb-6 h-[140px] w-[140px]">
            <Image
              src="/characters/char_result_small.webp"
              alt="응원하는 캐릭터 목업"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="text-[28px]">
            한 번 온 손님을,
            <br />
            그냥 보내지 마세요.
          </h2>
          <p className="mt-6 text-[18px] leading-[1.75] text-white/78">
            광고는 계속 돈이 들어요.
            <br />
            다시 오게 만드는 데는
            <br />
            꼭 새 광고만 답은 아니에요.
          </p>
          <p className="mt-6 text-[18px] leading-[1.75] text-white/78">
            게임으로 만나고
            <br />
            혜택으로 다시 부르고
            <br />
            데이터로 단골을 만들어요.
          </p>
          <p className="mt-8 text-[16px] font-bold text-[#00c7a7]">
            단골팅 — 게임으로 만드는 단골 마케팅
          </p>
          <ConsultLink className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-[#00c7a7] text-[17px] font-extrabold text-[#222]">
            상담 신청하기 →
          </ConsultLink>
          <p className="mt-4 text-center text-[14px] text-white/55">
            우리 매장에 맞는 요금, 편하게 안내해드릴게요.
          </p>
        </div>
      </section>

      <footer className="bg-[#faf7f0] px-5 py-10 text-center text-[13px] text-[#9aa0a6]">
        <a href="/" className="font-bold text-[#222]">
          단골팅 홈
        </a>
        <span className="mx-2">·</span>
        <a href="/privacy">개인정보처리방침</a>
        <span className="mx-2">·</span>
        <a href="/terms">이용약관</a>
      </footer>

      <div
        className="promo-sticky"
        style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}
      >
        <ConsultLink className="mx-4 flex h-12 w-full max-w-[520px] items-center justify-center rounded-full bg-[#00c7a7] text-[16px] font-extrabold text-[#222] shadow-[0_8px_24px_rgba(0,199,167,0.35)]">
          상담 신청하기
        </ConsultLink>
      </div>
    </div>
  )
}
