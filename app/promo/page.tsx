import type { Metadata } from 'next'
import PromoDetailPage from '@/components/promo/PromoDetailPage'

export const metadata: Metadata = {
  title: '단골팅 상세 — 한 번 온 손님, 그냥 보내지 마세요',
  description:
    '인형뽑기 게임 한 판으로 쿠폰을 주고, 손님이 다시 오게 만드는 단골 마케팅. QR과 링크로 매장·온라인을 같이 잡습니다.',
  robots: { index: true, follow: true },
  openGraph: {
    title: '한 번 온 손님, 그냥 보내지 마세요.',
    description: '게임으로 만나고, 혜택으로 다시 부르고, 데이터로 단골을 만들어요. 단골팅.',
    url: 'https://www.dgting.co.kr/promo',
  },
}

export default function PromoPage() {
  return <PromoDetailPage />
}
