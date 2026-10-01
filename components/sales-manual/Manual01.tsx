import {
  BANK_ACCOUNT,
  DEMO_PLAY_URL,
  PRICING,
  PRICING_BASIC_TODAY_TOTAL,
  SIGNUP_PATH,
  formatWon,
} from '@/lib/landing-v5/config'
import ManualNav from './ManualNav'

const SITE = 'https://www.dgting.co.kr'

const INCLUDED = [
  '인형뽑기 게임 이벤트 1개',
  '쿠폰과 포인트',
  '당근 단골 추가 연결',
  '매장이 원하면 네이버 후기, 구글 후기 연결',
  '매장 QR과 온라인 링크',
  '관리자 화면에서 보는 마케팅 성과리포트, 쿠폰 현황',
]

const SETUP_ITEMS = PRICING.basic.setupIncludes

const NOT_INCLUDED = ['당근마케팅', 'AEO 미니홈피']

const NEVER_SAY = [
  '매출이 얼마 오른다는 숫자',
  '후기 문장을 우리가 써 준다는 말',
  '별점이나 좋은 후기를 보장한다는 말',
  '위에 없는 상품이 이 가격에 들어 있다는 말',
]

const FLOW = [
  '손님이 매장 QR을 찍거나, 온라인 링크를 누릅니다.',
  '로그인 없이 인형뽑기 한 판을 합니다.',
  '결과를 저장할 때 카카오 로그인을 한 번 합니다.',
  '쿠폰이나 포인트가 생깁니다.',
  '쿠폰을 쓰려면 당근 단골 추가가 필요합니다. 네이버·구글 후기는 매장이 켜 둔 경우에만 함께 안내됩니다.',
  '손님이 다시 와 계산대에서 쿠폰을 보여 주면, 직원이 확인하고 혜택을 줍니다.',
  '참여 수, 쿠폰, 재방문은 관리자 화면에서 숫자로 보입니다.',
]

const ANSWERS = [
  {
    q: '한 달에 얼마예요?',
    a: `매달 ${formatWon(PRICING.basic.price)}입니다. 부가세가 포함된 금액이고, 이 외에 구독료는 없습니다.`,
  },
  {
    q: '처음에 더 내요?',
    a: `세팅비 ${formatWon(PRICING.basic.setupFee)}을 처음 한 번 냅니다. 신청 당일에는 세팅비와 첫 달을 합쳐 ${formatWon(PRICING_BASIC_TODAY_TOTAL)}입니다.`,
  },
  {
    q: '경품 값은 누가 내요?',
    a: '매장이 냅니다. 손님이 실제로 매장에서 혜택을 쓸 때만 비용이 나가고, 안 오면 나가지 않습니다. 이 비용은 월 구독료와 별도입니다.',
  },
  {
    q: '계약 기간이 있어요?',
    a: '없습니다. 언제든 해지할 수 있고 위약금도 없습니다.',
  },
  {
    q: '손님이 매일 공짜로 받아가지 않아요?',
    a: '기본은 하루에 한 번입니다. 매장이 원하면 참여 간격을 조절할 수 있습니다.',
  },
  {
    q: '직원은 뭘 해야 해요?',
    a: '손님이 보여 주는 쿠폰 화면에서 확인하고, 적힌 할인이나 상품을 주면 됩니다.',
  },
  {
    q: '언제부터 쓸 수 있어요?',
    a: '입금이 확인되면 24시간 안에 세팅합니다. QR 인쇄물은 매장으로 택배가 갑니다.',
  },
]

