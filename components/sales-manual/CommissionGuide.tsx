const BASIC = [
  {
    name: '단골팅 설치·세팅',
    price: '290,000원',
    priceNote: 'VAT 포함',
    fee: '100,000원',
    feeNote: '매장당',
  },
  {
    name: '단골팅 월 구독',
    price: '49,000원',
    priceNote: 'VAT 포함',
    fee: '50%',
    feeNote: '부가세 제외 공급가액',
  },
  {
    name: '당근마켓 소식 발행·최적화',
    price: '330,000원',
    priceNote: 'VAT 포함',
    fee: '90,000원',
    feeNote: '건당',
  },
  {
    name: 'AEO 미니홈피',
    price: '290,000원',
    priceNote: '세팅비',
    fee: '50%',
    feeNote: '부가세 제외 공급가액',
  },
]

const INCOME = ['단골팅 설치 수익', '단골팅 월 구독 수익', '당근마케팅 수익', 'AEO 미니홈피 수익']

export default function CommissionGuide() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#222222]">
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-[14px] font-bold text-[#019c87]">영업자용</p>
        <h1 className="mt-3 text-[32px] font-extrabold leading-snug tracking-tight sm:text-[40px]">영업자 수수료 안내</h1>

        <section className="pt-12">
          <h2 className="text-[26px] font-extrabold tracking-tight">기본 수수료</h2>
          <div className="mt-6 grid gap-3">
            {BASIC.map((item) => (
              <article key={item.name} className="bg-white p-5" style={{ borderRadius: 16 }}>
                <h3 className="text-[18px] font-extrabold leading-snug">{item.name}</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-[#222222]/45">고객 판매가</p>
                    <p className="mt-1 text-[20px] font-extrabold">{item.price}</p>
                    <p className="text-[13px] font-semibold text-[#222222]/55">{item.priceNote}</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#019c87]">영업자 수수료</p>
                    <p className="mt-1 text-[20px] font-extrabold text-[#019c87]">{item.fee}</p>
                    <p className="text-[13px] font-semibold text-[#222222]/55">{item.feeNote}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-[15px] font-semibold leading-relaxed text-[#222222]/70">
            AEO 미니홈피는 현재 구독료 면제 혜택이 적용됩니다.
          </p>
        </section>

        <section className="pt-14">
          <h2 className="text-[26px] font-extrabold tracking-tight">단골팅 월 구독 수수료</h2>
          <p className="mt-3 text-[16px] font-semibold text-[#222222]/65">월 구독료 49,000원(VAT 포함) 기준</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <article className="bg-white p-5" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-bold text-[#222222]/50">공급가액</p>
              <p className="mt-2 text-[28px] font-extrabold">44,545원</p>
            </article>
            <article className="bg-[#E3FBF6] p-5" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-bold text-[#019c87]">영업자 수수료</p>
              <p className="mt-2 text-[28px] font-extrabold">약 22,273원</p>
              <p className="mt-1 text-[14px] font-semibold">월</p>
            </article>
          </div>
          <p className="mt-4 text-[16px] font-semibold leading-relaxed">영업자 수수료 = 부가세 제외 공급가액의 50%</p>
          <p className="mt-2 text-[16px] leading-relaxed text-[#222222]/75">
            매장이 구독을 유지하고 실제 결제가 이루어지는 동안 월 수수료가 발생합니다.
          </p>
        </section>

        <section className="pt-14">
          <h2 className="text-[26px] font-extrabold tracking-tight">당근마켓 소식 발행·최적화</h2>
          <div className="mt-5 bg-white p-6" style={{ borderRadius: 16 }}>
            <p className="text-[15px] font-bold text-[#222222]/50">판매가 330,000원 · VAT 포함</p>
            <p className="mt-3 text-[32px] font-extrabold text-[#019c87]">90,000원</p>
            <p className="text-[15px] font-bold">건당</p>
          </div>
          <p className="mt-4 text-[16px] leading-relaxed text-[#222222]/75">
            추가 구매 또는 연장 계약이 발생하는 경우에도 같은 기준을 적용합니다.
          </p>
        </section>

        <section className="pt-14">
          <h2 className="text-[26px] font-extrabold tracking-tight">AEO 미니홈피</h2>
          <p className="mt-3 text-[16px] font-semibold text-[#222222]/65">세팅비 290,000원(VAT 포함) 기준</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <article className="bg-white p-5" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-bold text-[#222222]/50">공급가액</p>
              <p className="mt-2 text-[28px] font-extrabold">약 263,636원</p>
            </article>
            <article className="bg-[#E3FBF6] p-5" style={{ borderRadius: 16 }}>
              <p className="text-[14px] font-bold text-[#019c87]">영업자 수수료</p>
              <p className="mt-2 text-[28px] font-extrabold">약 131,818원</p>
              <p className="mt-1 text-[14px] font-semibold">건당</p>
            </article>
          </div>
          <p className="mt-4 text-[16px] font-semibold leading-relaxed">영업자 수수료 = 부가세 제외 공급가액의 50%</p>
          <p className="mt-2 text-[16px] leading-relaxed text-[#222222]/75">현재 구독료 면제 혜택이 적용됩니다.</p>
        </section>

        <section className="pt-14">
          <h2 className="text-[26px] font-extrabold tracking-tight">수수료 지급</h2>
          <ul className="mt-5 grid gap-3">
            <li className="bg-white px-5 py-4 text-[17px] font-semibold" style={{ borderRadius: 14 }}>
              전월에 발생한 수수료를 기준으로 정산합니다.
            </li>
            <li className="bg-[#00C7A7] px-5 py-4 text-[17px] font-extrabold" style={{ borderRadius: 14 }}>
              익월 20일 지급
            </li>
            <li className="bg-white px-5 py-4 text-[17px] font-semibold leading-relaxed" style={{ borderRadius: 14 }}>
              환불, 취소, 미입금처럼 실제 매출이 발생하지 않은 금액은 수수료 산정에서 빠질 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="pt-14">
          <h2 className="text-[26px] font-extrabold tracking-tight">수수료 변경</h2>
          <div className="mt-5 grid gap-3 text-[16px] font-semibold leading-relaxed">
            <p className="bg-white p-5" style={{ borderRadius: 16 }}>
              월 구독료와 미니홈피 수수료는 회사 사정에 따라 변경될 수 있습니다.
            </p>
            <p className="bg-[#FFF3DE] p-5" style={{ borderRadius: 16 }}>
              수수료가 바뀌기 전에 이미 적용되던 기존 계약의 수수료율은 그대로 지급됩니다.
            </p>
          </div>
        </section>

        <section className="pt-14">
          <h2 className="text-[26px] font-extrabold tracking-tight">영업자 수익 구조</h2>
          <ol className="mt-5 grid gap-2">
            {INCOME.map((item, i) => (
              <li key={item} className="flex items-center gap-3 bg-white px-5 py-4" style={{ borderRadius: 14 }}>
                <span className="w-4 text-[18px] font-extrabold text-[#00C7A7]">{i === 0 ? '' : '+'}</span>
                <span className="text-[18px] font-extrabold">{item}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-[17px] font-semibold leading-relaxed">
            매장을 확보하면 설치 수익이 발생하고, 매장이 계속 이용하면 월 구독 수익이 계속 발생합니다.
          </p>
        </section>
      </main>
    </div>
  )
}
