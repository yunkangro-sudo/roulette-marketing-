import type { Metadata } from 'next'
import AeoPageClient from './AeoPageClient'

export const metadata: Metadata = {
  title: 'AEO마케팅 · 단골팅 — AI 검색에도 뜨는 우리 매장 홈페이지',
  description:
    '챗GPT, 퍼플렉시티 같은 AI 검색이 "우리 동네 맛집"을 물었을 때 매장이 답변에 등장하도록 만드는 홈페이지 제작 서비스. 출시 예정, 지금 알림 신청 가능.',
  openGraph: {
    title: 'AEO마케팅 · 단골팅',
    description: 'AI 검색에도 우리 매장이 뜨게 만드는 홈페이지 제작 서비스 — 출시 알림 신청',
  },
}

export default function AeoPage() {
  return <AeoPageClient />
}