export default function Manual01() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#222222]">
      <ManualNav current="product" />

      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-[14px] font-bold text-[#019c87]">주류 도매 · 배달 대행사 영업용</p>
        <h1 className="mt-3 text-[32px] font-extrabold leading-snug tracking-tight sm:text-[40px]">
          단골마케팅,
          <br />
          이것만 말하고 파세요.
        </h1>
        <p className="mt-5 text-[18px] leading-relaxed text-[#222222]/75">
          이 편은 상품 설명입니다. 무엇을 파는지, 시스템이 어떻게 도는지, 얼마인지, 돈은 누가 받는지만 담았습니다.
          상담 화법과 계약 순서는 다음 편입니다.
        </p>

        <nav className="mt-8 grid gap-2 text-[16px] font-bold" aria-label="이 편의 목차">
          {[
            ['#what', '1. 한 문장으로'],
            ['#flow', '2. 시스템이 도는 순서'],
            ['#features', '3. 들어 있는 기능'],
            ['/sales-manual/pricing', '4. 요금제 안내'],
            ['#contract', '5. 계약과 입금'],
            ['#answers', '6. 바로 답하는 말'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="bg-white px-4 py-3" style={{ borderRadius: 12 }}>
              {label}
            </a>
          ))}
        </nav>

        <section id="what" className="scroll-mt-32 pt-16">
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">1. 한 문장으로</h2>
          <p className="mt-5 bg-[#E3FBF6] p-6 text-[20px] font-extrabold leading-snug sm:p-8 sm:text-[24px]" style={{ borderRadius: 16 }}>
            인형뽑기 한 판으로 쿠폰을 주고, 그 쿠폰을 쓰려면 당근 단골이 되어야 합니다. 그래서 손님은 다시 오고,
            매장의 단골 수는 늘어납니다.
          </p>
          <p className="mt-5 text-[17px] leading-relaxed text-[#222222]/75">
            게임은 목적이 아닙니다. 다시 오게 만드는 장치입니다. 광고비를 더 쓰는 상품이 아니라, 이미 온 손님을
            단골로 남기는 상품입니다.
          </p>
        </section>

        <section id="flow" className="scroll-mt-32 pt-16">
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">2. 시스템이 도는 순서</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#222222]/75">
            사장님께 설명할 때는 이 순서 그대로 말합니다. 순서를 건너뛰지 마세요.
          </p>
          <ol className="mt-6 grid gap-3">
            {FLOW.map((step, i) => (
              <li key={step} className="flex gap-4 bg-white p-5" style={{ borderRadius: 16 }}>
                <span className="font-mono text-[22px] font-bold text-[#00C7A7]">{String(i + 1).padStart(2, '0')}</span>
                <p className="pt-0.5 text-[17px] font-semibold leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-5 border border-[#222222]/10 bg-white p-5" style={{ borderRadius: 16 }}>
            <p className="text-[15px] font-bold text-[#019c87]">쿠폰 조건, 이렇게만 말합니다</p>
            <p className="mt-2 text-[17px] font-semibold leading-relaxed">
              당근 단골 추가는 기본입니다. 네이버 후기와 구글 후기는 매장이 켤지 정합니다. 후기를 켜도, 무슨 글을
              쓸지는 손님이 정합니다.
            </p>
          </div>
        </section>

        <section id="features" className="scroll-mt-32 pt-16">
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">3. 들어 있는 기능</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#222222]/75">
            이번 편에서 파는 상품은 단골마케팅 하나입니다.
          </p>

          <h3 className="mt-8 text-[20px] font-extrabold">이 가격에 들어 있습니다</h3>
          <ul className="mt-4 grid gap-2">
            {INCLUDED.map((item) => (
              <li key={item} className="bg-white px-5 py-4 text-[17px] font-semibold" style={{ borderRadius: 12 }}>
                {item}
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-[20px] font-extrabold">세팅비에 들어 있는 실물</h3>
          <ul className="mt-4 grid gap-2">
            {SETUP_ITEMS.map((item) => (
              <li key={item} className="bg-[#FFF3DE] px-5 py-4 text-[17px] font-semibold" style={{ borderRadius: 12 }}>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[15px] leading-relaxed text-[#222222]/65">
            세팅이 끝나면 QR 인쇄물을 매장으로 보냅니다. 매장이 직접 출력해서 붙이는 구조가 아닙니다.
          </p>

          <h3 className="mt-8 text-[20px] font-extrabold">매장이 따로 내는 것</h3>
          <p className="mt-3 bg-white px-5 py-4 text-[17px] font-semibold leading-relaxed" style={{ borderRadius: 12 }}>
            손님이 실제로 받는 경품과 할인. 쿠폰을 쓰지 않으면 이 비용은 나가지 않습니다.
          </p>

          <h3 className="mt-8 text-[20px] font-extrabold">이 가격에 포함되지 않습니다</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-[#222222]/65">
            필요할 때만 따로 추가합니다. 금액은 요금제 안내 화면의 숫자만 말합니다.
          </p>
          <ul className="mt-4 grid gap-2">
            {NOT_INCLUDED.map((item) => (
              <li
                key={item}
                className="border border-[#222222]/10 px-5 py-4 text-[17px] font-semibold text-[#222222]/70"
                style={{ borderRadius: 12 }}
              >
                {item}
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-[20px] font-extrabold">말하면 안 됩니다</h3>
          <ul className="mt-4 grid gap-2">
            {NEVER_SAY.map((item) => (
              <li key={item} className="bg-[#222222] px-5 py-4 text-[17px] font-semibold text-white" style={{ borderRadius: 12 }}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section id="price" className="scroll-mt-32 pt-16">
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">4. 요금제 안내</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#222222]/75">
            가격은 상단 메뉴의 요금제 안내에서 그대로 읽어 주세요. 금액이 그 화면에 크게 나와 있습니다.
          </p>
          <a
            href="/sales-manual/pricing"
            className="mt-6 flex items-center justify-between bg-[#00C7A7] px-6 py-5 text-[18px] font-extrabold"
            style={{ borderRadius: 16 }}
          >
            요금제 안내 열기
            <span aria-hidden>→</span>
          </a>
        </section>

        <section id="contract" className="scroll-mt-32 pt-16">
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">5. 계약과 입금</h2>
          <p className="mt-5 text-[20px] font-extrabold leading-snug">
            계약은 매장과 단골팅 본사입니다.
            <br />
            영업자는 소개하고, 체험을 보여 주고, 신청까지 돕습니다.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <article className="bg-white p-5" style={{ borderRadius: 16 }}>
              <h3 className="text-[18px] font-extrabold">영업자가 하는 일</h3>
              <ul className="mt-3 grid gap-2 text-[16px] font-semibold leading-relaxed">
                <li>상품을 이 메뉴얼대로 설명한다</li>
                <li>체험 화면을 보여 준다</li>
                <li>가입 신청을 함께 한다</li>
                <li>입금 계좌를 안내한다</li>
              </ul>
            </article>
            <article className="bg-[#222222] p-5 text-white" style={{ borderRadius: 16 }}>
              <h3 className="text-[18px] font-extrabold">하면 안 되는 일</h3>
              <ul className="mt-3 grid gap-2 text-[16px] font-semibold leading-relaxed text-white/90">
                <li>현금을 직접 받는다</li>
                <li>자기 계좌로 입금받는다</li>
                <li>본사 확인 없이 할인 금액을 확정한다</li>
                <li>별도 상품을 이 가격에 포함해 약속한다</li>
              </ul>
            </article>
          </div>

          <div className="mt-4 bg-white p-6" style={{ borderRadius: 16 }}>
            <p className="text-[15px] font-bold text-[#019c87]">현장에서 여는 주소</p>
            <dl className="mt-4 grid gap-4 text-[16px]">
              <div>
                <dt className="font-bold">체험</dt>
                <dd className="mt-1 break-all font-semibold text-[#019c87]">
                  <a href={DEMO_PLAY_URL}>{DEMO_PLAY_URL}</a>
                </dd>
              </div>
              <div>
                <dt className="font-bold">가입 신청</dt>
                <dd className="mt-1 break-all font-semibold text-[#019c87]">
                  <a href={`${SITE}${SIGNUP_PATH}`}>{SITE}{SIGNUP_PATH}</a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-4 bg-white p-6" style={{ borderRadius: 16 }}>
            <p className="text-[15px] font-bold text-[#019c87]">입금은 본사 계좌로</p>
            <dl className="mt-4 grid gap-3 text-[17px] font-semibold">
              <div className="flex justify-between gap-4">
                <dt className="text-[#222222]/55">은행</dt>
                <dd>{BANK_ACCOUNT.bank}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#222222]/55">계좌</dt>
                <dd>{BANK_ACCOUNT.account}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#222222]/55">예금주</dt>
                <dd>{BANK_ACCOUNT.holder}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-[#222222]/10 pt-3">
                <dt className="text-[#222222]/55">금액</dt>
                <dd className="font-extrabold">{formatWon(PRICING_BASIC_TODAY_TOTAL)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-[15px] leading-relaxed text-[#222222]/65">
              입금이 확인되면 이용이 시작되고, 24시간 안에 세팅을 진행합니다.
            </p>
          </div>
        </section>

        <section id="answers" className="scroll-mt-32 pt-16">
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">6. 바로 답하는 말</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#222222]/75">
            가격과 기능 질문만 모았습니다. 거절을 돌리는 상담 말은 다음 편입니다.
          </p>
          <div className="mt-6 grid gap-3">
            {ANSWERS.map((item) => (
              <article key={item.q} className="bg-white p-5" style={{ borderRadius: 16 }}>
                <h3 className="text-[18px] font-extrabold">{item.q}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-[#222222]/75">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <p className="mt-16 border-t border-[#222222]/10 pt-6 text-[14px] leading-relaxed text-[#222222]/50">
          1편은 상품 설명입니다. 다음 편에서 방문 전 준비, 상담 순서, 신청 마무리를 다룹니다.
        </p>
      </main>
    </div>
  )
}
