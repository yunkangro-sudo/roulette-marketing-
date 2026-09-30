import { DEMO_PLAY_URL, PRICING, PRICING_BASIC_TODAY_TOTAL, formatWon } from '@/lib/landing-v5/config'
import ManualNav from './ManualNav'

const LINES = [
  '단골팅은 게임이 아니라, 손님의 다음 행동을 만드는 시스템입니다.',
  '광고는 손님을 데려오고, 단골팅은 이미 온 손님을 다시 움직입니다.',
  '게임으로 단골, 후기, 재방문을 자연스럽게 만듭니다.',
  '그 행동이 매장 홍보와 다음 손님으로 이어집니다.',
  '한 번 하는 이벤트가 아니라, 손님을 계속 움직이게 만드는 시스템입니다.',
]

const INDUSTRIES = [
  ['음식점', '한 번 온 손님을 다시 오게 합니다.'],
  ['카페', '다음 방문 이유를 만듭니다.'],
  ['미용실', '한 번 온 고객과 계속 연결합니다.'],
  ['네일샵', '다음 방문을 자연스럽게 유도합니다.'],
  ['세차장', '다음 세차까지 연결합니다.'],
  ['청소', '후기와 소개로 다음 고객을 만듭니다.'],
  ['학원', '참여로 재등록과 관계를 잇습니다.'],
  ['그 외', '손님의 다음 행동을 만듭니다.'],
]

const OBJECTIONS = [
  {
    q: '이게 뭐예요?',
    a: 'QR로 게임하고 쿠폰을 받습니다. 거기서 단골, 후기, 재방문으로 이어집니다.',
  },
  {
    q: '게임을 누가 해요?',
    a: '손님입니다. 설명을 길게 하지 말고, 바로 폰으로 보여 주세요.',
  },
  {
    q: '게임하면 손님이 다시 와요?',
    a: '게임 하나 때문이 아닙니다. 혜택, 단골, 다음 방문 이유를 같이 만듭니다.',
  },
  {
    q: '손님은 많은데 굳이 필요해요?',
    a: '손님이 많은 매장일수록, 온 손님을 그냥 보내지 않는 게 중요합니다.',
  },
  {
    q: '광고하고 있는데요.',
    a: '광고는 새 손님을 데려옵니다. 단골팅은 이미 온 손님의 다음 행동입니다. 역할이 다릅니다.',
  },
  {
    q: '배민 광고도 하고 있어요.',
    a: '배달은 주문을 만들고, 단골팅은 매장에 온 손님을 다시 오게 합니다.',
  },
  {
    q: '네이버 플레이스 하고 있어요.',
    a: '플레이스는 매장을 찾게 합니다. 단골팅은 매장에 온 뒤의 행동입니다.',
  },
  {
    q: '당근 단골은 왜 받아요?',
    a: '손님과 매장을 계속 연결해 두는 장치입니다. 쿠폰을 쓰는 기본 조건입니다.',
  },
  {
    q: '후기를 꼭 받아야 해요?',
    a: '필수는 당근 단골입니다. 네이버·구글 후기는 매장이 원할 때만 켭니다.',
  },
  {
    q: '쿠폰 비용은 누가 내요?',
    a: '매장이 냅니다. 손님이 매장에서 쓸 때만 나가고, 월 구독료와 별도입니다.',
  },
  {
    q: '비싸네요.',
    a: '이벤트 하나 값이 아닙니다. 참여, 단골, 후기, 재방문을 잇는 시스템 비용입니다. 이 한 문장 뒤에는 더 설명하지 않습니다.',
  },
  {
    q: '효과가 확실해요?',
    a: '매출이 오른다고 말하지 않습니다. 손님이 참여하고, 단골이 되고, 후기를 남기고, 다시 올 수 있게 만드는 구조라고 말합니다.',
  },
  {
    q: '한번 해보고 결정하면 안 돼요?',
    a: '먼저 게임을 직접 해 보게 합니다. 운영 조건은 본사 기준으로 안내합니다.',
  },
  {
    q: '다른 데서 비슷한 거 봤어요.',
    a: '게임만 보면 비슷할 수 있습니다. 단골팅은 단골, 후기, 재방문, 매장 홍보까지 잇습니다.',
  },
  {
    q: '생각해보고 연락드릴게요.',
    a: '생각하셔도 됩니다. 판단 전에 게임 화면만 한번 보여 드리고 끝냅니다.',
  },
]

const NEVER = [
  '매출이 오른다고 말하기',
  '재방문이 늘어난다고 단정하기',
  '후기가 많이 생긴다고 보장하기',
  '당근 상위 노출을 약속하기',
  'AI가 매장을 추천한다고 말하기',
  '효과가 확실하다고 말하기',
]

