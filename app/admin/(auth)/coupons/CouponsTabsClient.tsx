'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CouponIssueClient from './issue/CouponIssueClient'
import CouponStatusClient from './CouponStatusClient'

type Tab = 'issue' | 'status'

interface Props {
  role: string
  storeId: string | null
}

export default function CouponsTabsClient({ role, storeId }: Props) {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'issue' ? 'issue' : 'status')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">쿠폰 관리</h1>
        <p className="text-xs text-gray-400 mt-0.5">쿠폰 발급, 발급·사용 현황을 한 화면에서 관리하세요</p>
      </div>

      <div className="flex gap-2 mb-5 border-b border-gray-200">
        {([
          { key: 'status', label: '발급·사용 현황' },
          { key: 'issue',  label: '발급하기' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'status'
        ? <CouponStatusClient role={role} storeId={storeId} />
        : <div className="-mx-4"><CouponIssueClient role={role} storeId={storeId} /></div>}
    </div>
  )
}
