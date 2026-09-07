import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'
import '@/components/landing-v5/landing-v5.css'

/**
 * 가이드 콘텐츠 페이지 공통 뼈대 — 헤더(로고 + 뒤로가기) / 제목 블록 / 본문 / 카카오 상담 안내 푸터.
 * /guides 아래 모든 문서 페이지(공개·광고주 전용)가 이 톤앤매너를 공유한다.
 */
export default function GuidePageShell({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  backHref: string
  backLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="landing-v5 min-h-screen bg-dg-bg">
      <header className="border-b border-dg-line bg-white px-5 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="단골팅 홈">
            <BrandLogo size="md" />
          </Link>
          <Link
            href={backHref}
            className="text-[13px] font-semibold text-dg-ink-soft transition-colors hover:text-dg-ink"
          >
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-14 md:py-20">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">{eyebrow}</p>
        <h1 className="mt-3 text-[28px] leading-snug text-dg-ink md:text-[36px]">{title}</h1>
        {description && (
          <p className="mt-4 text-[15px] leading-relaxed text-dg-ink-soft">{description}</p>
        )}

        <div className="mt-10">{children}</div>
      </main>

      <footer className="border-t border-dg-line bg-white px-5 py-10 text-center text-[12px] leading-relaxed text-dg-ink-soft">
        더 궁금하신 점은 카카오톡 상담으로 편하게 물어봐주세요.
        <br />
        단골팅 드림 🎁
      </footer>
    </div>
  )
}
