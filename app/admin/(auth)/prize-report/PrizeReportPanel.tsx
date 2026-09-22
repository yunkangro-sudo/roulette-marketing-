import { requireAdminAuth } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UNLIMITED_TIER_QUANTITY } from '@/lib/game-engine/probability'

/** KST(UTC+9) 기준 오늘 날짜를 "YYYY-MM-DD"로 반환 (이벤트 display_start/end_date는 date 컬럼) */
function todayKst(): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

/** "YYYY-MM-DD" → "YYYY.MM.DD" */
function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return dateStr.slice(0, 10).replace(/-/g, '.')
}

/** 오늘 기준 노출 종료일까지 남은 일수 라벨 */
function daysLeftLabel(endDate: string): string {
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00+09:00`).getTime()
  const now = new Date(`${todayKst()}T00:00:00+09:00`).getTime()
  const diff = Math.round((end - now) / (1000 * 60 * 60 * 24))
  if (diff < 0) return '종료됨'
  if (diff === 0) return '오늘 마지막 날'
  return `D-${diff}`
}

type ChallengeFrequency = 'daily' | 'custom' | 'unlimited'

function challengeFrequencyLabel(freq: ChallengeFrequency | null | undefined, days: number | null | undefined): string {
  if (freq === 'unlimited') return '무제한 (횟수 제한 없음)'
  if (freq === 'custom') return `${days ?? '?'}일마다 1회`
  return '1일 1회'
}

function couponValidityLabel(type: string | null | undefined, value: string | null | undefined): string {
  if (!type || !value) return '-'
  if (type === 'fixed_date' && value.includes('~')) {
    const [start, end] = value.split('~')
    return `${fmtDate(start)} ~ ${fmtDate(end)} (고정 기간)`
  }
  if (type === 'relative_days') return `발급일로부터 ${value}일간`
  return value
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:    { label: '진행중', color: 'bg-green-100 text-green-700' },
  scheduled: { label: '예정됨', color: 'bg-blue-100 text-blue-700' },
  paused:    { label: '일시중지', color: 'bg-yellow-100 text-yellow-700' },
  ended:     { label: '종료됨', color: 'bg-gray-100 text-gray-500' },
  draft:     { label: '초안', color: 'bg-gray-100 text-gray-400' },
}

const REWARD_TYPE_LABELS: Record<string, string> = {
  free_item:      '무료 상품',
  discount:       '할인 쿠폰',
  points:         '포인트 추가',
  experience:     '체험 서비스',
  special_coupon: '특별 쿠폰',
  vip_reward:     'VIP 전용',
}

interface PrizeTierRow {
  id: string
  label: string
  amount: number
  total_quantity: number
  remaining_quantity: number
  computed_probability: number
  requires_verification: boolean
  sort_order: number | null
}

interface RewardRow {
  id: string
  name: string
  reward_type: string
  point_cost: number
  active: boolean
  stock: number | null
  requires_verification: boolean
  start_at: string | null
  end_at: string | null
}

export async function PrizeReportPanel({ embedded = false }: { embedded?: boolean }) {
  const account = await requireAdminAuth()

  // 이 리포트는 "광고주(매장) 전용" 화면 — 대리접속 중인 super_admin/agency는
  // getEffectiveAccount()에서 이미 role이 'advertiser'로 바뀌어 들어오므로 통과된다.
  // 대리접속 없이 들어온 super_admin/agency는 매장 컨텍스트가 없어 접근할 수 없다.
  if (account.role !== 'advertiser' || !account.storeId) {
    redirect('/admin/super/dashboard')
  }

  const storeId = account.storeId
  const supabase = createServerClient()
  const today = todayKst()

  const [activeEventRes, firstEventRes, rewardsRes, loyaltyRes, storeSettingsRes] = await Promise.all([
    supabase
      .from('events')
      .select('*, prize_tiers(*)')
      .eq('store_id', storeId)
      .eq('status', 'active')
      .lte('display_start_date', today)
      .gte('display_end_date', today)
      .order('created_at', { ascending: false })
      .order('sort_order', { referencedTable: 'prize_tiers', ascending: true })
      .limit(1),
    supabase
      .from('events')
      .select('created_at')
      .eq('store_id', storeId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('reward_catalog')
      .select('id, name, reward_type, point_cost, active, stock, requires_verification, start_at, end_at')
      .eq('store_id', storeId)
      .order('active', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('loyalty_settings').select('*').eq('store_id', storeId).maybeSingle(),
    supabase
      .from('store_settings')
      .select('store_name, points_enabled, average_order_value')
      .eq('store_id', storeId)
      .maybeSingle(),
  ])

  const event = activeEventRes.data?.[0] ?? null
  const tiers: PrizeTierRow[] = (event?.prize_tiers ?? []).slice().sort(
    (a: PrizeTierRow, b: PrizeTierRow) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )
  const rewards: RewardRow[] = rewardsRes.data ?? []
  const firstEventDate = firstEventRes.data?.created_at ?? null

  const storeName = storeSettingsRes.data?.store_name ?? storeId
  const pointsEnabled = storeSettingsRes.data?.points_enabled !== false
  const avgOrderValue = storeSettingsRes.data?.average_order_value ?? 0

  const loyalty = loyaltyRes.data ?? { point_per_visit: 10, usage_threshold: 100, point_expiry_days: null }
  const visitsNeeded =
    loyalty.point_per_visit > 0 ? Math.ceil(loyalty.usage_threshold / loyalty.point_per_visit) : null

  const tierMode: 'quantity' | 'percent' = event?.prize_tier_mode === 'percent' ? 'percent' : 'quantity'
  const longTermMode = tierMode === 'quantity' && !!event?.long_term_mode
  const resetCycleLabel = event?.reset_cycle === 'monthly' ? '매월 리셋' : '매주 리셋'
  const probabilitySum = tiers.reduce((sum, t) => sum + (t.computed_probability ?? 0), 0)
  const hasSoldOutTier = tiers.some((t) => t.remaining_quantity <= 0 && t.amount > 0)

  const s = event ? (STATUS_LABEL[event.status] ?? { label: event.status, color: 'bg-gray-100 text-gray-500' }) : null

  return (
    <div className={embedded ? 'space-y-6' : 'max-w-3xl mx-auto px-4 py-8 space-y-6'}>
      {/* 헤더 — 대시보드 탭 안에서는 제목을 반복하지 않고 매장명·조회시각만 보여준다 */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          {!embedded && <h1 className="text-xl font-bold text-gray-900">경품 세팅 현황 리포트</h1>}
          <p className={embedded ? 'text-sm font-semibold text-gray-700' : 'text-sm text-gray-500 mt-1'}>{storeName}</p>
        </div>
        <p className="text-xs text-gray-400">조회 시각: {new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} 기준</p>
      </div>

      {!event ? (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
          현재 노출 기간 안에 진행 중인 이벤트가 없습니다.
          <br />
          이벤트를 등록·활성화하면 이 화면에 세팅 현황이 표시됩니다.
        </div>
      ) : (
        <>
          {/* A. 이벤트 기본 정보 */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">A. 이벤트 기본 정보</h2>
              {s && <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow label="이벤트명" value={event.name} />
              <InfoRow
                label="노출 기간"
                value={`${fmtDate(event.display_start_date)} ~ ${fmtDate(event.display_end_date)}`}
                sub={daysLeftLabel(event.display_end_date)}
              />
              <InfoRow label="도전 방식" value={challengeFrequencyLabel(event.challenge_frequency, event.challenge_frequency_days)} />
              <InfoRow label="예상 일 참여자 수" value={`${event.expected_daily_participants ?? 0}명 / 일`} />
              <InfoRow label="쿠폰 사용 기간" value={couponValidityLabel(event.coupon_validity_type, event.coupon_validity_value)} />
              <InfoRow label="매장 첫 세팅일" value={fmtDate(firstEventDate)} />
            </div>

            {event.coupon_usage_notice && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700 leading-relaxed">
                쿠폰 사용 안내: {event.coupon_usage_notice}
              </div>
            )}
          </section>

          {/* B. 경품 티어 구성 */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 flex-wrap">
              <h2 className="text-sm font-bold text-gray-900">B. 경품 티어 구성</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                  {tierMode === 'percent' ? '확률 직접 입력' : '수량 기반 (자동 확률)'}
                </span>
                {tierMode === 'quantity' && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${longTermMode ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {longTermMode ? `장기운영 ON · ${resetCycleLabel}` : '장기운영 OFF (단발성)'}
                  </span>
                )}
              </div>
            </div>

            {hasSoldOutTier && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs font-semibold text-red-600">
                재고가 소진된 티어가 있습니다 — 해당 티어는 당첨 시 자동으로 &ldquo;꽝&rdquo; 처리됩니다.
              </div>
            )}

            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="px-2 py-2 font-medium">티어</th>
                    <th className="px-2 py-2 font-medium text-right">금액</th>
                    <th className="px-2 py-2 font-medium text-right">준비 수량</th>
                    <th className="px-2 py-2 font-medium text-right">남은 수량</th>
                    <th className="px-2 py-2 font-medium text-right">당첨 확률</th>
                    <th className="px-2 py-2 font-medium text-center">확인 필요</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((t) => {
                    const unlimited = t.total_quantity >= UNLIMITED_TIER_QUANTITY
                    return (
                      <tr key={t.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-2 py-2.5 font-semibold text-gray-800">{t.label}</td>
                        <td className="px-2 py-2.5 text-right text-gray-600">{t.amount.toLocaleString()}원</td>
                        <td className="px-2 py-2.5 text-right text-gray-600">{unlimited ? '무제한' : `${t.total_quantity.toLocaleString()}개`}</td>
                        <td className={`px-2 py-2.5 text-right font-semibold ${!unlimited && t.remaining_quantity <= 0 ? 'text-red-500' : 'text-gray-600'}`}>
                          {unlimited ? '무제한' : `${t.remaining_quantity.toLocaleString()}개`}
                        </td>
                        <td className="px-2 py-2.5 text-right font-bold text-orange-500">{t.computed_probability.toFixed(2)}%</td>
                        <td className="px-2 py-2.5 text-center">{t.requires_verification ? '✅' : '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className={`text-xs text-right font-medium ${Math.abs(probabilitySum - 100) > 0.5 ? 'text-red-500' : 'text-gray-400'}`}>
              확률 합계: {probabilitySum.toFixed(2)}%
            </p>
          </section>

          {/* C. 리워드 카탈로그 */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100">C. 리워드 카탈로그</h2>

            {rewards.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">등록된 리워드가 없습니다</p>
            ) : (
              <div className="space-y-2.5">
                {rewards.map((r) => {
                  const exposure = r.start_at || r.end_at
                    ? `기간한정 (${fmtDate(r.start_at)} ~ ${fmtDate(r.end_at)})`
                    : '상시 노출'
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {r.active ? '활성' : '비활성'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {REWARD_TYPE_LABELS[r.reward_type] ?? r.reward_type} · {exposure}
                          {r.requires_verification ? ' · 관리자 확인 필요' : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-orange-500">{r.point_cost.toLocaleString()}P</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.stock === null ? '재고 무제한' : `재고 ${r.stock.toLocaleString()}개`}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* D. 포인트 정책 */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">D. 포인트 정책</h2>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pointsEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {pointsEnabled ? '적립 사용 중' : '적립 꺼짐'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow label="방문 1회당 적립" value={`${loyalty.point_per_visit.toLocaleString()}P`} />
              <InfoRow
                label="리워드 사용 가능 최소 잔액"
                value={`${loyalty.usage_threshold.toLocaleString()}P 이상`}
                sub={pointsEnabled && visitsNeeded !== null ? `약 ${visitsNeeded}번 방문 시 사용 가능` : undefined}
              />
              <InfoRow label="포인트 유효기간" value={loyalty.point_expiry_days ? `${loyalty.point_expiry_days}일` : '무제한'} />
              <InfoRow label="평균 결제금액 (객단가)" value={avgOrderValue ? `${Number(avgOrderValue).toLocaleString()}원` : '미입력'} />
            </div>
          </section>
        </>
      )}

      <p className="text-center text-xs text-gray-400 pt-2">
        본 리포트는 조회 시점 기준 스냅샷이며, 이후 설정 변경 사항은 반영되지 않을 수 있습니다.
      </p>
    </div>
  )
}

function InfoRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-semibold text-gray-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs font-semibold text-orange-500 mt-0.5">{sub}</p>}
    </div>
  )
}
