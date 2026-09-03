import { requireAdminAuth } from '@/lib/admin/session'
import { canAccessHomepageFeature } from '@/lib/admin/storeAddons'
import BusinessPageClient from './BusinessPageClient'

/**
 * "매장 홈페이지" 기능은 유료 애드온 — 광고주(대리접속 포함)는 슈퍼관리자가
 * store_addons.homepage_feature_enabled를 켜주기 전까지 이 화면 자체를 못 쓴다.
 * 메뉴에서 숨기는 것만으론 URL 직접 접근을 막지 못하므로, 여기서도 다시 체크한다.
 */
export default async function BusinessPageAdminPage() {
  const account = await requireAdminAuth()

  const allowed = await canAccessHomepageFeature(account, account.storeId)
  if (!allowed) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-5">🔒</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">아직 활성화되지 않은 기능이에요</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          매장 홈페이지는 유료 부가기능입니다.
          <br />
          이용을 원하시면 담당자에게 문의해주세요.
        </p>
      </div>
    )
  }

  return <BusinessPageClient role={account.role} storeId={account.storeId} />
}
