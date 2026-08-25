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
  requires_verification?: boolean
  discount_amount?: number | null
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
  label: string | null
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

/** 리워드 카드 하단의 진행률 게이지 — 럭키박스 캐릭터 아이콘 + 브랜드그린 게이지바 + 상태 문구.
 *  마운트 직후 0%에서 실제 값까지 부드럽게 차오르도록, 첫 렌더는 0으로 그리고 잠깐 뒤 목표값으로 전환한다. */
function RewardGauge({ percent, sufficient, pointsShort }: { percent: number; sufficient: boolean; pointsShort: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDisplay(percent), 80)
    return () => clearTimeout(t)
  }, [percent])

  return (
    <div className="mt-2.5 flex flex-col items-center">
      <img src="/characters/char_display_mint.webp" alt="" className="mb-1 h-7 w-7 object-contain" />
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#00C7A7]/15">
        <div
          className="h-2 rounded-full bg-[#00C7A7] transition-all duration-700 ease-out"
          style={{ width: `${display}%` }}
        />
      </div>
      <p className="mt-1.5 text-center text-[11px] font-medium text-[#222222]/50">
        {sufficient ? '지금 바로 받을 수 있어요' : `${pointsShort.toLocaleString()}P 더 모으면 받을 수 있어요`}
      </p>
    </div>
  )
}

