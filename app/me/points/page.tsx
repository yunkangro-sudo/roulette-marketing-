'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type RewardType = 'free_item' | 'discount' | 'points' | 'experience' | 'special_coupon' | 'vip_reward'

const REWARD_TYPE_ICONS: Record<RewardType, string> = {
  free_item:      '🎁',
  discount:       '🏷️',
  points:         '⭐',
  experience:     '✨',
  special_coupon: '🎫',
  vip_reward:     '👑',
}

interface Reward {
  id: string
  name: string
  point_cost: number
  stock: number | null
  reward_type?: RewardType
  image_url?: string | null
}

interface LedgerEntry {
  type: 'earn' | 'redeem'
  amount: number
  created_at: string
}

interface Mission {
  id: string
  name: string
  missionType: string
  targetValue: number
  rewardType: 'point' | 'coupon'
  rewardValue: number
  endAt: string | null
  currentValue: number
  completedAt: string | null
}

interface MyCoupon {
  id: string
  amount: number
  shortCode: string | null
  validUntil: string
  storeName: string
  displayStatus: 'usable' | 'used' | 'expired'
}

const COUPON_STATUS_LABEL = {
  usable: '사용가능',
  used: '사용완료',
  expired: '만료',
} as const

function PointsContent() {
  const searchParams = useSearchParams()
  const storeId = searchParams.get('store_id') ?? ''

  const [needLogin, setNeedLogin] = useState(false)
  const [balance, setBalance] = useState(0)
  const [visitCount, setVisitCount] = useState(0)
  const [threshold, setThreshold] = useState(100)
  const [pointPerVisit, setPointPerVisit] = useState(10)
  const [catalog, setCatalog] = useState<Reward[]>([])
  const [history, setHistory] = useState<LedgerEntry[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [coupons, setCoupons] = useState<MyCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const load = useCallback(async () => {
    if (!storeId) return
    setLoading(true)
    setNeedLogin(false)
    try {
      const me = await fetch('/api/auth/me').then((r) => r.json())
      if (!me.user?.kakao_user_id) {
        setNeedLogin(true)
        return
      }

      const res = await fetch(`/api/me/points?store_id=${encodeURIComponent(storeId)}`)
      if (res.status === 401) {
        setNeedLogin(true)
        return
      }
      const data = await res.json()
      setBalance(data.loyalty?.point_balance ?? 0)
      setVisitCount(data.loyalty?.visit_count ?? 0)
      setThreshold(data.settings?.usage_threshold ?? 100)
      setPointPerVisit(data.settings?.point_per_visit ?? 10)
      setCatalog(data.catalog ?? [])
      setHistory(data.history ?? [])
      setMissions(data.missions ?? [])
      setCoupons(data.coupons ?? [])
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => { load() }, [load])

  async function handleRedeem(reward: Reward) {
    setMessage(null)
    setRedeeming(reward.id)
    try {
      const res = await fetch('/api/me/points/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId, reward_catalog_id: reward.id }),
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

  if (!storeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">잘못된 접근입니다. 카카오 채널 링크를 통해 접근해주세요.</p>
      </div>
    )
  }

  if (needLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-8 gap-6 text-center">
        <p className="text-gray-900 text-xl font-bold">쿠폰과 포인트를 보려면 로그인이 필요해요</p>
        <a
          href={`/api/auth/kakao?storeId=${encodeURIComponent(storeId)}&next=points`}
          className="w-full max-w-sm bg-yellow-400 text-gray-900 font-bold py-4 rounded-2xl"
        >
          카카오로 시작하기
        </a>
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
          <p className="text-orange-100 text-sm mb-1">내 쿠폰보관</p>
          <p className="text-5xl font-black mb-4">{balance.toLocaleString()}P</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-100">보유 쿠폰 {coupons.length}장</span>
            <span className="text-orange-100">방문 {visitCount}회 · 1회당 +{pointPerVisit}P</span>
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

        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3">보유 쿠폰</h2>
          {coupons.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center text-gray-400 text-sm">
              아직 받은 쿠폰이 없어요
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{c.amount.toLocaleString()}원</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.storeName}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        사용기한 ~{new Date(c.validUntil).toLocaleDateString('ko-KR')}
                        {c.shortCode ? ` · ${c.shortCode}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${
                      c.displayStatus === 'usable'
                        ? 'bg-orange-50 text-orange-600'
                        : c.displayStatus === 'used'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-red-50 text-red-500'
                    }`}>
                      {COUPON_STATUS_LABEL[c.displayStatus]}
                    </span>
                  </div>
                  {c.displayStatus === 'usable' && (
                    <a
                      href={`/checkout/${encodeURIComponent(storeId)}`}
                      className="mt-3 block text-center text-sm font-bold text-orange-600"
                    >
                      계산대에서 사용
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 진행 중 미션 — v3.1 Next Visit Loop */}
        {missions.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">🎯 진행 중인 미션</h2>
            <div className="space-y-3">
              {missions.map((mission) => {
                const pct = Math.min(100, Math.round((mission.currentValue / mission.targetValue) * 100))
                const remaining = mission.targetValue - mission.currentValue
                return (
                  <div key={mission.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{mission.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          달성 시 {mission.rewardType === 'point'
                            ? `${mission.rewardValue.toLocaleString()}P 적립`
                            : `${mission.rewardValue.toLocaleString()}원 쿠폰 지급`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-orange-500 whitespace-nowrap ml-2">
                        {mission.currentValue}/{mission.targetValue}회
                      </span>
                    </div>

                    {/* 진행률 바 */}
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-orange-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <p className="text-xs text-gray-400 mt-1.5">
                      {remaining > 0
                        ? `앞으로 ${remaining}회 더 방문하면 달성!`
                        : '달성 완료 처리 중...'}
                      {mission.endAt && (
                        <span className="ml-1">
                          · 마감 {new Date(mission.endAt).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
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
                  <div key={reward.id} className={`bg-white rounded-xl border px-4 py-4 flex items-center gap-4 ${
                    outOfStock ? 'border-gray-100 opacity-50' : 'border-gray-200'
                  }`}>
                    {/* 이미지 또는 아이콘 */}
                    {reward.image_url ? (
                      <img src={reward.image_url} alt={reward.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-gray-100" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-2xl shrink-0">
                        {REWARD_TYPE_ICONS[reward.reward_type ?? 'free_item']}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{reward.name}</p>
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
