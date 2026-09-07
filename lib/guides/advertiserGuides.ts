/**
 * 광고주 전용 가이드(/guides/advertiser) 문서 목록.
 * 아직 CMS가 없어서, 새 문서를 추가할 때마다 이 배열에 항목을 추가하고
 * app/guides/advertiser/{slug}/page.tsx 파일을 새로 만드는 방식으로 운영한다.
 * category는 하드코딩된 고정 목록이 아니라 문서마다 붙이는 가벼운 태그다 —
 * 새 카테고리가 필요하면 이 타입에 값만 추가하면 된다.
 */

export type AdvertiserGuideCategory = '시작하기' | '마케팅 활용' | '고급 기능'

export interface AdvertiserGuideMeta {
  slug: string
  title: string
  summary: string
  category: AdvertiserGuideCategory
  publishedAt: string
}

export const ADVERTISER_GUIDES: AdvertiserGuideMeta[] = [
  {
    slug: 'prize-probability',
    title: '경품 확률, 이렇게 정해져요',
    summary: '경품마다 당첨 확률이 어떻게 계산되고, 매일 밤 자동으로 어떻게 다시 맞춰지는지 쉽게 설명해드려요.',
    category: '고급 기능',
    publishedAt: '2026-09-07',
  },
]

export function getAdvertiserGuideBySlug(slug: string): AdvertiserGuideMeta | undefined {
  return ADVERTISER_GUIDES.find((g) => g.slug === slug)
}