function PointsContent() {
  const searchParams = useSearchParams()
  const storeId = searchParams.get('store_id') ?? ''

  const [needLogin, setNeedLogin] = useState(false)
  const [storeName, setStoreName] = useState('')
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
      setStoreName(data.storeName ?? '')
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
      <div className="flex min-h-screen items-center justify-center bg-[#EFE6D6]">
        <p className="text-sm text-[#222222]/45">잘못된 접근입니다. 카카오 채널 링크를 통해 접근해주세요.</p>
      </div>
    )
  }

  if (needLogin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#EFE6D6] px-8 text-center">
        <p className="text-xl font-bold text-[#222222]">쿠폰과 포인트를 보려면 로그인이 필요해요</p>
        <a
          href={`/api/auth/kakao?storeId=${encodeURIComponent(storeId)}&next=points`}
          className="w-full max-w-sm rounded-full bg-[#FEE500] py-4 text-center font-bold text-[#222222] shadow-sm transition-colors hover:bg-[#FADA00]"
        >
          카카오로 시작하기
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EFE6D6]">
        <p className="text-sm text-[#222222]/45">불러오는 중...</p>
      </div>
    )
  }

  const canUsePoints = balance >= threshold

  return (
    <div className="min-h-screen bg-[#EFE6D6]">
      <div className="mx-auto max-w-md space-y-5 px-4 py-8">
        <a
          href={`/play/${encodeURIComponent(storeId)}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#222222]/50 transition-colors hover:text-[#222222]/80"
        >
          ← 게임으로 돌아가기
        </a>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold text-[#222222]">내 쿠폰함</h1>
          {storeName && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-[#222222]/60 shadow-sm backdrop-blur-sm">
              🏪 {storeName}
            </span>
          )}
        </div>

        {/* 포인트 잔액 카드 — 매장별 집계 */}
        <div className="rounded-2xl bg-gradient-to-br from-[#00C7A7] to-[#00B399] p-6 text-white shadow-sm">
          <p className="mb-1 text-sm text-white/80">
            포인트 잔액{storeName ? ` (${storeName})` : ''}
          </p>
          <p className="mb-4 text-5xl font-black">{balance.toLocaleString()}P</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">보유 쿠폰 {coupons.length}장</span>
            <span className="text-white/80">방문 {visitCount}회 · 1회당 +{pointPerVisit}P</span>
          </div>

          {/* 사용 가능 여부 */}
          <div className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${
            canUsePoints
              ? 'bg-white/20 text-white'
              : 'bg-white/10 text-white/80'
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
              ? 'border border-green-200 bg-green-50 text-green-700'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div>
          <h2 className="mb-3 text-sm font-bold text-[#222222]/70">보유 쿠폰</h2>
          {coupons.length === 0 ? (
            <div className="rounded-xl bg-white/70 px-5 py-8 text-center text-sm text-[#222222]/40 shadow-sm backdrop-blur-sm">
              아직 받은 쿠폰이 없어요
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((c) => (
                <a
                  key={c.id}
                  href={`/me/points/${encodeURIComponent(c.id)}?store_id=${encodeURIComponent(storeId)}`}
                  className="block rounded-xl bg-white/70 px-5 py-4 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/90"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-[#222222]">{c.label || `${c.amount.toLocaleString()}원`}</p>
                      <p className="mt-0.5 text-xs text-[#222222]/50">{c.storeName}</p>
                      <p className="mt-1 text-xs text-[#222222]/40">
                        사용기한 ~{new Date(c.validUntil).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${
                      c.displayStatus === 'usable'
                        ? 'bg-[#00C7A7]/10 text-[#00947A]'
                        : c.displayStatus === 'used'
                          ? 'bg-[#222222]/8 text-[#222222]/45'
                          : 'bg-red-50 text-red-500'
                    }`}>
                      {COUPON_STATUS_LABEL[c.displayStatus]}
                    </span>
                  </div>
                  {c.displayStatus === 'usable' && (
                    <p className="mt-3 text-center text-sm font-bold text-[#00947A]">
                      쿠폰 보기 →
                    </p>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* 진행 중 미션 — v3.1 Next Visit Loop */}
        {missions.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-bold text-[#222222]/70">🎯 진행 중인 미션</h2>
            <div className="space-y-3">
              {missions.map((mission) => {
                const pct = Math.min(100, Math.round((mission.currentValue / mission.targetValue) * 100))
                const remaining = mission.targetValue - mission.currentValue
                return (
                  <div key={mission.id} className="rounded-xl bg-white/70 px-5 py-4 shadow-sm backdrop-blur-sm">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#222222]">{mission.name}</p>
                        <p className="mt-0.5 text-xs text-[#222222]/40">
                          달성 시 {mission.rewardType === 'point'
                            ? `${mission.rewardValue.toLocaleString()}P 적립`
                            : `${mission.rewardValue.toLocaleString()}원 쿠폰 지급`}
                        </p>
                      </div>
                      <span className="ml-2 whitespace-nowrap text-sm font-bold text-[#00947A]">
                        {mission.currentValue}/{mission.targetValue}회
                      </span>
                    </div>

                    {/* 진행률 바 */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#222222]/8">
                      <div
                        className="h-2 rounded-full bg-[#00C7A7] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <p className="mt-1.5 text-xs text-[#222222]/40">
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

        {/* 리워드 교환 — 이미지가 먼저 눈에 들어오는 카드형 */}
        <div>
          <h2 className="mb-3 text-sm font-bold text-[#222222]/70">리워드 교환</h2>
          {catalog.length === 0 ? (
            <div className="rounded-xl bg-white/70 px-5 py-8 text-center text-sm text-[#222222]/40 shadow-sm backdrop-blur-sm">
              현재 교환 가능한 리워드가 없습니다
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {catalog.map((reward) => {
                const outOfStock = reward.stock !== null && reward.stock <= 0
                const pointsShort = Math.max(0, reward.point_cost - balance)
                const canRedeem = canUsePoints && pointsShort === 0
                const progressPct = Math.min(100, Math.round((balance / reward.point_cost) * 100))

                return (
                  <div key={reward.id} className={`overflow-hidden rounded-2xl bg-white/70 shadow-sm backdrop-blur-sm ${
                    outOfStock ? 'opacity-50' : ''
                  }`}>
                    {/* 이미지 우선 노출 */}
                    <div className="relative flex aspect-square w-full items-center justify-center bg-[#00C7A7]/10">
                      {reward.image_url ? (
                        <img src={reward.image_url} alt={reward.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-5xl">{REWARD_TYPE_ICONS[reward.reward_type ?? 'free_item']}</span>
                      )}
                      {reward.requires_verification && (
                        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                          매장에서 확인 후 지급
                        </span>
                      )}
                      {outOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-bold text-white">
                          품절
                        </span>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="truncate text-sm font-semibold text-[#222222]">{reward.name}</p>
                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-[#00947A]">{reward.point_cost.toLocaleString()}P</p>
                        {reward.reward_type === 'discount' && reward.discount_amount ? (
                          <span className="text-[11px] font-bold text-orange-500">{reward.discount_amount.toLocaleString()}원 할인</span>
                        ) : null}
                      </div>
                      {reward.stock !== null && !outOfStock && (
                        <p className="mt-0.5 text-[11px] text-[#222222]/40">잔여 {reward.stock}개</p>
                      )}

                      {/* 진행률 게이지 — 부족하면 남은 포인트, 충분하면 바로 받을 수 있다는 문구 */}
                      {!outOfStock && (
                        <RewardGauge percent={progressPct} sufficient={pointsShort === 0} pointsShort={pointsShort} />
                      )}

                      <button
                        onClick={() => handleRedeem(reward)}
                        disabled={!canRedeem || outOfStock || redeeming === reward.id}
                        className={`mt-2.5 w-full rounded-lg py-2 text-xs font-bold transition-colors ${
                          canRedeem && !outOfStock
                            ? 'bg-[#00C7A7] text-white hover:bg-[#00B399]'
                            : 'cursor-not-allowed bg-[#222222]/8 text-[#222222]/35'
                        } disabled:opacity-50`}
                      >
                        {redeeming === reward.id ? '처리 중...' : '교환하기'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 포인트 내역 */}
        {history.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-bold text-[#222222]/70">포인트 내역</h2>
            <div className="divide-y divide-[#222222]/8 rounded-xl bg-white/70 shadow-sm backdrop-blur-sm">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-[#222222]/70">{h.type === 'earn' ? '게임 참여 적립' : '리워드 교환'}</p>
                    <p className="text-xs text-[#222222]/35">{new Date(h.created_at).toLocaleDateString('ko-KR')}</p>
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
      <div className="flex min-h-screen items-center justify-center bg-[#EFE6D6]">
        <p className="text-sm text-[#222222]/45">불러오는 중...</p>
      </div>
    }>
      <PointsContent />
    </Suspense>
  )
}