const CHECKS = ['가입이 끝났는가', '입금이 끝났는가', '경품 내용과 한 달 수량', '리워드와 방문 횟수', '당근 단골 주소']

export default function PitchGuide() {
  const monthly = formatWon(PRICING.basic.price)
  const setup = formatWon(PRICING.basic.setupFee)
  const today = formatWon(PRICING_BASIC_TODAY_TOTAL)

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#222222]">
      <ManualNav current="pitch" />

      <main className="mx-auto max-w-3xl break-keep px-5 py-10 sm:py-14">
        <p className="text-[14px] font-bold text-[#019c87]">상담 전에 이 화면만 보세요</p>
        <h1 className="mt-3 text-[32px] font-extrabold leading-snug tracking-tight sm:text-[40px]">
          사장님 앞에서
          <br />
          이렇게 말하세요.
        </h1>
        <p className="mt-5 text-[18px] leading-relaxed text-[#222222]/75">
          외울 말, 3분 순서, 업종, 반론만 담았습니다. 상품 구조는 상품 설명, 금액은 요금제 안내를 엽니다.
        </p>

        <nav className="mt-8 grid grid-cols-2 gap-2" aria-label="현장 화법 목차">
          {[
            ['#lines', '외울 말'],
            ['#script', '3분 순서'],
            ['#industry', '업종 한 줄'],
            ['#objections', '반론'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="flex h-14 items-center justify-center bg-white text-[16px] font-extrabold"
              style={{ borderRadius: 12 }}
            >
              {label}
            </a>
          ))}
        </nav>

        <section id="lines" className="scroll-mt-[240px] pt-16">
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">외울 말</h2>
          <p className="mt-3 text-[16px] font-semibold text-[#222222]/60">상담 전에 이 다섯 문장만 기억합니다.</p>
          <ol className="mt-6 grid gap-3">
            {LINES.map((line, i) => (
              <li key={line} className="flex gap-4 bg-white p-5" style={{ borderRadius: 16 }}>
                <span className="text-[20px] font-extrabold text-[#019c87]">{i + 1}</span>
                <p className="text-[18px] font-extrabold leading-snug">{line}</p>
              </li>
            ))}
          </ol>

          <p className="mt-4 bg-[#E3FBF6] p-6 text-[20px] font-extrabold leading-snug sm:text-[22px]" style={{ borderRadius: 16 }}>
            방문 → 게임 → 쿠폰 → 당근 단골 → 후기 → 다시 방문
          </p>

          <div className="mt-4 bg-white p-6" style={{ borderRadius: 16 }}>
            <p className="text-[14px] font-bold text-[#019c87]">영업자가 하는 일</p>
            <p className="mt-2 text-[18px] font-extrabold leading-snug">
              매장을 찾고, 상담하고, 시연하고, 계약을 확인하고, 결제를 안내합니다.
            </p>
            <p className="mt-3 text-[16px] font-semibold leading-relaxed text-[#222222]/70">
              계약 처리, 세팅, 운영, 기술 지원은 본사가 합니다. 영업자가 기술자가 될 필요는 없습니다.
            </p>
          </div>
        </section>

        <section id="script" className="scroll-mt-[240px] pt-16">
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">3분 순서</h2>
          <p className="mt-3 text-[16px] font-semibold leading-relaxed text-[#222222]/60">
            아래 문장은 그대로 읽어도 됩니다. 기능을 하나씩 설명하지 않습니다.
          </p>

          <div className="mt-6 grid gap-4">
            <article className="bg-white p-6" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-extrabold text-[#019c87]">20초 · 첫 마디</p>
              <h3 className="mt-2 text-[22px] font-extrabold leading-snug">상품명부터 말하지 않습니다.</h3>
              <div className="mt-4 grid gap-3 text-[17px] font-semibold leading-relaxed">
                <p className="border-l-4 border-[#00C7A7] pl-4">
                  사장님, 잠깐만 여쭤볼게요. 광고로 새 손님을 데려오는 것도 중요하지만, 한 번 왔던 손님이 다시 오는 게 더 중요하지 않으세요?
                </p>
                <p className="border-l-4 border-[#00C7A7] pl-4">
                  그 재방문을 게임으로 만드는 서비스를 하고 있습니다. 1분만 직접 보여드릴게요.
                </p>
              </div>
            </article>

            <article className="bg-white p-6" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-extrabold text-[#019c87]">30초 · 질문</p>
              <h3 className="mt-2 text-[22px] font-extrabold leading-snug">질문은 두 개만 합니다.</h3>
              <div className="mt-4 grid gap-3 text-[17px] font-semibold leading-relaxed">
                <p className="border-l-4 border-[#00C7A7] pl-4">사장님 매장은 기존 손님이 다시 오는 게 중요하시죠?</p>
                <p className="border-l-4 border-[#00C7A7] pl-4">손님들이 네이버 후기나 당근 단골을 많이 남겨 주시나요?</p>
                <p className="text-[16px] leading-relaxed text-[#222222]/70">답을 들은 뒤, 이렇게 잇습니다.</p>
                <p className="border-l-4 border-[#00C7A7] pl-4">그래서 만든 게 단골팅입니다.</p>
              </div>
            </article>

            <article className="bg-white p-6" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-extrabold text-[#019c87]">60초 · 설명</p>
              <h3 className="mt-2 text-[22px] font-extrabold leading-snug">네 문장으로 끝냅니다.</h3>
              <ol className="mt-4 grid gap-3 text-[17px] font-semibold leading-relaxed">
                {[
                  '손님이 매장에서 QR을 찍으면 게임을 합니다.',
                  '게임을 하고 쿠폰이나 리워드를 받습니다.',
                  '그 과정에서 당근 단골을 만들고, 매장이 원하면 네이버·구글 후기도 안내할 수 있습니다.',
                  '받은 혜택을 쓰려고 매장에 다시 오게 됩니다.',
                ].map((line, i) => (
                  <li key={line} className="flex gap-3">
                    <span className="font-extrabold text-[#019c87]">{i + 1}</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 bg-[#FFF3DE] p-4 text-[17px] font-extrabold leading-snug" style={{ borderRadius: 12 }}>
                게임 하나를 파는 게 아닙니다. 한 번 온 손님을 단골로 만들고, 그 후기와 활동을 매장 홍보로 잇는 겁니다.
              </p>
            </article>

            <article className="bg-white p-6" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-extrabold text-[#019c87]">30초 · 시연</p>
              <h3 className="mt-2 text-[22px] font-extrabold leading-snug">말보다 화면을 보여 줍니다.</h3>
              <p className="mt-4 border-l-4 border-[#00C7A7] pl-4 text-[17px] font-semibold leading-relaxed">
                말로 설명드리는 것보다, 직접 한번 해보시는 게 빠릅니다.
              </p>
              <p className="mt-3 text-[16px] leading-relaxed text-[#222222]/75">
                사장님이 QR을 찍게 합니다. 게임, 쿠폰, 단골, 후기 화면까지 보여 줍니다.
              </p>
              <p className="mt-3 text-[17px] font-semibold leading-relaxed">
                손님 입장에서는 재미있는 이벤트입니다. 매장 입장에서는 손님의 행동 하나하나가 마케팅이 됩니다.
              </p>
              <a
                href={DEMO_PLAY_URL}
                className="mt-5 flex items-center justify-between bg-[#00C7A7] px-5 py-4 text-[17px] font-extrabold"
                style={{ borderRadius: 14 }}
              >
                시연 게임 열기
                <span aria-hidden>→</span>
              </a>
            </article>

            <article className="bg-white p-6" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-extrabold text-[#019c87]">30초 · 효과</p>
              <h3 className="mt-2 text-[22px] font-extrabold leading-snug">이 네 단어만 말합니다.</h3>
              <ul className="mt-4 grid grid-cols-2 gap-2">
                {['참여', '단골', '후기', '재방문'].map((word) => (
                  <li
                    key={word}
                    className="flex h-14 items-center justify-center bg-[#E3FBF6] text-[18px] font-extrabold"
                    style={{ borderRadius: 12 }}
                  >
                    {word}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[17px] font-semibold leading-relaxed">
                손님 한 명을 데려와서 끝나는 게 아닙니다. 참여시키고, 단골로 만들고, 후기를 만들고, 다시 오게 하는 겁니다.
              </p>
            </article>

            <article className="bg-white p-6" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-extrabold text-[#019c87]">가격</p>
              <h3 className="mt-2 text-[22px] font-extrabold leading-snug">단골팅은 숫자 두 개만 말합니다.</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="bg-[#FAF7F0] p-4" style={{ borderRadius: 12 }}>
                  <p className="text-[14px] font-bold text-[#222222]/50">매달</p>
                  <p className="mt-1 text-[28px] font-extrabold">{monthly}</p>
                </div>
                <div className="bg-[#FAF7F0] p-4" style={{ borderRadius: 12 }}>
                  <p className="text-[14px] font-bold text-[#222222]/50">처음 세팅, 한 번</p>
                  <p className="mt-1 text-[28px] font-extrabold">{setup}</p>
                </div>
              </div>
              <p className="mt-4 text-[16px] font-semibold leading-relaxed">
                신청 당일은 세팅비와 첫 달을 합쳐 {today}입니다. 금액은 모두 부가세 포함입니다.
              </p>
              <p className="mt-2 text-[16px] leading-relaxed text-[#222222]/70">
                당근마케팅과 AEO 미니홈피는 필요할 때만 말합니다. 그 금액은 요금제 안내의 숫자만 읽습니다. 임의로 깎지 않습니다.
              </p>
              <a
                href="/sales-manual/pricing"
                className="mt-5 flex items-center justify-between bg-[#222222] px-5 py-4 text-[17px] font-extrabold text-white"
                style={{ borderRadius: 14 }}
              >
                요금제 안내 열기
                <span aria-hidden>→</span>
              </a>
            </article>

            <article className="bg-[#00C7A7] p-6" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-extrabold">계약</p>
              <h3 className="mt-2 text-[22px] font-extrabold leading-snug">관심이 보이면 이렇게 닫습니다.</h3>
              <div className="mt-4 grid gap-3 text-[17px] font-extrabold leading-relaxed">
                <p>사장님 매장에 한번 적용해 보시겠어요?</p>
                <p>오늘 진행하시면, 세팅은 본사에서 합니다.</p>
              </div>
            </article>
          </div>

          <p className="mt-4 bg-[#222222] p-6 text-[20px] font-extrabold leading-snug text-white sm:text-[22px]" style={{ borderRadius: 16 }}>
            설명하지 말고, 사장님이 직접 하게 하세요.
          </p>
        </section>

        <section id="industry" className="scroll-mt-[240px] pt-16">
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">업종 한 줄</h2>
          <p className="mt-3 text-[17px] leading-relaxed text-[#222222]/75">
            업종 이름이 아니라, 손님이 다시 와야 하는 곳이면 제안합니다. 첫마디만 바꿉니다.
          </p>
          <ul className="mt-6 grid gap-2">
            {INDUSTRIES.map(([name, line]) => (
              <li key={name} className="bg-white px-5 py-4" style={{ borderRadius: 14 }}>
                <p className="text-[14px] font-extrabold text-[#019c87]">{name}</p>
                <p className="mt-1 text-[18px] font-extrabold leading-snug">{line}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 bg-[#FFF3DE] p-5 text-[16px] font-semibold leading-relaxed" style={{ borderRadius: 14 }}>
            청소와 학원은 매일 오는 업종이 아닙니다. 재방문보다 후기, 소개, 재등록을 먼저 말합니다.
          </p>

          <div className="mt-8 grid gap-3">
            <article className="bg-white p-6" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-extrabold text-[#019c87]">주류 도매</p>
              <p className="mt-3 border-l-4 border-[#00C7A7] pl-4 text-[17px] font-semibold leading-relaxed">
                사장님, 오늘 주류 때문에 온 건 아닙니다. 손님을 다시 오게 하는 걸 한번 보여드리려고요.
              </p>
              <p className="mt-3 text-[16px] leading-relaxed text-[#222222]/75">
                바로 게임을 보여 줍니다. 새 광고를 파는 말이 아니라, 기존 거래처에 더하는 매장 마케팅이라고 말합니다.
              </p>
            </article>
            <article className="bg-white p-6" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-extrabold text-[#019c87]">배달 대행사</p>
              <p className="mt-3 border-l-4 border-[#00C7A7] pl-4 text-[17px] font-semibold leading-relaxed">
                사장님, 배달 주문과 별개로, 매장에 직접 온 손님을 다시 잡는 일도 한번 보시면 좋겠습니다.
              </p>
              <p className="mt-3 text-[16px] leading-relaxed text-[#222222]/75">
                배달과 경쟁하는 상품처럼 말하지 않습니다. 주문 유입과 방문 손님은 다른 일입니다.
              </p>
            </article>
            <article className="bg-white p-6" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-extrabold text-[#019c87]">처음 가는 프리랜서</p>
              <p className="mt-3 border-l-4 border-[#00C7A7] pl-4 text-[17px] font-semibold leading-relaxed">
                사장님, 광고 권하러 온 게 아닙니다. 이미 온 손님을 다시 오게 하는 걸 잠깐 보여드리려고요.
              </p>
              <p className="mt-3 text-[16px] leading-relaxed text-[#222222]/75">관심이 보이면 설명 대신 QR을 찍게 합니다.</p>
            </article>
          </div>

          <div className="mt-4 bg-white p-6" style={{ borderRadius: 16 }}>
            <p className="text-[18px] font-extrabold">모르는 업종이면 이 두 가지만 봅니다.</p>
            <ul className="mt-4 grid gap-3 text-[16px] font-semibold leading-relaxed">
              <li>손님이 다시 와야 하는 곳이면 단골팅을 제안합니다.</li>
              <li>후기와 동네 새 손님이 중요하면 당근마케팅과 AEO를 함께 말합니다.</li>
            </ul>
          </div>
        </section>

        <section id="objections" className="scroll-mt-[240px] pt-16">
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">반론</h2>
          <p className="mt-3 text-[17px] leading-relaxed text-[#222222]/75">말로 이기지 않습니다. 짧게 답하고, 보여 주고, 다시 묻습니다.</p>
          <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {['인정한다', '한 문장으로 답한다', '게임을 보여 준다', '뭐가 필요한지 묻는다'].map((step, i) => (
              <li key={step} className="bg-white p-4" style={{ borderRadius: 14 }}>
                <span className="text-[13px] font-extrabold text-[#019c87]">{i + 1}</span>
                <p className="mt-1 text-[16px] font-extrabold leading-snug">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-4 grid gap-3">
            {OBJECTIONS.map((item) => (
              <article key={item.q} className="bg-white p-5" style={{ borderRadius: 16 }}>
                <h3 className="text-[18px] font-extrabold leading-snug">{item.q}</h3>
                <p className="mt-2 text-[16px] font-semibold leading-relaxed text-[#222222]/80">{item.a}</p>
              </article>
            ))}
          </div>

          <div className="mt-4 bg-[#FFF3DE] p-5" style={{ borderRadius: 16 }}>
            <p className="text-[14px] font-extrabold text-[#019c87]">가격을 듣고 망설일 때</p>
            <p className="mt-2 text-[17px] font-semibold leading-relaxed">
              그 자리에서 깎거나 조건을 바꾸지 않습니다. 비교해 보셔도 된다고 말한 뒤, 이벤트 비용이 아니라 이미 온 손님을 다시 쓰기 위한 시스템이라고 한 번만 말합니다.
            </p>
          </div>

          <div className="mt-4">
            <h3 className="text-[20px] font-extrabold">이렇게는 말하지 않습니다</h3>
            <ul className="mt-3 grid gap-2">
              {NEVER.map((item) => (
                <li key={item} className="bg-[#222222] px-5 py-4 text-[16px] font-semibold text-white" style={{ borderRadius: 12 }}>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 bg-white p-5 text-[16px] font-semibold leading-relaxed" style={{ borderRadius: 14 }}>
              대신 이렇게 말합니다. 손님이 그런 행동을 하도록 만드는 구조입니다. 결과는 업종, 손님, 매장 운영에 따라 달라집니다.
            </p>
            <p className="mt-3 bg-[#E3FBF6] p-5 text-[16px] font-semibold leading-relaxed" style={{ borderRadius: 14 }}>
              AEO 미니홈피는 이렇게만 말합니다. 매장 정보를 검색과 AI가 읽기 쉽게 정리하는 시스템입니다.
            </p>
          </div>
        </section>

        <section className="pt-16">
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">접수 전 체크</h2>
          <p className="mt-3 text-[17px] leading-relaxed text-[#222222]/75">가입과 입금이 끝난 매장만 접수합니다. 영업자가 써도 되고, 사장님이 직접 써도 됩니다.</p>
          <ul className="mt-5 grid gap-2">
            {CHECKS.map((item) => (
              <li key={item} className="bg-white px-5 py-4 text-[17px] font-extrabold" style={{ borderRadius: 14 }}>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-3 text-[16px] font-semibold leading-relaxed">
            <p className="bg-[#FFF3DE] p-5" style={{ borderRadius: 14 }}>
              확률, 꽝, 하루 참여 횟수, 포인트 기간, 홈페이지 문장은 영업자가 정하지 않습니다. 본사가 정합니다.
            </p>
            <p className="bg-white p-5" style={{ borderRadius: 14 }}>
              리워드는 포인트 숫자가 아니라, 몇 번 방문하면 무엇을 주는지입니다. 사진은 올리지 않고, 있으면 카카오톡으로 보낸다고 체크합니다. 네이버 플레이스 주소가 없으면 비워도 됩니다.
            </p>
          </div>
          <a
            href="/setup-request"
            className="mt-5 flex items-center justify-between bg-[#00C7A7] px-6 py-5 text-[18px] font-extrabold"
            style={{ borderRadius: 16 }}
          >
            세팅 접수 열기
            <span aria-hidden>→</span>
          </a>
        </section>
      </main>
    </div>
  )
}
