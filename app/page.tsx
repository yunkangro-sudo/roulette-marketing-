import LandingV5 from '@/components/landing-v5/LandingV5'
import { FAQ_ITEMS } from '@/lib/landing-v5/config'
import { buildFaqPageJsonLd, buildOrganizationJsonLd, buildSoftwareApplicationJsonLd } from '@/lib/seo/jsonld'

export const metadata = {
  title: '단골팅 — 손님을 모으는 게 아니라, 다시 오게 만듭니다',
  description:
    '소상공인을 위한 게임형 재방문 마케팅. 이미 온 손님을 단골로 만드는 완성된 프로세스.',
}

export default function HomePage() {
  const jsonLdBlocks = [
    buildOrganizationJsonLd(),
    buildSoftwareApplicationJsonLd(),
    buildFaqPageJsonLd(FAQ_ITEMS),
  ]

  return (
    <>
      {jsonLdBlocks.map((jsonLd, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}
      <LandingV5 />
    </>
  )
}
