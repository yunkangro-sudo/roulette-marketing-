'use client'

import { useEffect, useState, useCallback } from 'react'
import StoreSelector from '../components/StoreSelector'

interface Reward { id: string; name: string; point_cost: number; active: boolean; stock: number | null; requires_verification: boolean }
interface Props { role: string; storeId: string | null }

export default function RewardCatalogClient({ role, storeId }: Props) {
  const [selectedStore, setSelectedStore] = useState(storeId ?? '')
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [newName, setNewName] = useState('')
  const [newCost, setNewCost] = useState('')
  const [newStock, setNewStock] = useState('')
  const [newVerify, setNewVerify] = useState(false)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async (sid: string) => {
    if (!sid) return
    setLoading(true)
    const res = await fetch(`/api/admin/reward-catalog?store_id=${encodeURIComponent(sid)}`)
    if (res.ok) setRewards(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    if (selectedStore) load(selectedStore)
    else setRewards([])
  }, [selectedStore, load])

  async function handleAdd() {
    if (!selectedStore) { setMessage({ text: '매장을 먼저 선택해주세요', ok: false }); return }
    if (!newName || !newCost) return
    setAdding(true)
    setMessage(null)
    const res = await fetch('/api/admin/reward-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_id: selectedStore, name: newName, point_cost: newCost, stock: newStock || null, requires_verification: newVerify }),
    })
    const data = await res.json()
    if (!res.ok) { setMessage({ text: data.error ?? '등록 실패', ok: false }) }
    else { setNewName(''); setNewCost(''); setNewStock(''); setNewVerify(false); setMessage({ text: '✅ 리워드가 등록되었습니다', ok: true }); await load(selectedStore) }
    setAdding(false)
  }

  async function toggleActive(r: Reward) {
    await fetch(`/api/admin/reward-catalog/${r.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !r.active }),
    })
    await load(selectedStore)
  }

  async function updateStock(r: Reward, val: string) {
    await fetch(`/api/admin/reward-catalog/${r.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: val }),
    })
    await load(selectedStore)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-2">리워드 카탈로그</h1>
      <p className="text-sm text-gray-500 mb-4">
        금액 쿠폰뿐 아니라 특정 메뉴·상품도 리워드로 등록할 수 있어요
      </p>

      <div className="mb-5">
        <StoreSelector role={role} sessionStoreId={storeId} selectedStoreId={selectedStore} onSelect={setSelectedStore} />
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          message.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>{message.text}</div>
      )}

      {selectedStore ? (
        <>
          {/* 새 리워드 등록 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">새 리워드 등록</h2>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="col-span-3 sm:col-span-1">
                <label className="block text-xs text-gray-500 mb-1">리워드 이름</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 아메리카노 1잔, 마른안주 세트, 5,000원 할인"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">필요 포인트</label>
                <input type="number" value={newCost}
                  onChange={(e) => {
                    setNewCost(e.target.value)
                    // 10,000P 이상이면 본인확인 자동 체크 권장
                    if (Number(e.target.value) >= 10000) setNewVerify(true)
                  }}
                  placeholder="50" min={1}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">재고 (빈칸=무제한)</label>
                <input type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="무제한" min={0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            {/* 본인확인 옵션 */}
            <label className="flex items-start gap-2.5 cursor-pointer mb-3 group">
              <input type="checkbox" checked={newVerify} onChange={(e) => setNewVerify(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-orange-500 cursor-pointer" />
              <span className="text-sm text-gray-700 leading-snug">
                <span className="font-medium">계산대 본인 확인 필요</span>
                <span className="text-gray-400 text-xs block mt-0.5">
                  체크하면 직원이 손님 신분 확인 후 처리 — 10,000P 이상 고가 리워드에 권장
                </span>
              </span>
            </label>

            <button onClick={handleAdd} disabled={adding || !newName || !newCost}
              className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50 transition-colors">
              {adding ? '등록 중...' : '+ 등록'}
            </button>
          </div>

          {/* 리워드 목록 */}
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-8">불러오는 중...</p>
          ) : rewards.length === 0 ? (
            <div className="bg-gray-50 rounded-xl border border-gray-200 py-10 text-center text-gray-400 text-sm">
              등록된 리워드가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map((r) => (
                <div key={r.id} className={`bg-white border rounded-xl px-5 py-4 ${r.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-orange-500 font-bold">{r.point_cost.toLocaleString()}P</p>
                        {r.requires_verification && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">본인확인</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>재고:</span>
                        <input type="number" defaultValue={r.stock ?? ''} onBlur={(e) => updateStock(r, e.target.value)}
                          placeholder="∞" min={0}
                          className="w-16 border border-gray-200 rounded px-2 py-1 text-center text-xs" />
                      </div>
                      <button onClick={() => toggleActive(r)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                          r.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>
                        {r.active ? '활성' : '비활성'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
          위에서 매장을 선택하면 리워드를 관리할 수 있습니다
        </div>
      )}
    </div>
  )
}
