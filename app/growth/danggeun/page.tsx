import type { Metadata } from 'next'
import GrowthDanggeunClient from './GrowthDanggeunClient'

export const metadata: Metadata = {
  title: '당근마켓으로 우리가게 성장시키기 | 단골팅',
  description:
    '당근마켓 안에서 우리 매장을 알리고, 방문한 손님을 게임으로 다시 연결하는 방법. 비즈프로필 최적화부터 바이럴 콘텐츠, 쇼츠, 타깃 광고까지.',
  openGraph: {
    title: '당근마켓으로 우리가게 성장시키기 | 단골팅',
    description: '당근마켓 안에서 우리 매장을 알리고, 방문한 손님을 게임으로 다시 연결하는 방법',
  },
}

export default function GrowthDanggeunPage() {
  return <GrowthDanggeunClient />
}
