import type { Metadata } from 'next'
import PricingGuide from '@/components/sales-manual/PricingGuide'

export const metadata: Metadata = {
  title: '단골팅 영업 메뉴얼 · 요금제 안내',
  description: '단골마케팅 요금을 사장님 앞에서 바로 설명하는 영업자용 안내.',
  robots: { index: false, follow: false },
}

export default function SalesManualPricingPage() {
  return <PricingGuide />
}
