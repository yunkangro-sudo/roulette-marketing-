import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import { getSubscriptionStatus } from '@/lib/admin/subscription'
import CompanyInfoClient from './CompanyInfoClient'

/**
 * 광고주(또는 대리접속 중인 super_admin/agency) 전용 "업체 정보" 페이지.
 * 수퍼관리자의 /admin/companies/[id] 상세와 동일한 3개 섹션(기본정보/이용기간·결제/요약 현황)을
 * 광고주 본인 매장 기준으로 보여준다 — 기본정보만 수정 가능, 이용기간·결제는 읽기전용.
 */
export default async function CompanyInfoPage() {
  const account = await requireAdminAuth()
  if (account.role !== 'advertiser' || !account.storeId) redirect('/admin/companies')

  const storeId = account.storeId
  const supabase = createServerClient()

  const [{ data: company }, { data: subscriptions }, subscriptionStatus] = await Promise.all([
    supabase.from('store_contracts').select('*').eq('store_id', storeId).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('id, plan_name, amount_paid, start_date, end_date, memo, created_at')
      .eq('store_id', storeId)
      .order('end_date', { ascending: false }),
    getSubscriptionStatus(storeId),
  ])

  if (!company) redirect('/admin/dashboard')

  return (
    <CompanyInfoClient
      company={company}
      subscriptions={subscriptions ?? []}
      subscriptionStatus={subscriptionStatus}
    />
  )
}
