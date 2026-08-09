import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '단골마케팅 — 게임 한 번으로 카카오 × 당근 단골 만들기',
  description: '소상공인을 위한 재방문 전환 마케팅 SaaS. QR 게임 이벤트로 카카오 채널 친구추가와 당근 단골추가를 동시에.',
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
