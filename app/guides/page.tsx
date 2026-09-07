import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import '@/components/landing-v5/landing-v5.css'

export const metadata: Metadata = {
  title: '가이드 · 단골팅',
  description:
    '단골팅이 처음이신 분을 위한 안내부터, 매장을 운영하시는 사장님을 위한 노하우까지 — 필요한 가이드를 한 곳에서 확인하세요.',
  openGraph: {
    title: '가이드 · 단골팅',
    description: '단골팅 서비스 이용을 위한 공개 가이드와 광고주 전용 운영 가이드 모음',
  },
}

const CATEGORIES = [
  {
    href: '/guides/getting-started',
    label: '처음이신가요?',
    desc: '단골팅이 뭔지, 왜 필요한지부터 자주 묻는 질문까지 한 번에 정리했어요.',
    badge: '공개',
    locked: false,
  },
  {
    href: '/guides/how-it-works',
    label: '이렇게 운영돼요',
    desc: '손님의 게임 참여부터 재방문까지, 단골팅이 실제로 돌아가는 방식을 보여드려요.',
    badge: '공개',
    locked: false,
  },
  {
    href: '/guides/advertiser',
    label: '광고주 가이드',
    desc: '세팅법, 마케팅 활용법 등 매장을 운영하시는 사장님을 위한 실전 노하우 모음이에요.',
    badge: '광고주 전용',
    locked: true,
  },
] as const

export default function GuidesHubPage() {
  return (
    <div className="landing-v5 min-h-screen bg-dg-bg">
      <header className="border-b border-dg-line bg-white px-5 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="단골팅 홈">
            <BrandLogo size="md" />
          </Link>
          <Link href="/" className="text-[13px] font-semibold text-dg-ink-soft transition-colors hover:text-dg-ink">
            ← 홈으로
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">가이드</p>
        <h1 className="mt-3 text-[30px] leading-snug text-dg-ink md:text-[40px]">단골팅을 더 잘 쓰는 법</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-dg-ink-soft">
          궁금한 내용에 맞는 카테고리를 선택해주세요.
        </p>

        <div className="mt-10 grid gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group flex items-center justify-between gap-4 border border-dg-line bg-white p-6 transition-colors hover:border-dg-green"
              style={{ borderRadius: 10 }}
            >
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold ${
                    c.locked ? 'bg-dg-cream text-dg-gold-deep' : 'bg-dg-green-tint text-dg-green-deep'
                  }`}
                  style={{ borderRadius: 999 }}
                >
                  {c.locked && <Lock size={10} />}
                  {c.badge}
                </span>
                <h2 className="mt-2.5 text-[19px] text-dg-ink">{c.label}</h2>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-dg-ink-soft">{c.desc}</p>
              </div>
              <ArrowRight
                size={20}
                className="shrink-0 text-dg-ink-soft transition-colors group-hover:text-dg-green-deep"
              />
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-dg-line bg-white px-5 py-10 text-center text-[12px] leading-relaxed text-dg-ink-soft">
        더 궁금하신 점은 카카오톡 상담으로 편하게 물어봐주세요.
        <br />
        단골팅 드림 🎁
      </footer>
    </div>
  )
}
