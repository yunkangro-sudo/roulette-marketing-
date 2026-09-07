import type { Metadata } from 'next'
import GuidePageShell from '@/components/guides/GuidePageShell'
import { FAQ_ITEMS } from '@/lib/landing-v5/config'

export const metadata: Metadata = {
  title: '처음이신가요? · 단골팅 가이드',
  description: '단골팅이 뭔지, 왜 필요한지부터 사장님들이 가장 많이 물어보시는 질문까지 한 번에 정리했어요.',
  openGraph: {
    title: '처음이신가요? · 단골팅 가이드',
    description: '단골팅이 뭔지, 왜 필요한지부터 자주 묻는 질문까지 한 번에 정리한 공개 가이드',
  },
}

export default function GettingStartedGuidePage() {
  return (
    <GuidePageShell
      eyebrow="처음이신가요?"
      title="단골팅이 뭔지, 3분이면 이해돼요"
      description="손님을 데려오는 광고와 다르게, 단골팅은 한 번 온 손님을 다시 오게 만드는 재방문 시스템입니다. 사장님들이 가장 많이 물어보시는 질문으로 빠르게 감을 잡아보세요."
      backHref="/guides"
      backLabel="← 가이드 목록"
    >
      <div className="rounded-[10px] border border-dg-line bg-white p-6 md:p-8">
        <div className="space-y-1">
          <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">한 줄 요약</p>
          <p className="text-[16px] font-bold leading-relaxed text-dg-ink">
            게임 한 판 → 카카오 로그인 → 당근 단골 추가. 이 세 걸음이면 단골이 만들어집니다.
          </p>
        </div>
      </div>

      <div className="mt-10 divide-y divide-dg-line border-y border-dg-line">
        {FAQ_ITEMS.map((item) => (
          <div key={item.q} className="py-5">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-[14px] font-bold text-dg-green-deep">Q.</span>
              <p className="text-[16px] font-semibold leading-snug text-dg-ink">{item.q}</p>
            </div>
            <p className="mt-2 pl-[22px] text-[14px] leading-relaxed text-dg-ink-soft">{item.a}</p>
          </div>
        ))}
      </div>
    </GuidePageShell>
  )
}
