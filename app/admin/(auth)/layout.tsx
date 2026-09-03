import { redirect } from 'next/navigation'
import { getAdminSession, getEffectiveAccount } from '@/lib/admin/session'
import { getSubscriptionStatus } from '@/lib/admin/subscription'
import { getStoreAddons } from '@/lib/admin/storeAddons'
import AdminNav from './AdminNav'
import ImpersonationBanner from '@/components/admin/ImpersonationBanner'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session.account) redirect('/admin/login')

  // staff 역할은 관리자 패널이 아니라 계산대(/staff)만 사용 (원본 계정 기준으로 판단)
  if (session.account.role === 'staff') redirect('/staff')

  // 대리접속 중이면 이 시점부터 advertiser처럼 취급 (원본 정보는 account.impersonation에 보존됨)
  const account = getEffectiveAccount(session.account)
  const impersonation = account.impersonation

  const [subscription, addons] = await Promise.all([
    account.role === 'advertiser' ? getSubscriptionStatus(account.storeId) : Promise.resolve(null),
    account.role === 'advertiser' ? getStoreAddons(account.storeId) : Promise.resolve(null),
  ])

  // 실제 광고주: grace/trial(승인대기)만 경고 배너 (expired는 middleware가 이미 차단).
  //   - trial(승인대기)은 /admin/events 등 게이트 걸린 경로는 middleware가 막지만,
  //     /admin/business-page·/admin/company처럼 게이트 밖 경로는 그대로 들어올 수 있어
  //     여기서도 본인 상태를 알 수 있게 배너를 띄운다.
  // 대리접속 중: 차단은 절대 없고, grace/expired/trial 전부 정보성 배너만 노출.
  const showGraceBanner = !impersonation && subscription?.status === 'grace'
  const showPendingBanner = !impersonation && subscription?.status === 'trial'
  const showImpersonatedSubscriptionWarning =
    !!impersonation &&
    (subscription?.status === 'grace' || subscription?.status === 'expired' || subscription?.status === 'trial')

  return (
    <div className="min-h-screen bg-gray-50">
      {impersonation && (
        <ImpersonationBanner storeName={impersonation.storeName} originalEmail={impersonation.originalEmail} />
      )}
      <AdminNav account={account} homepageFeatureEnabled={addons?.homepageFeatureEnabled} />
      {showGraceBanner && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-center text-sm font-semibold text-red-700">
          이용기간이 만료되었습니다. {subscription!.graceDaysLeft}일 이내 갱신해주세요.
        </div>
      )}
      {showPendingBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm font-semibold text-amber-700">
          가입 신청이 접수됐어요. 입금 확인 후 관리자 기능이 열립니다.
        </div>
      )}
      {showImpersonatedSubscriptionWarning && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-center text-sm font-semibold text-red-700">
          {subscription!.status === 'expired'
            ? '이 업체는 이용기간이 만료되었습니다. 갱신이 필요합니다.'
            : subscription!.status === 'trial'
            ? '이 업체는 아직 승인대기 상태입니다. (구독 등록 필요)'
            : `이 업체는 이용기간 유예기간 중입니다. (${subscription!.graceDaysLeft}일 남음)`}
        </div>
      )}
      <main>{children}</main>
    </div>
  )
}
