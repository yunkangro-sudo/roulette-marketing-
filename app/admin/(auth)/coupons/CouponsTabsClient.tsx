'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CouponIssueClient from './issue/CouponIssueClient'
import CouponStatusClient from './CouponStatusClient'

type Tab = 'issue' | 'status'
type Range = 'today' | 'week' | 'month' | 'custom'

interface Props {
  role: string
  storeId: string | null
  /** 대시보드 "쿠폰 현황" 탭에 임베드될 때 true — 자체 타이틀/외곽 패딩을 제거하고 공통 기간 필터를 받아쓴다 */
  embedded?: boolean
  range?: Range
  customFrom?: string
  customTo?: string
}

export default function CouponsTabsClient({ role, storeId, embedded = false, range, customFrom, customTo }: Props) {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'issue' ? 'issue' : 'status')

  const body = (
    <>
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
        ? <CouponStatusClient role={role} storeId={storeId} embedded={embedded} range={range} customFrom={customFrom} customTo={customTo} />
        : <div className={embedded ? '' : '-mx-4'}><CouponIssueClient role={role} storeId={storeId} /></div>}
    </>
  )

  if (embedded) return body

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">쿠폰 관리</h1>
        <p className="text-xs text-gray-400 mt-0.5">쿠폰 발급, 발급·사용 현황을 한 화면에서 관리하세요</p>
      </div>
      {body}
    </div>
  )
}
