import type { Metadata } from 'next'
import GuidePageShell from '@/components/guides/GuidePageShell'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ADVERTISER_GUIDES, type AdvertiserGuideCategory } from '@/lib/guides/advertiserGuides'

export const metadata: Metadata = {
  title: '광고주 가이드 · 단골팅',
  robots: { index: false, follow: false },
}

export default function AdvertiserGuideListPage() {
  const categories = Array.from(new Set(ADVERTISER_GUIDES.map((g) => g.category))) as AdvertiserGuideCategory[]

  return (
    <GuidePageShell
      eyebrow="광고주 가이드"
      title="사장님을 위한 운영 노하우"
      description="세팅법, 마케팅 활용법 등 매장을 운영하시면서 궁금하실 만한 내용을 계속 채워드릴게요."
      backHref="/guides"
      backLabel="← 가이드 목록"
    >
      {categories.map((category) => (
        <div key={category} className="mb-10">
          <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">{category}</p>
          <div className="mt-4 grid gap-3">
            {ADVERTISER_GUIDES.filter((g) => g.category === category).map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/advertiser/${guide.slug}`}
                className="group flex items-center justify-between gap-4 border border-dg-line bg-white p-5 transition-colors hover:border-dg-green"
                style={{ borderRadius: 10 }}
              >
                <div>
                  <h3 className="text-[16px] font-semibold text-dg-ink">{guide.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-dg-ink-soft">{guide.summary}</p>
                </div>
                <ArrowRight
                  size={18}
                  className="shrink-0 text-dg-ink-soft transition-colors group-hover:text-dg-green-deep"
                />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </GuidePageShell>
  )
}
