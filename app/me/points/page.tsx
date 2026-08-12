'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface Reward {
  id: string
  name: string
  point_cost: number
  stock: number | null
}

interface LedgerEntry {
  type: 'earn' | 'redeem'
  amount: number
  created_at: string
}

function PointsContent() {
  const searchParams = useSearchParams()
  const kakaoUserId = searchParams.get('uid') ?? ''
  const storeId = searchParams.get('store_id') ?? ''

  const [balance, setBalance] = useState(0)
  const [visitCount, setVisitCount] = useState(0)
  const [threshold, setThreshold] = useState(100)
  const [pointPerVisit, setPointPerVisit] = useState(10)
  const [catalog, setCatalog] = useState<Reward[]>([])
  const [history, setHistory] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const load = useCallback(async () => {
    if (!kakaoUserId || !storeId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/me/points?kakao_user_id=${encodeURIComponent(kakaoUserId)}&store_id=${encodeURIComponent(storeId)}`)
      const data = await res.json()
      setBalance(data.loyalty?.point_balance ?? 0)
      setVisitCount(data.loyalty?.visit_count ?? 0)
      setThreshold(data.settings?.usage_threshold ?? 100)
      setPointPerVisit(data.settings?.point_per_visit ?? 10)
      setCatalog(data.catalog ?? [])
      setHistory(data.history ?? [])
    } finally {
      setLoading(false)
    }
  }, [kakaoUserId, storeId])

  useEffect(() => { load() }, [load])

  async function handleRedeem(reward: Reward) {
    setMessage(null)
    setRedeeming(reward.id)
    try {
      const res = await fetch('/api/me/points/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kakao_user_id: kakaoUserId, store_id: storeId, reward_catalog_id: reward.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ text: data.error ?? '교환 실패', ok: false })
      } else {
        setMessage({ text: `🎉 "${reward.name}" 교환 완료! 직원에게 화면을 보여주세요.`, ok: true })
        await load()
      }
    } catch {
      setMessage({ text: '네트워크 오류가 발생했습니다', ok: false })
    } finally {
      setRedeeming(null)
    }
  }

  if (!kakaoUserId || !storeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">잘못된 접근입니다. 카카오 채널 링크를 통해 접근해주세요.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    )
  }

  const canUsePoints = balance >= threshold

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-8 space-y-5">
        {/* 포인트 잔액 카드 */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-orange-100 text-sm mb-1">내 포인트</p>
          <p className="text-5xl font-black mb-4">{balance.toLocaleString()}P</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-100">방문 {visitCount}회</span>
            <span className="text-orange-100">방문 1회당 +{pointPerVisit}P</span>
          </div>

          {/* 사용 가능 여부 */}
          <div className={`mt-4 px-3 py-2 rounded-lg text-sm font-semibold ${
            canUsePoints
              ? 'bg-white/20 text-white'
              : 'bg-white/10 text-orange-200'
          }`}>
            {canUsePoints
              ? `✅ 리워드 교환 가능 (${balance}P ≥ ${threshold}P)`
              : `🔒 ${threshold}P 이상부터 교환 가능 (${threshold - balance}P 더 필요)`}
          </div>
        </div>

        {/* 알림 */}
        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.ok
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* 리워드 카탈로그 */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3">리워드 교환</h2>
          {catalog.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center text-gray-400 text-sm">
              현재 교환 가능한 리워드가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {catalog.map((reward) => {
                const canRedeem = canUsePoints && balance >= reward.point_cost
                const outOfStock = reward.stock !== null && reward.stock <= 0
                return (
                  <div key={reward.id} className={`bg-white rounded-xl border px-5 py-4 flex items-center justify-between ${
                    outOfStock ? 'border-gray-100 opacity-50' : 'border-gray-200'
                  }`}>
                    <div>
                      <p className="font-semibold text-gray-900">{reward.name}</p>
                      <p className="text-sm text-orange-500 font-bold mt-0.5">{reward.point_cost.toLocaleString()}P</p>
                      {reward.stock !== null && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {outOfStock ? '품절' : `잔여 ${reward.stock}개`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={!canRedeem || outOfStock || redeeming === reward.id}
                      className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${
                        canRedeem && !outOfStock
                          ? 'bg-orange-500 hover:bg-orange-400 text-white'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      } disabled:opacity-50`}
                    >
                      {redeeming === reward.id ? '처리 중...' : '교환하기'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 포인트 내역 */}
        {history.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">포인트 내역</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-gray-700">{h.type === 'earn' ? '게임 참여 적립' : '리워드 교환'}</p>
                    <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <p className={`text-sm font-bold ${h.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                    {h.type === 'earn' ? '+' : '-'}{h.amount}P
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PointsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    }>
      <PointsContent />
    </Suspense>
  )
}
