import type { Metadata } from 'next'
import Landing02 from '@/components/landing02/Landing02'

export const metadata: Metadata = {
  title: '단골팅 — 신규 손님을 부르고, 다시 오게 하고, 단골로 만드는 게임',
  description:
    '광고로 손님을 데려오는 데서 끝나지 않습니다. 게임 이벤트로 신규 고객을 만나고, 쿠폰으로 재방문을 만들고, 단골로 이어주는 게임 마케팅. 단골팅.',
  robots: { index: false, follow: false },
}

export default function Landing02Page() {
  return <Landing02 />
}
