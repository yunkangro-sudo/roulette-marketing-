'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface DemoStoreItem {
  storeId: string
  storeName: string
  businessType: string
  createdAt: string | null
  customerCount: number
  segmentCounts: Record<string, number>
  couponCount: number
  couponUsedCount: number
}

const SEGMENT_LABEL: Record<string, string> = {
  NEW: '신규',
  ACTIVE: '활성',
  AT_RISK: '이달위험',
  DORMANT: '휴면',
  RETURNED: '복귀',
}
const SEGMENT_ORDER = ['NEW', 'ACTIVE', 'AT_RISK', 'DORMANT', 'RETURNED']
const SEGMENT_BADGE: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-600',
  ACTIVE: 'bg-green-50 text-green-600',
  AT_RISK: 'bg-yellow-50 text-yellow-700',
  DORMANT: 'bg-gray-100 text-gray-500',
  RETURNED: 'bg-purple-50 text-purple-600',
}

export default function DemoStoresClient({ items }: { items: DemoStoreItem[] }) {
  const router = useRouter()
  const [busyAll, setBusyAll] = useState(false)
  const [busyStore, setBusyStore] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [entering, setEntering] = useState<string | null>(null)

  async function regenerate(storeId?: string) {
    setError('')
    if (storeId) setBusyStore(storeId)
    else setBusyAll(true)
    try {
      const res = await fetch('/api/admin/super/demo-stores/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeId ? { storeId } : {}),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '재생성에 실패했습니다')
        return
      }
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다 — DATABASE_URL 환경변수가 이 서버에 설정되어 있는지 확인하세요')
    } finally {
      setBusyAll(false)
      setBusyStore(null)
    }
  }

  async function enterStore(storeId: string) {
    setEntering(storeId)
    try {
      const res = await fetch('/api/admin/impersonation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '대리접속 실패'); return }
      router.push('/admin/dashboard')
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setEntering(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 px-5 py-4">
        <div className="text-sm text-gray-600">
          시연하다 데이터가 지저분해졌거나, 최신 트렌드로 다시 채우고 싶을 때 사용하세요.
          <br className="hidden sm:block" />
          콘텐츠(매장정보·쿠폰·리워드)는 그대로 두고 방문/쿠폰/포인트 이력만 초기화 후 새로 만듭니다.
        </div>
        <button
          onClick={() => regenerate()}
          disabled={busyAll || busyStore !== null}
          className="shrink-0 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          {busyAll ? '전체 재생성 중… (1분 내외)' : '전체 10곳 재생성'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.storeId} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-gray-900">{item.storeName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.storeId}</p>
              </div>
              <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">샘플</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-gray-400 text-xs">가입 손님</p>
                <p className="font-bold text-gray-900">{item.customerCount.toLocaleString()}명</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-gray-400 text-xs">발급 쿠폰</p>
                <p className="font-bold text-gray-900">
                  {item.couponCount.toLocaleString()}장
                  <span className="text-xs font-normal text-gray-400"> (사용 {item.couponUsedCount})</span>
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {SEGMENT_ORDER.filter((seg) => item.segmentCounts[seg]).map((seg) => (
                <span key={seg} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEGMENT_BADGE[seg]}`}>
                  {SEGMENT_LABEL[seg]} {item.segmentCounts[seg]}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`/b/${item.storeId}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                공개페이지 보기 ↗
              </a>
              <button
                onClick={() => enterStore(item.storeId)}
                disabled={entering === item.storeId}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {entering === item.storeId ? '진입 중…' : '대리접속(관리자 화면)'}
              </button>
              <button
                onClick={() => regenerate(item.storeId)}
                disabled={busyAll || busyStore !== null}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-50 transition-colors"
              >
                {busyStore === item.storeId ? '재생성 중…' : '이 매장만 재생성'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-3">
        재생성 버튼이 동작하지 않으면(예: DATABASE_URL 미설정) 로컬에서 직접 실행하세요 —{' '}
        <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">node scripts/seed-demo-stores.mjs</code>{' '}
        →{' '}
        <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">node scripts/seed-demo-activity.mjs</code>
        {' '}(반드시 이 순서로).
      </div>
    </div>
  )
}
