import BrandLogo from '@/components/BrandLogo'
import { DEMO_PLAY_URL, KAKAO_CONSULT_URL } from '@/lib/landing-v5/config'
import ImageSlot from './ImageSlot'

/** 실제 이미지가 준비되면 이 경로만 채운다. 비어 있으면 빈 박스로 표시된다. */
const IMAGES = {
  hero: '/landing02/hero.jpg',
  game: '/landing02/game.jpg',
  coupon: '/landing02/coupon.jpg',
  qr: '/landing02/qr.jpg',
  online: '/landing02/online.jpg',
  dashboard: '/landing02/dashboard.jpg',
}

const HOME_URL = 'https://www.dgting.co.kr'

const PROBLEMS = [
  {
    title: '광고비는 계속 나가는데\n손님은 한 번 오고 끝.',
    body: '노출은 늘어나는데, 그 손님이 다시 왔는지는 아무도 모릅니다.',
  },
  {
    title: '쿠폰을 뿌려도\n누가 다시 왔는지 모릅니다.',
    body: '몇 장을 줬는지는 알아도, 그중 몇 명이 돌아왔는지는 알 수 없습니다.',
  },
  {
    title: 'SNS에 열심히 올려도\n매출로 이어졌는지 모릅니다.',
    body: '좋아요 수는 보이지만, 그 사람이 매장에 왔는지는 확인할 수 없습니다.',
  },
]

const FLOW_STEPS = [
  { no: '01', title: '이벤트를 발견합니다', body: '매장 QR, 또는 온라인에 공유된 링크로 만납니다.' },
  { no: '02', title: '게임에 참여합니다', body: '로그인 없이, 한 판이면 충분합니다.' },
  { no: '03', title: '쿠폰과 혜택을 받습니다', body: '다음에 쓸 수 있는 이유가 생깁니다.' },
  { no: '04', title: '가게를 기억합니다', body: '한 번 경험한 매장은 쉽게 잊히지 않습니다.' },
  { no: '05', title: '필요할 때 다시 방문합니다', body: '쿠폰이 다시 올 이유를 대신 말해줍니다.' },
]

const DASHBOARD_METRICS = ['유입수', '게임 참여수', '쿠폰 현황', '재방문', '마케팅 분석 리포트']

const INDUSTRIES = [
  { name: '타이어 · 자동차', example: '게임하고 타이어 할인쿠폰 받기' },
  { name: '카페', example: '게임하고 다음 방문 쿠폰 받기' },
  { name: '음식점', example: '게임하고 다음 방문 혜택 받기' },
  { name: '미용실', example: '게임하고 다음 방문 할인받기' },
  { name: '네일샵', example: '게임하고 다음 시술 쿠폰 받기' },
  { name: '학원', example: '게임하고 상담 혜택 받기' },
  { name: '세차', example: '게임하고 다음 세차 쿠폰 받기' },
  { name: '청소', example: '게임하고 다음 이용 혜택 받기' },
]

