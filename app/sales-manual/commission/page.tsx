import type { Metadata } from 'next'
import CommissionGuide from '@/components/sales-manual/CommissionGuide'

export const metadata: Metadata = {
  title: '단골팅 영업자 수수료 안내',
  description: '단골팅, 당근마케팅, AEO 미니홈피의 영업자 수수료와 지급일.',
  robots: { index: false, follow: false },
}

export default function CommissionPage() {
  return <CommissionGuide />
}
