import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 정식 도메인은 www.dgting.co.kr 하나뿐이다. Vercel 기본 도메인(roulette-marketing.vercel.app)으로
  // 들어오는 요청은 전부 정식 도메인으로 영구 리다이렉트해서, 어떤 화면(카카오 로그인 리다이렉트,
  // NFC 체크인 URL 복사 등 window.location.origin/요청 origin을 그대로 쓰는 곳 포함)에서도
  // Vercel 주소가 노출되지 않게 한다.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'roulette-marketing.vercel.app' }],
        destination: 'https://www.dgting.co.kr/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
