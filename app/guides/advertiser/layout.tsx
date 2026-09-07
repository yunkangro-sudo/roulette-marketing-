import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/session'

/**
 * 광고주 전용 가이드 — 목록 페이지와 그 아래 모든 개별 문서(app/guides/advertiser/[slug])에
 * 공통으로 적용되는 서버 사이드 게이트. 메뉴만 숨기는 방식이 아니라, 로그인 세션이 없으면
 * URL을 직접 입력해도 여기서 막혀 로그인 화면으로 리다이렉트된다.
 *
 * 특정 역할(advertiser)만이 아니라 admin 로그인 세션이 있으면 누구나(광고주/직원/에이전시/
 * 슈퍼관리자) 접근 가능 — 매장 직원도 운영 참고용으로 볼 수 있게 한다.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AdvertiserGuidesLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session.account) {
    redirect('/admin/login?redirect=/guides/advertiser')
  }

  return <>{children}</>
}
