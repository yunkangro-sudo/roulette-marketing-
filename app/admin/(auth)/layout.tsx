import { redirect } from 'next/navigation'
import { getAdminSession, getEffectiveAccount } from '@/lib/admin/session'
import { getSubscriptionStatus } from '@/lib/admin/subscription'
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

  const subscription = account.role === 'advertiser'
    ? await getSubscriptionStatus(account.storeId)
    : null

  // 실제 광고주: grace만 경고 배너 (expired는 middleware가 이미 차단).
  // 대리접속 중: 차단은 절대 없고, grace/expired 둘 다 정보성 배너만 노출.
  const showGraceBanner = !impersonation && subscription?.status === 'grace'
  const showImpersonatedSubscriptionWarning =
    !!impersonation && (subscription?.status === 'grace' || subscription?.status === 'expired')

  return (
    <div className="min-h-screen bg-gray-50">
      {impersonation && (
        <ImpersonationBanner storeName={impersonation.storeName} originalEmail={impersonation.originalEmail} />
      )}
      <AdminNav account={account} />
      {showGraceBanner && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-center text-sm font-semibold text-red-700">
          이용기간이 만료되었습니다. {subscription!.graceDaysLeft}일 이내 갱신해주세요.
        </div>
      )}
      {showImpersonatedSubscriptionWarning && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-center text-sm font-semibold text-red-700">
          {subscription!.status === 'expired'
            ? '이 업체는 이용기간이 만료되었습니다. 갱신이 필요합니다.'
            : `이 업체는 이용기간 유예기간 중입니다. (${subscription!.graceDaysLeft}일 남음)`}
        </div>
      )}
      <main>{children}</main>
    </div>
  )
}
