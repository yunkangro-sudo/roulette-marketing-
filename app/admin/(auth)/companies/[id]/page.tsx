import { requireAdminAuth } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import { getSubscriptionStatus } from '@/lib/admin/subscription'
import { redirect, notFound } from 'next/navigation'
import CompanyDetailTabsClient from '../CompanyDetailTabsClient'

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const account = await requireAdminAuth()
  if (!['agency', 'super_admin'].includes(account.role)) redirect('/admin/events')

  const supabase = createServerClient()

  // store_contracts + 광고주 이메일 함께 조회
  const { data: company } = await supabase
    .from('store_contracts')
    .select('*')
    .eq('id', id)
    .single()

  if (!company) notFound()

  // 해당 매장의 advertiser 계정 이메일
  const { data: advertiserAccount } = await supabase
    .from('store_accounts')
    .select('email')
    .eq('store_id', company.store_id)
    .eq('role', 'advertiser')
    .maybeSingle()

  const [{ data: subscriptions }, subscriptionStatus] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('id, plan_name, amount_paid, start_date, end_date, memo, created_at')
      .eq('store_id', company.store_id)
      .order('end_date', { ascending: false }),
    getSubscriptionStatus(company.store_id),
  ])

  return (
    <CompanyDetailTabsClient
      company={{ ...company, advertiserEmail: advertiserAccount?.email ?? '' }}
      subscriptions={subscriptions ?? []}
      subscriptionStatus={subscriptionStatus}
    />
  )
}
