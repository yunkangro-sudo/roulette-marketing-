import { redirect } from 'next/navigation'

/** /admin/coupons/issue → /admin/coupons(발급하기 탭)로 통합됨. 기존 링크/북마크 호환용 리다이렉트. */
export default function CouponIssuePage() {
  redirect('/admin/coupons?tab=issue')
}
