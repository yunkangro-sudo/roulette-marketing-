import type { Metadata } from 'next'
import GuidePageShell from '@/components/guides/GuidePageShell'

export const metadata: Metadata = {
  title: '이렇게 운영돼요 · 단골팅 가이드',
  description: '손님의 게임 참여부터 재방문까지, 단골팅이 실제로 어떻게 돌아가는지 단계별로 보여드려요.',
  openGraph: {
    title: '이렇게 운영돼요 · 단골팅 가이드',
    description: '손님의 게임 참여부터 재방문까지, 단골팅이 실제로 돌아가는 방식을 설명하는 공개 가이드',
  },
}

const STEPS = [
  {
    n: '01',
    title: '게임에 참여합니다',
    body: 'QR 하나면 충분합니다. 로그인 없이, 부담 없이 바로 게임이 시작됩니다.',
  },
  {
    n: '02',
    title: '선물을 확인합니다',
    body: '게임이 끝나면 카카오 로그인 한 번으로 결과를 확인합니다.',
  },
  {
    n: '03',
    title: '단골이 됩니다',
    body: '선물을 받으려면 당근마켓 매장 페이지에서 단골 맺기를 추가해야 합니다.',
  },
]

const ROLES = [
  { name: '당근', role: '지역 고객 유입' },
  { name: '카카오', role: '고객 참여 및 로그인' },
  { name: '게임', role: '참여를 만드는 장치' },
  { name: '쿠폰', role: '방문을 만드는 혜택' },
  { name: '데이터', role: '재방문 성과 측정' },
]

const FLOW = [
  { n: '1', title: '고객이 게임합니다', body: 'QR을 찍고 게임 참여' },
  { n: '2', title: '고객이 단골이 됩니다', body: '당근마켓 단골 추가' },
  { n: '3', title: '고객이 다시 방문합니다', body: '계산대 QR로 쿠폰 사용' },
]

export default function HowItWorksGuidePage() {
  return (
    <GuidePageShell
      eyebrow="이렇게 운영돼요"
      title="복잡한 세팅 없이, 이 세 걸음이면 끝나요"
      description="복잡한 앱 설치도, 어려운 세팅도 없습니다. QR 하나로 시작하는 가장 쉬운 재방문 설계입니다."
      backHref="/guides"
      backLabel="← 가이드 목록"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <article key={step.n} className="border border-dg-line bg-white p-6" style={{ borderRadius: 6 }}>
            <p className="font-num text-[12px] tracking-widest text-dg-green-deep">{step.n}</p>
            <h3 className="mt-2 text-[19px] text-dg-ink">{step.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-dg-ink-soft">{step.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-14">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">단골팅 시스템 소개</p>
        <h2 className="mt-2 text-[22px] leading-snug text-dg-ink">
          당근, 카카오, 게임, 쿠폰, 데이터 — 이렇게 하나로 연결됩니다
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ROLES.map((row) => (
            <div
              key={row.name}
              className="flex min-h-[96px] flex-col justify-center border border-dg-line bg-white px-4 py-4"
              style={{ borderRadius: 6 }}
            >
              <p className="text-[15px] font-semibold text-dg-ink">{row.name}</p>
              <p className="mt-1.5 text-[13px] leading-snug text-dg-ink-soft">{row.role}</p>
            </div>
          ))}
          <div
            className="flex min-h-[96px] flex-col items-start justify-center bg-dg-green px-4 py-4"
            style={{ borderRadius: 6 }}
          >
            <p className="text-[17px] font-extrabold leading-snug tracking-tight text-dg-ink">연동됩니다</p>
            <p className="mt-1.5 text-[13px] leading-snug text-dg-ink/70">따로 관리할 필요 없이</p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">전체 흐름 요약</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {FLOW.map((item) => (
            <article key={item.n} className="border border-dg-line bg-dg-bg p-6" style={{ borderRadius: 6 }}>
              <p className="font-num text-[12px] text-dg-green-deep">{item.n}</p>
              <h3 className="mt-2 text-[20px] text-dg-ink">{item.title}</h3>
              <p className="mt-2 text-[14px] text-dg-ink-soft">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </GuidePageShell>
  )
}
