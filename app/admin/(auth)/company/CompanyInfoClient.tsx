'use client'

import { useState } from 'react'
import CompanyForm from '../companies/CompanyForm'
import CompanySubscriptionsPanel, { type Subscription } from '../companies/CompanySubscriptionsPanel'
import CompanySummaryPanel from '../companies/CompanySummaryPanel'

interface Company {
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
  expired: { label: '이용기간 만료',               className: 'bg-red-100 text-red-700' },
}

type Tab = 'basic' | 'subscription' | 'summary'
const TABS: { id: Tab; label: string }[] = [
  { id: 'basic',        label: '기본정보' },
  { id: 'subscription', label: '이용기간·결제' },
  { id: 'summary',      label: '요약 현황' },
]

interface Props {
  company: Company
  subscriptions: Subscription[]
  subscriptionStatus: SubscriptionStatus
}

export default function CompanyInfoClient({ company, subscriptions, subscriptionStatus }: Props) {
  const [tab, setTab] = useState<Tab>('basic')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">업체 정보</h1>
        <p className="text-xs text-gray-400 mt-1">{company.store_name} · {company.store_id}</p>
      </div>

      {/* 현재 이용기간 히어로 (읽기전용) */}
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

      {tab === 'basic' && (
        <CompanyForm mode="edit" initial={company} hideChrome variant="advertiser" />
      )}

      {tab === 'subscription' && (
        <div className="space-y-4">
          {/* 계약 정보(계약기간·월 광고비) — 수퍼관리자가 입력, 읽기전용 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700">계약 정보</h2>
              <span className="text-[11px] text-gray-400">수퍼관리자만 수정 가능</span>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">계약 기간</p>
              <p className="text-sm text-gray-900 font-medium">
                {company.contract_start_date && company.contract_end_date
                  ? `${company.contract_start_date} ~ ${company.contract_end_date}`
                  : '미설정'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">월 광고비</p>
              <p className="text-sm text-gray-900 font-medium">
                {company.ad_amount ? `${company.ad_amount.toLocaleString()}원 / 월` : '미설정'}
              </p>
            </div>
          </div>

          {/* 구독(이용기간) 이력 — 읽기전용 */}
          <CompanySubscriptionsPanel initialSubscriptions={subscriptions} readOnly />
        </div>
      )}

      {tab === 'summary' && <CompanySummaryPanel storeId={company.store_id} />}
    </div>
  )
}
