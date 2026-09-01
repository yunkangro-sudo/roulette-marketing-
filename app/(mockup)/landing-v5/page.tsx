import { redirect } from 'next/navigation'

/** 구 랜딩(v5) 경로 — 이제 루트(`/`)가 이 콘텐츠를 직접 서빙하므로, 기존 링크/북마크 호환을 위해 리다이렉트만 유지 */
export default function LandingV5RedirectPage() {
  redirect('/')
}
