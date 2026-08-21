'use client'

import { useEffect, useState } from 'react'

interface Store { store_id: string; store_name: string }

interface Props {
  role: string
  sessionStoreId: string | null
  selectedStoreId: string
  onSelect: (storeId: string) => void
}

/**
 * 매장 선택 드롭다운
 * - advertiser: UI 없음, 세션 store_id 자동 사용
 * - super_admin / agency: store_contracts 기반 드롭다운
 */
export default function StoreSelector({ role, sessionStoreId, selectedStoreId, onSelect }: Props) {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (role === 'advertiser') {
      if (sessionStoreId) onSelect(sessionStoreId)
      return
    }
    setLoading(true)
    fetch('/api/admin/stores')
      .then((r) => r.json())
      .then((data) => setStores(data.stores ?? []))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, sessionStoreId])

  // advertiser: 아무것도 표시하지 않음
  if (role === 'advertiser') return null

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="text-sm font-semibold text-gray-700 shrink-0">관리할 매장</span>
      {loading ? (
        <span className="text-sm text-gray-400">불러오는 중...</span>
      ) : (
        <select
          value={selectedStoreId}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500 bg-white"
        >
          <option value="">-- 매장을 선택하세요 --</option>
          {stores.map((s) => (
            <option key={s.store_id} value={s.store_id}>
              {s.store_name} ({s.store_id})
            </option>
          ))}
        </select>
      )}
      {!selectedStoreId && !loading && (
        <span className="text-xs text-orange-500 shrink-0">매장 선택 후 이용 가능합니다</span>
      )}
    </div>
  )
}
