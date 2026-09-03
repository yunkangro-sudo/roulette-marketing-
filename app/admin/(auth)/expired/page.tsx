import { requireAdminAuth } from '@/lib/admin/session'
import { getSubscriptionStatus } from '@/lib/admin/subscription'

/**
 * middleware.ts가 'expired'(이용기간 만료)와 'trial'(승인대기, subscriptions row 없음)을
 * 동일하게 이 페이지로 리다이렉트하므로, 어느 쪽인지 다시 조회해서 문구만 분기한다.
 * 화면 구조/스타일은 재사용하고 텍스트만 바꾼다.
 */
export default async function ExpiredPage() {
  const account = await requireAdminAuth()
  const subscription = account.role === 'advertiser' ? await getSubscriptionStatus(account.storeId) : null
  const isPendingApproval = subscription?.status === 'trial'

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {isPendingApproval ? (
        <>
          <div className="text-5xl mb-5">📝</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">가입 신청이 접수됐어요</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            입금 확인 후 이용 가능합니다.
            <br />
            결제 등록이 완료되면 별도 조치 없이 바로 관리자 화면을 이용하실 수 있습니다.
            <br />
            입금 확인은 담당자에게 문의해주세요.
          </p>
        </>
      ) : (
        <>
          <div className="text-5xl mb-5">⏰</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">이용기간이 만료되었습니다</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            매장 이용기간이 만료되어 관리자 화면 이용이 제한됩니다.
            <br />
            이미 발급된 쿠폰은 계산대에서 계속 정상적으로 사용하실 수 있습니다.
            <br />
            이용기간 갱신은 담당자에게 문의해주세요.
          </p>
        </>
      )}
      <div className="bg-white border border-gray-200 rounded-xl p-5 inline-block text-left">
        <p className="text-xs text-gray-500 mb-1">문의처</p>
        <p className="text-sm font-semibold text-gray-900">담당자 카카오톡 채널 또는 계약 시 안내받은 연락처</p>
      </div>
    </div>
  )
}