function CtaButtons({ light = false }: { light?: boolean }) {
  const primary = light
    ? 'bg-white text-[#222222] hover:bg-[#FFF3DE]'
    : 'bg-[#00C7A7] text-[#222222] hover:bg-[#00b396]'
  const secondary = light
    ? 'border border-white/40 text-white hover:bg-white/10'
    : 'border border-[#222222]/15 bg-white text-[#222222] hover:bg-[#FAF7F0]'

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
      <a
        href={DEMO_PLAY_URL}
        className={`inline-flex h-[60px] items-center justify-center px-8 text-[17px] font-bold transition-colors ${primary}`}
        style={{ borderRadius: 12 }}
      >
        체험하기
      </a>
      <a
        href={KAKAO_CONSULT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex h-[60px] items-center justify-center px-8 text-[17px] font-bold transition-colors ${secondary}`}
        style={{ borderRadius: 12 }}
      >
        카카오톡 상담
      </a>
      <a
        href={HOME_URL}
        className={`inline-flex h-[60px] items-center justify-center px-8 text-[17px] font-bold transition-colors ${secondary}`}
        style={{ borderRadius: 12 }}
      >
        홈페이지 바로가기
      </a>
    </div>
  )
}

export default function Landing02() {
  return (
    <div className="landing02 bg-[#FAF7F0] text-[#222222]">
      {/* ── 상단 바 ── */}
      <header className="sticky top-0 z-50 border-b border-[#222222]/10 bg-[#FAF7F0]/90 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5">
          <a href={HOME_URL} aria-label="단골팅 홈페이지">
            <BrandLogo priority size="lg" />
          </a>
          <a
            href={KAKAO_CONSULT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center bg-[#00C7A7] px-5 text-[15px] font-bold text-[#222222] transition-colors hover:bg-[#00b396]"
            style={{ borderRadius: 10 }}
          >
            상담 문의
          </a>
        </div>
      </header>

      <main>
        {/* ── 1. HERO ── */}
        <section className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
          <p className="text-[15px] font-bold tracking-wide text-[#019c87]">단골팅</p>
          <h1 className="mt-4 text-[34px] font-extrabold leading-[1.3] tracking-tight sm:text-[52px] md:text-[60px]">
            손님 100명이 왔는데,
            <br />
            <span className="text-[#00C7A7]">몇 명이 다시 올까요?</span>
          </h1>
          <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-[#222222]/75 sm:text-[20px]">
            광고로 손님을 데려오는 것보다 더 중요한 건,
            <br className="hidden sm:block" /> 그 손님이 다시 오게 만드는 일입니다.
          </p>
          <p className="mt-3 text-[18px] font-bold leading-relaxed sm:text-[20px]">
            단골팅은 손님이 다시 오는 이유를 만듭니다.
          </p>
          <div className="mt-9">
            <CtaButtons />
          </div>
          <div className="mx-auto mt-14 max-w-xl">
            <ImageSlot src={IMAGES.hero} alt="게임하고 단골되는 즐거운 마케팅" ratio="1 / 1" label="대표 이미지" />
          </div>
        </section>

        {/* ── 2. PROBLEM ── */}
        <section className="bg-[#222222] py-20 text-white sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-[30px] font-extrabold leading-snug tracking-tight sm:text-[44px]">
              사장님, 이런 경험 있으시죠?
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {PROBLEMS.map((p, i) => (
                <article key={p.title} className="border border-white/15 p-7" style={{ borderRadius: 16 }}>
                  <p className="font-mono text-[15px] font-bold text-[#00C7A7]">0{i + 1}</p>
                  <h3 className="mt-4 whitespace-pre-line text-[22px] font-extrabold leading-snug">{p.title}</h3>
                  <p className="mt-4 text-[16px] leading-relaxed text-white/65">{p.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-16 text-[28px] font-extrabold leading-snug tracking-tight sm:text-[40px]">
              손님을 데려오는 것보다
              <br />
              <span className="text-[#00C7A7]">더 어려운 건 그다음입니다.</span>
            </p>
          </div>
        </section>

        {/* ── 3. SOLUTION ── */}
        <section className="bg-[#FFF3DE] py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-[15px] font-bold text-[#019c87]">그래서 만들었습니다</p>
            <h2 className="mt-3 text-[40px] font-extrabold tracking-tight sm:text-[56px]">단골팅</h2>
            <p className="mt-6 text-[26px] font-extrabold leading-snug tracking-tight sm:text-[36px]">
              신규 손님을 부르고,
              <br />
              다시 오게 하고,
              <br />
              단골로 만드는 게임.
            </p>
            <p className="mt-6 max-w-2xl text-[18px] leading-relaxed text-[#222222]/75">
              광고처럼 손님을 한 번 데려오는 것으로 끝나지 않습니다. 게임 이벤트로 신규 고객을 만나고, 쿠폰으로
              재방문을 만들고, 반복된 방문을 단골로 이어줍니다.
            </p>

            <ol className="mt-14 grid gap-4 sm:grid-cols-4">
              {['신규 손님', '재방문', '단골', '매출'].map((step, i) => (
                <li
                  key={step}
                  className="flex items-center justify-between bg-white px-6 py-7 sm:flex-col sm:items-start sm:gap-3"
                  style={{ borderRadius: 16 }}
                >
                  <span className="text-[24px] font-extrabold tracking-tight sm:text-[28px]">{step}</span>
                  <span className="text-[28px] font-extrabold text-[#00C7A7]">{i < 3 ? '→' : '↑'}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── 4. 게임은 수단이다 ── */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <h2 className="text-[30px] font-extrabold leading-snug tracking-tight sm:text-[44px]">
            우리 가게에서
            <br />
            게임을 왜 할까요?
          </h2>
          <p className="mt-8 text-[30px] font-extrabold leading-snug tracking-tight text-[#00C7A7] sm:text-[44px]">
            게임이 목적이 아닙니다.
          </p>
          <p className="mt-3 text-[22px] font-bold leading-snug sm:text-[28px]">
            손님과 다시 만날 이유를 만드는 일입니다.
          </p>

          <div className="mx-auto mt-14 grid max-w-5xl items-start gap-8 md:grid-cols-3 md:gap-10">
            <figure className="flex flex-col">
              <ImageSlot src={IMAGES.game} alt="인형뽑기 게임 화면" ratio="9 / 16" label="인형뽑기 게임 화면" />
              <figcaption className="mt-3 text-[15px] font-semibold text-[#222222]/60">1. 게임에 참여</figcaption>
            </figure>
            <figure className="flex flex-col">
              <ImageSlot src={IMAGES.coupon} alt="쿠폰 당첨 화면" ratio="9 / 16" label="쿠폰 당첨 화면" />
              <figcaption className="mt-3 text-[15px] font-semibold text-[#222222]/60">2. 쿠폰을 받음</figcaption>
            </figure>
            <figure className="flex flex-col">
              <div
                className="flex w-full flex-col justify-center bg-[#222222] px-6 text-white"
                style={{ aspectRatio: '9 / 16', borderRadius: 16 }}
              >
                <p className="text-[15px] font-bold text-[#00C7A7]">3</p>
                <p className="mt-3 text-[26px] font-extrabold leading-snug">
                  그리고
                  <br />
                  다시 방문.
                </p>
              </div>
            </figure>
          </div>
        </section>

        {/* ── 5. 온라인에서도 ── */}
        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-[30px] font-extrabold leading-snug tracking-tight sm:text-[44px]">
              매장에 온 손님만을 위한
              <br />
              서비스가 아닙니다.
            </h2>
            <p className="mt-6 text-[24px] font-extrabold leading-snug text-[#019c87] sm:text-[32px]">
              온라인에서도 손님을 만날 수 있습니다.
            </p>
            <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-[#222222]/75">
              블로그, 맘카페, 인스타그램, 당근, 홈페이지 어디에든 게임 링크를 올릴 수 있습니다. 링크를 누른 손님은
              게임을 하고, 쿠폰을 받고, 매장을 기억합니다.
            </p>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <article className="border border-[#222222]/10 p-7" style={{ borderRadius: 16 }}>
                <p className="text-[14px] font-bold text-[#019c87]">오프라인</p>
                <h3 className="mt-2 text-[24px] font-extrabold">QR · NFC</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-[#222222]/70">
                  테이블이나 계산대에서 찍으면 바로 게임이 시작됩니다.
                </p>
                <div className="mt-6">
                  <ImageSlot src={IMAGES.qr} alt="매장 QR 설치 예시" ratio="1 / 1" label="매장 QR · NFC 설치 예시" />
                </div>
              </article>
              <article className="border border-[#222222]/10 p-7" style={{ borderRadius: 16 }}>
                <p className="text-[14px] font-bold text-[#019c87]">온라인</p>
                <h3 className="mt-2 text-[24px] font-extrabold">게임 링크</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-[#222222]/70">
                  블로그, 맘카페, SNS, 당근, 홈페이지에 링크만 올리면 됩니다.
                </p>
                <div className="mx-auto mt-6 max-w-xs">
                  <ImageSlot src={IMAGES.online} alt="온라인 게임 참여 화면" ratio="9 / 16" label="온라인 게임 참여 화면" />
                </div>
              </article>
            </div>

            <ol className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-3 text-[16px] font-bold">
              {['링크 클릭', '게임 참여', '쿠폰 당첨', '매장 기억', '다시 방문'].map((step, i, arr) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="bg-[#E3FBF6] px-4 py-2" style={{ borderRadius: 999 }}>
                    {step}
                  </span>
                  {i < arr.length - 1 && <span className="text-[#222222]/30">→</span>}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── 6. 고객 경험 5단계 ── */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <h2 className="text-[30px] font-extrabold leading-snug tracking-tight sm:text-[44px]">
            손님은 이렇게 경험합니다.
          </h2>
          <ol className="mt-12 grid gap-4">
            {FLOW_STEPS.map((step) => (
              <li
                key={step.no}
                className="flex items-start gap-5 border border-[#222222]/10 bg-white p-6 sm:items-center sm:gap-8 sm:p-8"
                style={{ borderRadius: 16 }}
              >
                <span className="font-mono text-[28px] font-bold text-[#00C7A7] sm:text-[34px]">{step.no}</span>
                <div>
                  <h3 className="text-[20px] font-extrabold sm:text-[24px]">{step.title}</h3>
                  <p className="mt-1 text-[16px] leading-relaxed text-[#222222]/65">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── 7. 관리자 대시보드 ── */}
        <section className="bg-[#222222] py-20 text-white sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-[30px] font-extrabold leading-snug tracking-tight sm:text-[44px]">
              감으로 광고하지 마세요.
            </h2>
            <p className="mt-5 text-[22px] font-bold leading-snug text-[#00C7A7] sm:text-[28px]">
              내 가게의 고객 흐름을 직접 확인하세요.
            </p>

            <ul className="mt-10 flex flex-wrap gap-3">
              {DASHBOARD_METRICS.map((metric) => (
                <li
                  key={metric}
                  className="border border-white/20 px-5 py-3 text-[16px] font-bold"
                  style={{ borderRadius: 999 }}
                >
                  {metric}
                </li>
              ))}
            </ul>

            <div className="mx-auto mt-12 max-w-sm">
              <ImageSlot
                src={IMAGES.dashboard}
                alt="관리자 대시보드 화면"
                ratio="502 / 1024"
                label="관리자 대시보드 예시 화면"
                dark
              />
              <p className="mt-3 text-center text-[14px] font-semibold text-white/50">
                예시 화면 · 실제 데이터와 다를 수 있습니다
              </p>
            </div>
          </div>
        </section>

        {/* ── 8. BEFORE / AFTER ── */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="grid gap-5 md:grid-cols-2">
            <article className="bg-[#EFECE4] p-8 sm:p-10" style={{ borderRadius: 20 }}>
              <h2 className="text-[24px] font-extrabold leading-snug sm:text-[30px]">예전에는 여기서 끝났습니다.</h2>
              <ol className="mt-8">
                {['광고', '노출', '방문', '끝'].map((step, i, arr) => (
                  <li key={step}>
                    <span
                      className={`inline-flex h-12 min-w-16 items-center justify-center px-4 text-[17px] font-bold ${
                        i === arr.length - 1 ? 'bg-[#222222] text-white' : 'bg-white text-[#222222]/70'
                      }`}
                      style={{ borderRadius: 10 }}
                    >
                      {step}
                    </span>
                    {i < arr.length - 1 && (
                      <span className="my-1 block pl-5 text-[18px] leading-none text-[#222222]/30">↓</span>
                    )}
                  </li>
                ))}
              </ol>
            </article>

            <article className="bg-[#E3FBF6] p-8 sm:p-10" style={{ borderRadius: 20 }}>
              <h2 className="text-[24px] font-extrabold leading-snug text-[#019c87] sm:text-[30px]">
                단골팅은 그다음을 만듭니다.
              </h2>
              <ol className="mt-8 flex flex-wrap gap-2">
                {['광고', '신규 손님', '방문', '게임', '쿠폰', '재방문', '단골', '매출'].map((step, i, arr) => (
                  <li key={step} className="flex items-center gap-2">
                    <span
                      className="flex h-12 items-center bg-[#00C7A7] px-4 text-[16px] font-bold text-[#222222]"
                      style={{ borderRadius: 10 }}
                    >
                      {step}
                    </span>
                    {i < arr.length - 1 && <span className="font-bold text-[#019c87]">→</span>}
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </section>

        {/* ── 9. 업종별 예시 ── */}
        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-[30px] font-extrabold leading-snug tracking-tight sm:text-[44px]">
              우리 가게에도
              <br />
              사용할 수 있을까요?
            </h2>
            <p className="mt-5 text-[18px] leading-relaxed text-[#222222]/70">
              손님이 다시 찾아올 수 있는 가게라면 어디든 가능합니다.
            </p>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {INDUSTRIES.map((item) => (
                <li key={item.name} className="border border-[#222222]/10 p-6" style={{ borderRadius: 16 }}>
                  <h3 className="text-[18px] font-extrabold">{item.name}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#222222]/65">&ldquo;{item.example}&rdquo;</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── 10. FINAL CTA ── */}
        <section className="bg-[#00C7A7] py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-5 text-center">
            <p className="text-[18px] font-semibold text-[#222222]/70 sm:text-[20px]">
              손님을 데려오는 광고는 이제 많습니다.
            </p>
            <h2 className="mt-4 text-[30px] font-extrabold leading-snug tracking-tight sm:text-[46px]">
              다시 오게 만드는 방법이
              <br />
              필요하다면,
              <br />
              단골팅을 시작해보세요.
            </h2>
            <p className="mt-6 text-[17px] leading-relaxed text-[#222222]/75">
              우리 가게에 어떻게 적용할 수 있는지 상담해드립니다.
            </p>
            <div className="mt-10 flex justify-center">
              <CtaButtons light />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#222222]/10 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 sm:flex-row sm:items-center">
          <BrandLogo size="md" />
          <p className="text-[14px] text-[#222222]/50">© {new Date().getFullYear()} 단골팅</p>
        </div>
      </footer>
    </div>
  )
}
