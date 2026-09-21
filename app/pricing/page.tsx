import type { Metadata } from 'next'
import PricingPageClient from './PricingPageClient'

export const metadata: Metadata = {
  title: '요금제 계산 · 단골팅',
  description:
    '단골마케팅 월 19,000원부터. 당근마케팅·홈피마케팅은 필요할 때 추가하세요. 요금제를 계산하고 바로 가입을 신청할 수 있습니다.',
  openGraph: {
    title: '요금제 계산 · 단골팅',
    description: '단골마케팅 월 19,000원부터. 필요한 만큼만, 지금 필요한 것부터 시작하세요.',
  },
}

export default function PricingPage() {
  return <PricingPageClient />
}
