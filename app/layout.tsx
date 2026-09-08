import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.dgting.co.kr'),
  title: '단골팅 — 게임 한 번으로 카카오 × 당근 단골 만들기',
  description: '소상공인을 위한 재방문 전환 마케팅 SaaS. QR 게임 이벤트로 카카오 채널 친구추가와 당근 단골추가를 동시에.',
  openGraph: {
    title: '신규 손님은 늘리고, 단골은 마구마구 늘립니다.',
    description: '당근에서 만나고, 게임 한 판으로 다시 옵니다. 소상공인을 위한 재방문 게임 마케팅, 단골팅.',
    url: 'https://www.dgting.co.kr',
    siteName: '단골팅',
    locale: 'ko_KR',
    type: 'website',
    // OG 대표 이미지는 별도 지정 안 함 — app/opengraph-image.png 파일 컨벤션이 이미 있어서
    // Next.js가 자동으로 og:image/twitter:image 태그를 생성한다 (여기서 images를 지정하면
    // 파일 컨벤션과 충돌 없이 오히려 무시되는 걸 빌드로 확인함 — 파일 컨벤션이 항상 우선).
  },
  twitter: {
    card: 'summary_large_image',
    title: '단골팅 — 게임 한 번으로 카카오 × 당근 단골 만들기',
    description: '소상공인을 위한 재방문 전환 마케팅 SaaS. QR 게임 이벤트로 카카오 채널 친구추가와 당근 단골추가를 동시에.',
  },
  // 등록 시 실제 인증 코드로 채울 자리 — 지금은 비워둔 상태(값을 넣기 전까지 meta 태그 자체가 출력되지 않음)
  verification: {
    // google: '여기에 구글 서치콘솔에서 받은 인증 코드를 붙여넣으세요',
    // other: { 'naver-site-verification': '여기에 네이버 서치어드바이저에서 받은 인증 코드를 붙여넣으세요' },
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
      <body>
        {/*
          CWV(Core Web Vitals) 개선: globals.css가 구글 폰트(JetBrains Mono, Black Han Sans)와
          jsdelivr CDN 폰트(Pretendard, SUIT)를 @import로 불러오는데, 이 요청들은 렌더링을 막는다.
          preconnect로 DNS·TLS 협상을 미리 끝내두면 첫 화면이 뜨는 시간이 줄어든다.
          (폰트 자체를 next/font로 완전히 self-host 전환하는 건 Black Han Sans처럼 한글 전용으로
          쓰는 폰트의 글리프 누락 위험이 있어 이번 라운드에서는 하지 않음)
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        {children}
      </body>
    </html>
  )
}
