import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import SetupRequestList, { type SetupRequestItem } from './SetupRequestList'
import type { SetupPrize, SetupReward, SetupStatus } from '@/lib/setup-request/types'

export default async function SetupRequestsPage() {
  const account = await requireAdminAuth()
  if (!['agency', 'super_admin'].includes(account.role)) redirect('/admin/events')

  const supabase = createServerClient()
  const { data } = await supabase
    .from('setup_requests')
    .select('*')
    .order('created_at', { ascending: false })

  const items: SetupRequestItem[] = (data ?? []).map((row) => ({
    id: row.id,
    storeName: row.store_name,
    address: row.address,
    phone: row.phone,
    salespersonName: row.salesperson_name,
    salespersonPhone: row.salesperson_phone,
    products: row.products ?? [],
    hqCall: row.hq_call,
    prizes: (row.prizes ?? []) as SetupPrize[],
    rewards: (row.rewards ?? []) as SetupReward[],
    daangnUrl: row.daangn_url,
    naverReviewUrl: row.naver_review_url,
    googleReviewUrl: row.google_review_url,
    naverPlaceUrl: row.naver_place_url,
    intro: row.intro,
    businessHours: row.business_hours,
    openDate: row.open_date,
    photoViaKakao: row.photo_via_kakao,
    memo: row.memo,
    status: row.status as SetupStatus,
    createdAt: row.created_at,
  }))

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">세팅 접수</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          영업사원과 광고주가 보낸 단골팅, 당근마케팅, AEO마케팅 신청입니다. 게임과 리워드는 이 내용을 보고 넣습니다.
        </p>
      </div>
      <SetupRequestList items={items} />
    </div>
  )
}
