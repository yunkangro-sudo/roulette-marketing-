import type { Metadata } from 'next'
import Manual01 from '@/components/sales-manual/Manual01'

export const metadata: Metadata = {
  title: '단골팅 영업 메뉴얼 1편 · 단골마케팅',
  description: '대리점과 프리랜서 영업자를 위한 단골마케팅 기능·시스템·가격 안내.',
  robots: { index: false, follow: false },
}

export default function SalesManualPage() {
  return <Manual01 />
}
