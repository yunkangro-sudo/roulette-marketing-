import type { Metadata } from 'next'
import GuidePageShell from '@/components/guides/GuidePageShell'

export const metadata: Metadata = {
  title: '경품 확률, 이렇게 정해져요 · 단골팅 광고주 가이드',
  robots: { index: false, follow: false },
}

const FAQ = [
  {
    q: '손님이 갑자기 확 몰리면 경품이 다 떨어지지 않나요?',
    a: '그럴 가능성을 줄이려고 매일 자동으로 확률을 다시 맞춰드려요. 그래도 혹시 다 나가면, 그 경품은 잠깐 "꽝" 처리되고 손님한테 손해가 가는 일은 없어요.',
  },
  {
    q: '예상 손님 수를 대충 입력해도 되나요?',
    a: '네, 대략적으로만 입력하셔도 돼요. 며칠 지나면 시스템이 실제 방문 데이터를 보고 스스로 더 정확하게 맞춰가요.',
  },
  {
    q: '확률이 바뀌면 저한테 알려주나요?',
    a: '매일 자동으로 조용히 조정되기 때문에 알림은 따로 안 가요. 궁금하시면 이벤트 관리 화면에서 현재 확률을 언제든 확인하실 수 있어요.',
  },
  {
    q: '저는 그냥 예전처럼 고정된 확률로 하고 싶어요.',
    a: '지금은 모든 이벤트에 자동 조정이 기본 적용돼요. 대신 사장님이 언제든 이벤트 화면에서 경품 개수나 기간을 직접 수정해서 저장하시면, 그 순간 원하시는 값으로 바로 반영돼요.',
  },
]

