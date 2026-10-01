import type { Metadata } from 'next'
import AeoPageClient from './AeoPageClient'
import { AEO_FAQ } from './faq'

export const metadata: Metadata = {
  title: 'AEO 미니홈피 · 단골팅 — 손님이 AI에게 묻는 시대, 우리 가게 공식 홈페이지',
  description:
    '챗GPT·구글·네이버 AI 검색이 읽을 수 있는 우리 가게 전용 홈페이지. 독립 도메인 발급과 구글·네이버 등록까지 포함. 세팅비 270,000원, 첫 6개월 구독료 무료.',
  alternates: { canonical: '/aeo' },
  openGraph: {
    title: 'AEO 미니홈피 · 단골팅',
    description: '손님이 AI에게 묻는 시대, 우리 가게의 공식 자료를 만들어 드립니다.',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: AEO_FAQ.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

export default function AeoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <AeoPageClient />
    </>
  )
}
