/**
 * 랜딩(`/`) 전용 구조화 데이터(JSON-LD) 빌더.
 * 회사 정보는 `components/landing-v5/Sections.tsx` 푸터에 실제로 노출되는 값과 동일하게 맞춘다
 * (Organization 구조화 데이터가 화면 표시 정보와 어긋나면 안 됨).
 */

const SITE_URL = 'https://www.dgting.co.kr'

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '단골팅',
    alternateName: '아크웍스(ARK WORKS)',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      '소상공인을 위한 재방문 전환 마케팅 SaaS. QR 게임 이벤트로 카카오 채널 친구추가와 당근마켓 단골추가를 동시에 만든다.',
    email: 'yangpro03@gmail.com',
    telephone: '+82-1688-3893',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '2공단5로 52, 룩소르비즈타워 863호',
      addressLocality: '천안시 서북구',
      addressRegion: '충청남도',
      addressCountry: 'KR',
    },
  }
}

export function buildSoftwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '단골팅',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description:
      'QR 하나로 시작하는 게임형 재방문 마케팅 서비스. 손님이 QR을 찍고 게임에 참여하면 카카오 채널 친구추가·당근마켓 단골추가로 이어지고, 발급된 쿠폰으로 재방문을 유도한다.',
    provider: {
      '@type': 'Organization',
      name: '단골팅',
    },
    // 가격은 프로모션 등으로 자주 바뀌어 구조화 데이터에 고정 offers를 넣지 않는다
    // (실제 요금은 랜딩 요금제 섹션 참고 — 구조화 데이터와 화면 표시가 어긋나는 것을 방지).
  }
}

export function buildFaqPageJsonLd(items: readonly { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}