export default function PrizeProbabilityGuidePage() {
  return (
    <GuidePageShell
      eyebrow="광고주 가이드 · 고급 기능"
      title="경품, 어떻게 나눠드리고 있을까요?"
      description="숫자나 계산 몰라도 괜찮아요. 딱 3분이면 이해되는 쉬운 설명이에요."
      backHref="/guides/advertiser"
      backLabel="← 광고주 가이드"
    >
      <div className="space-y-14">
        {/* 하나 */}
        <section>
          <span
            className="inline-block bg-dg-green-tint px-3 py-1 text-[12.5px] font-bold text-dg-green-deep"
            style={{ borderRadius: 999 }}
          >
            하나
          </span>
          <h2 className="mt-3 text-[20px] font-extrabold leading-snug text-dg-ink">
            왜 경품마다 당첨 확률이 다를까요?
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-dg-ink-soft">
            경품을 "몇 개 준비했는지"와 "손님이 몇 명이나 올지"를 같이 보고, 시스템이 알아서 확률을 계산해요.
          </p>
          <div className="mt-4 rounded-2xl bg-dg-green-tint p-5 text-[14.5px] leading-[1.75] text-dg-ink">
            🍕 <b className="text-dg-green-deep">피자 한 판을 나눠 먹는다고 생각해보세요.</b>
            <br />
            손님이 <b>적게</b> 오면 한 사람이 먹는 조각이 <b>커지고</b>,
            <br />
            손님이 <b>많이</b> 오면 한 사람이 먹는 조각은 <b>작아지죠.</b>
            <br />
            <br />
            경품 확률도 똑같아요. 경품 개수는 "피자 조각 수", 예상 손님 수는 "먹을 사람 수"예요.
          </div>
          <p className="mt-4 text-[14.5px] leading-relaxed text-dg-ink-soft">
            그래서 처음 이벤트 만드실 때 "하루에 손님이 몇 명쯤 올까요?"를 여쭤보는 거예요. 이 숫자로
            조각(확률)을 미리 나눠두는 거죠.
          </p>
        </section>

        {/* 둘 */}
        <section className="border-t border-dg-line pt-12">
          <span
            className="inline-block bg-dg-green-tint px-3 py-1 text-[12.5px] font-bold text-dg-green-deep"
            style={{ borderRadius: 999 }}
          >
            둘
          </span>
          <h2 className="mt-3 text-[20px] font-extrabold leading-snug text-dg-ink">
            근데 처음 예상이 틀리면 어떡하죠?
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-dg-ink-soft">
            걱정 마세요. <b className="text-dg-ink">사장님이 아무것도 안 하셔도, 매일 밤 자동으로 다시 맞춰드려요.</b>
          </p>
          <div className="mt-4 text-center text-[32px]">🚗</div>
          <div className="mt-2 rounded-2xl bg-dg-green-tint p-5 text-[14.5px] leading-[1.75] text-dg-ink">
            <b className="text-dg-green-deep">내비게이션이랑 똑같아요.</b>
            <br />
            길이 막히면 내비게이션이 알아서 새 길을 찾아주죠?
            <br />
            <br />
            단골팅도 매일 밤, "오늘 실제로 손님이 얼마나 왔는지" 보고 다음 날 확률을 자동으로 조금씩 다시
            맞춰요. 예상보다 손님이 많이 오면 경품이 너무 빨리 없어지지 않게 살짝 낮추고, 적게 오면 잘
            나가도록 살짝 올려드려요.
          </div>
          <div className="mt-4 rounded-2xl border-2 border-dg-green bg-white p-5">
            <p className="text-[12px] font-bold text-dg-green-deep">사장님이 하실 일</p>
            <p className="mt-1 text-[16px] font-extrabold leading-relaxed text-dg-ink">
              없어요. 그냥 두시면 매일 알아서 조정돼요.
            </p>
          </div>
        </section>

        {/* 셋 */}
        <section className="border-t border-dg-line pt-12">
          <span
            className="inline-block bg-dg-green-tint px-3 py-1 text-[12.5px] font-bold text-dg-green-deep"
            style={{ borderRadius: 999 }}
          >
            셋
          </span>
          <h2 className="mt-3 text-[20px] font-extrabold leading-snug text-dg-ink">
            &quot;장기 운영&quot;은 언제 쓰는 건가요?
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-dg-ink-soft">
            보통은 이벤트 기간이 정해져 있죠 (예: 8월 한 달). 근데{' '}
            <b className="text-dg-ink">&quot;1년 내내 계속하고 싶은데, 경품 예산은 매달 새로 채워주고 싶다&quot;</b>는
            사장님을 위한 기능이에요.
          </p>
          <div className="mt-4 text-center text-[32px]">💧</div>
          <div className="mt-2 rounded-2xl bg-dg-green-tint p-5 text-[14.5px] leading-[1.75] text-dg-ink">
            <b className="text-dg-green-deep">정수기 물통이랑 같아요.</b>
            <br />
            물통이 비면 새 물통으로 갈아 끼우죠?
            <br />
            <br />
            &quot;장기 운영&quot;을 켜두시면, 정해두신 경품 개수가{' '}
            <b>매주 또는 매달마다 자동으로 다시 채워져요.</b> 이번 달에 다 나갔어도, 다음 달엔 또 처음 그
            개수만큼 새로 시작해요.
          </div>
          <p className="mt-4 text-[14.5px] leading-relaxed text-dg-ink-soft">
            이 기능이 필요 없으시면 그냥 안 켜셔도 돼요. 지금처럼 &quot;정해진 기간 동안 딱 정해진
            개수&quot;로 하고 싶으시면 손 안 대셔도 아무 문제없어요.
          </p>
        </section>

        {/* 한 줄 요약 */}
        <div className="rounded-[20px] bg-dg-ink px-6 py-7 text-center text-white">
          <p className="text-[12px] font-bold text-white/60">한 줄 요약</p>
          <h3 className="mt-2 text-[19px] font-bold leading-relaxed">
            처음에 대략적인 숫자만 입력해두시면,
            <br />그 다음부터는 저희가 알아서 챙겨드려요.
          </h3>
          <p className="mt-2.5 text-[13px] leading-relaxed text-white/70">
            매일 자동으로 다시 맞춰드리니까, 확률 걱정은 내려놓으셔도 돼요.
          </p>
        </div>

        {/* FAQ */}
        <section className="border-t border-dg-line pt-12">
          <h2 className="text-[20px] font-extrabold text-dg-ink">자주 묻는 질문</h2>
          <div className="mt-4 divide-y divide-dg-line">
            {FAQ.map((item) => (
              <div key={item.q} className="py-4">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-[14.5px] font-bold text-dg-green-deep">Q.</span>
                  <p className="text-[14.5px] font-bold leading-snug text-dg-ink">{item.q}</p>
                </div>
                <p className="mt-1.5 pl-[22px] text-[13.5px] leading-relaxed text-dg-ink-soft">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </GuidePageShell>
  )
}
