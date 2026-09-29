import {
  CONTENT_OPS_ADDONS,
  HOMEPAGE_SERVICE,
  PRICING,
  PRICING_BASIC_TODAY_TOTAL,
  formatWon,
} from '@/lib/landing-v5/config'
import ManualNav from './ManualNav'

/** 만·천 단위로만 떨어지는 금액만 말로 바꿉니다. 그 외에는 숫자 표기를 그대로 씁니다. */
function speakWon(value: number) {
  if (value % 1000 !== 0) return formatWon(value)
  const man = Math.floor(value / 10000)
  const cheon = Math.floor((value % 10000) / 1000)
  if (man === 0) return `${cheon}천 원`
  if (cheon === 0) return `${man}만 원`
  return `${man}만 ${cheon}천 원`
}

const MONTHLY = [
  '인형뽑기 게임',
  '쿠폰과 포인트',
  '당근 단골 추가',
  '관리자 화면에서 보는 참여·쿠폰·재방문',
]

const ONCE = ['테이블 QR 스티커', '계산대 POP 2매', '포스터 또는 X배너']

export default function PricingGuide() {
  const monthly = PRICING.basic.price
  const setup = PRICING.basic.setupFee
  const today = PRICING_BASIC_TODAY_TOTAL

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#222222]">
      <ManualNav current="pricing" />

      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-[14px] font-bold text-[#019c87]">사장님 앞에서 이 화면만 보여 주세요</p>
        <h1 className="mt-3 text-[32px] font-extrabold leading-snug tracking-tight sm:text-[40px]">
          단골마케팅은
          <br />
          이렇게 냅니다.
        </h1>
        <p className="mt-4 text-[18px] font-semibold leading-relaxed text-[#222222]/75">
          매달 내는 돈과, 처음에 한 번만 내는 세팅비가 있습니다. 당근마케팅과 홈피마케팅은 필요할 때만 따로 추가합니다.
        </p>
        <nav className="mt-6 grid grid-cols-3 gap-2 text-[15px] font-extrabold" aria-label="요금 바로가기">
          {[
            ['#basic', '단골'],
            ['#danggeun', '당근'],
            ['#homepage', '홈피'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="flex h-12 items-center justify-center bg-white" style={{ borderRadius: 12 }}>
              {label}
            </a>
          ))}
        </nav>

        <div id="basic" className="mt-8 grid scroll-mt-32 gap-3">
          <article className="bg-[#00C7A7] p-6 sm:p-8" style={{ borderRadius: 20 }}>
            <p className="text-[16px] font-bold">매달</p>
            <p className="mt-2 text-[44px] font-extrabold leading-none tracking-tight sm:text-[56px]">
              {formatWon(monthly)}
            </p>
            <p className="mt-3 text-[16px] font-semibold text-[#222222]/75">부가세가 포함된 금액입니다.</p>
          </article>

          <article className="bg-white p-6 sm:p-8" style={{ borderRadius: 20 }}>
            <p className="text-[16px] font-bold text-[#019c87]">처음 한 번</p>
            <p className="mt-2 text-[44px] font-extrabold leading-none tracking-tight sm:text-[56px]">
              {formatWon(setup)}
            </p>
            <p className="mt-3 text-[16px] font-semibold text-[#222222]/70">세팅비입니다. 다음 달부터는 없습니다.</p>
          </article>
        </div>

        <h2 className="mt-14 text-[26px] font-extrabold tracking-tight sm:text-[32px]">돈은 이렇게 나갑니다</h2>
        <ol className="mt-6 grid gap-3">
          <li className="bg-white p-6" style={{ borderRadius: 16 }}>
            <p className="text-[15px] font-bold text-[#019c87]">1. 오늘</p>
            <p className="mt-2 text-[36px] font-extrabold leading-none tracking-tight">{formatWon(today)}</p>
            <p className="mt-3 text-[17px] font-semibold leading-relaxed">
              {speakWon(setup)} + 첫 달 {speakWon(monthly)}
            </p>
          </li>
          <li className="bg-white p-6" style={{ borderRadius: 16 }}>
            <p className="text-[15px] font-bold text-[#019c87]">2. 다음 달부터</p>
            <p className="mt-2 text-[36px] font-extrabold leading-none tracking-tight">{formatWon(monthly)}</p>
            <p className="mt-3 text-[17px] font-semibold">매달 이것만 나갑니다.</p>
          </li>
          <li className="bg-white p-6" style={{ borderRadius: 16 }}>
            <p className="text-[15px] font-bold text-[#019c87]">3. 그만두고 싶을 때</p>
            <p className="mt-2 text-[28px] font-extrabold leading-snug">언제든 해지. 위약금 없음.</p>
          </li>
        </ol>

        <section className="mt-8 bg-[#E3FBF6] p-6 sm:p-8" style={{ borderRadius: 20 }}>
          <h2 className="text-[18px] font-extrabold text-[#019c87]">그대로 읽으세요</h2>
          <p className="mt-4 text-[20px] font-extrabold leading-relaxed sm:text-[22px]">
            매달 {speakWon(monthly)}이고, 부가세가 포함된 금액입니다. 처음에 세팅비 {speakWon(setup)}을 한 번
            내시면, 오늘은 {speakWon(today)}입니다. 다음 달부터는 {speakWon(monthly)}만 나갑니다. 언제든 그만두실
            수 있고, 위약금은 없습니다.
          </p>
        </section>

        <h2 className="mt-14 text-[26px] font-extrabold tracking-tight sm:text-[32px]">이 돈으로 받는 것</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <article className="bg-white p-6" style={{ borderRadius: 16 }}>
            <h3 className="text-[18px] font-extrabold">매달 {speakWon(monthly)}</h3>
            <ul className="mt-4 grid gap-2 text-[16px] font-semibold leading-relaxed">
              {MONTHLY.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="bg-[#FFF3DE] p-6" style={{ borderRadius: 16 }}>
            <h3 className="text-[18px] font-extrabold">세팅비에 들어 있는 실물</h3>
            <ul className="mt-4 grid gap-2 text-[16px] font-semibold leading-relaxed">
              {ONCE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <p className="mt-4 bg-white px-5 py-4 text-[17px] font-semibold leading-relaxed" style={{ borderRadius: 16 }}>
          경품과 할인 비용은 여기에 없습니다. 손님이 매장에서 쿠폰을 쓸 때만 매장이 내고, 안 오면 나가지 않습니다.
        </p>

        <section id="danggeun" className="scroll-mt-32 pt-16">
          <p className="text-[14px] font-bold text-[#019c87]">선택 · 필요할 때만</p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-tight">당근마케팅</h2>
          <p className="mt-3 text-[18px] font-semibold leading-relaxed">
            월 구독이 아닙니다. 필요한 항목만 그때 신청합니다.
          </p>
          <ul className="mt-5 bg-white" style={{ borderRadius: 16 }}>
            {CONTENT_OPS_ADDONS.map((item) => (
              <li key={item.id} className="border-b border-[#222222]/10 px-5 py-4 last:border-0">
                <p className="text-[17px] font-extrabold leading-snug">{item.name}</p>
                <p className="mt-1 text-[14px] font-semibold text-[#222222]/55">
                  {item.freqLabel}
                  {item.note ? ` · ${item.note.replace('※ ', '')}` : ''}
                </p>
                <p className="mt-2 text-[22px] font-extrabold tracking-tight">{formatWon(item.price)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="homepage" className="scroll-mt-32 pt-12">
          <p className="text-[14px] font-bold text-[#019c87]">선택 · 필요할 때만</p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-tight">{HOMEPAGE_SERVICE.name}</h2>
          <p className="mt-3 text-[18px] font-semibold leading-relaxed">매장 홈페이지를 만들어 주는 비용입니다.</p>
          <div className="mt-5 grid gap-3">
            <article className="bg-white p-6" style={{ borderRadius: 16 }}>
              <p className="text-[15px] font-bold text-[#019c87]">제작비 · 한 번</p>
              <p className="mt-2 text-[36px] font-extrabold leading-none tracking-tight">
                {formatWon(HOMEPAGE_SERVICE.setup.price)}
              </p>
            </article>
            <article className="bg-[#E3FBF6] p-6" style={{ borderRadius: 16 }}>
              <p className="text-[15px] font-bold text-[#019c87]">유지비</p>
              <p className="mt-2 text-[32px] font-extrabold leading-snug">첫 1년 무료</p>
              <p className="mt-2 text-[16px] font-semibold leading-relaxed">
                {HOMEPAGE_SERVICE.maintenance.promo.resumeNote}. 도메인 발급, 구글·네이버 등록이 포함됩니다.
              </p>
            </article>
          </div>
        </section>

        <p className="mt-8 text-[15px] font-semibold leading-relaxed text-[#222222]/60">
          선택 요금도 부가세가 포함된 금액입니다. 단골마케팅 월 {formatWon(monthly)}에 들어 있지 않습니다.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-[#222222]/60">
          먼저 말하는 금액은 항상 위 금액입니다. 더 낮은 금액은 본사 확인 후에만 말합니다.
        </p>
      </main>
    </div>
  )
}
