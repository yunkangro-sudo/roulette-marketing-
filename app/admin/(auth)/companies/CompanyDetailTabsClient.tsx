'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CompanyForm from './CompanyForm'
import CompanySubscriptionsPanel, { type Subscription } from './CompanySubscriptionsPanel'
import CompanySummaryPanel from './CompanySummaryPanel'
import DeleteCompanyDangerZone from './DeleteCompanyDangerZone'

interface CompanyInitial {
  id: string
  store_id: string
  store_name: string
  contract_start_date: string
  contract_end_date: string
  ad_amount: number
  contractor_name: string
  manager_name: string
  phone?: string
  website?: string
  address?: string
  remarks?: string
  daangn_url?: string
  kakao_channel_url?: string
  business_type?: string
  advertiserEmail?: string
}

interface SubscriptionStatus {
  status: 'trial' | 'active' | 'grace' | 'expired'
  startDate: string | null
  endDate: string | null
  graceDaysLeft: number | null
}

const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus['status'], { label: string; className: string }> = {
  trial:   { label: '무제한 체험 (구독 이력 없음)', className: 'bg-blue-100 text-blue-700' },
  active:  { label: '정상 이용중',                 className: 'bg-green-100 text-green-700' },
  grace:   { label: '만료 · 유예기간',             className: 'bg-orange-100 text-orange-700' },
  expired: { label: '이용기간 만료 (접근 차단됨)',   className: 'bg-red-100 text-red-700' },
}

type Tab = 'basic' | 'subscription' | 'summary'
const TABS: { id: Tab; label: string }[] = [
  { id: 'basic',        label: '기본정보' },
  { id: 'subscription', label: '이용기간·결제' },
  { id: 'summary',       label: '요약 현황' },
]

interface Props {
  company: CompanyInitial
  subscriptions: Subscription[]
  subscriptionStatus: SubscriptionStatus
  /** 슈퍼관리자만 "위험 구역"(업체 완전 삭제)을 볼 수 있음 — agency는 계약 관리는 가능하지만 데이터 파괴는 불가 */
  isSuperAdmin: boolean
}

export default function CompanyDetailTabsClient({ company, subscriptions, subscriptionStatus, isSuperAdmin }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('basic')
  const [entering, setEntering] = useState(false)
  const [enterError, setEnterError] = useState('')

  async function handleEnterAsAdvertiser() {
    setEnterError('')
    setEntering(true)
    try {
      const res = await fetch('/api/admin/impersonation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: company.store_id }),
      })
      const data = await res.json()
      if (!res.ok) { setEnterError(data.error ?? '진입 실패'); return }
      router.push('/admin/dashboard')
      router.refresh()
    } catch {
      setEnterError('네트워크 오류가 발생했습니다')
    } finally {
      setEntering(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/companies" className="text-gray-400 hover:text-gray-600 text-sm">← 목록으로</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">{company.store_name}</h1>
        </div>
        <button
          onClick={handleEnterAsAdvertiser}
          disabled={entering}
          className="shrink-0 bg-gray-900 hover:bg-gray-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40"
        >
          {entering ? '진입 중...' : '🔑 이 업체로 관리 진입'}
        </button>
      </div>
      {enterError && <p className="text-xs text-red-500 -mt-2">{enterError}</p>}

      {/* 현재 이용기간 히어로 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-xs text-gray-400 mb-1">현재 이용기간</p>
          <p className="text-lg font-black text-gray-900">
            {subscriptionStatus.startDate && subscriptionStatus.endDate
              ? `${subscriptionStatus.startDate} ~ ${subscriptionStatus.endDate}`
              : '설정된 구독 없음 (무제한 체험)'}
          </p>
        </div>
        <span className={`self-start sm:self-auto text-xs font-bold px-3 py-1.5 rounded-full ${SUBSCRIPTION_STATUS_LABEL[subscriptionStatus.status].className}`}>
          {SUBSCRIPTION_STATUS_LABEL[subscriptionStatus.status].label}
          {subscriptionStatus.status === 'grace' && ` (${subscriptionStatus.graceDaysLeft}일 남음)`}
        </span>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'basic' && <CompanyForm mode="edit" initial={company} hideChrome />}
      {tab === 'subscription' && (
        <CompanySubscriptionsPanel companyId={company.id} initialSubscriptions={subscriptions} />
      )}
      {tab === 'summary' && <CompanySummaryPanel storeId={company.store_id} />}

      {isSuperAdmin && (
        <DeleteCompanyDangerZone companyId={company.id} storeName={company.store_name} />
      )}
    </div>
  )
}
