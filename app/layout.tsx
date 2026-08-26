import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://dgting.co.kr'),
  title: '단골팅 — 게임 한 번으로 카카오 × 당근 단골 만들기',
  description: '소상공인을 위한 재방문 전환 마케팅 SaaS. QR 게임 이벤트로 카카오 채널 친구추가와 당근 단골추가를 동시에.',
  openGraph: {
    title: '단골팅 — 게임 한 번으로 카카오 × 당근 단골 만들기',
    description: '소상공인을 위한 재방문 전환 마케팅 SaaS. QR 게임 이벤트로 카카오 채널 친구추가와 당근 단골추가를 동시에.',
    url: 'https://dgting.co.kr',
    siteName: '단골팅',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '단골팅 — 게임 한 번으로 카카오 × 당근 단골 만들기',
    description: '소상공인을 위한 재방문 전환 마케팅 SaaS. QR 게임 이벤트로 카카오 채널 친구추가와 당근 단골추가를 동시에.',
  },
}

// viewportFit: 'cover' — 노치/다이나믹 아일랜드/제스처 바 기기에서
// env(safe-area-inset-*) 값이 실제로 채워지도록 하기 위해 필수.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
