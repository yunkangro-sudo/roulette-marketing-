import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.dgting.co.kr'

/**
 * /b/*(매장 공개 홈페이지)만 검색엔진에 노출한다. 그 외 개인화·인증이 필요한
 * 영역(관리자, 계산대, 손님 개인 화면, API)은 차단한다.
 *
 * 광고 문구/안내 어디에도 "AI 노출 보장", "검색 상위노출 보장" 같은 결과 보장성
 * 표현을 쓰지 않는다 — 이 파일은 검색엔진이 이해하기 쉬운 기반을 만드는 것일 뿐,
 * 노출 결과를 보장하지 않는다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/b/', '/guides', '/guides/getting-started', '/guides/how-it-works'],
      // /guides/advertiser는 광고주 로그인 세션이 없으면 페이지 자체가 접근 차단되는
      // 비공개 콘텐츠라 검색엔진 크롤링도 명시적으로 막는다
      disallow: [
        '/admin',
        '/staff',
        '/me',
        '/api',
        '/checkin',
        '/play',
        '/checkout',
        '/signup',
        '/guides/advertiser',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
