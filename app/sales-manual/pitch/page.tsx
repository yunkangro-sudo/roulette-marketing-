import type { Metadata } from 'next'
import PitchGuide from '@/components/sales-manual/PitchGuide'

export const metadata: Metadata = {
  title: '단골팅 현장 화법',
  description: '영업자가 사장님 앞에서 그대로 말하는 3분 순서, 업종별 한 줄, 반론 대응.',
  robots: { index: false, follow: false },
}

export default function PitchPage() {
  return <PitchGuide />
}
