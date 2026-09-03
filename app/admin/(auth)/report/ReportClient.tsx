'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { AdminRole } from '@/lib/admin/session'
import MiniLineChart from '@/components/admin/MiniLineChart'

interface FunnelStep { value: number; momPercent: number | null }

interface ReportData {
  storeId: string
  storeName: string
  year: number
  month: number
  avgOrderValue: number
  returningVisitors: number
  headline: { multiple: number | null }
  funnel: {
    participants: FunnelStep
    couponsIssued: FunnelStep
    couponsUsed: FunnelStep
  }
  conversion: { cohortCount: number; convertedCount: number }
  daangnAsset: { cumulative: number; newThisMonth: number }
  growthTrajectory: {
    points: { label: string; value: number }[]
    hasAnyData: boolean
    hasEnoughData: boolean
    projection: number | null
  }
  popularTimeSlot: { dow: number; hour: number; count: number } | null
}

interface Store { store_id: string; store_name: string }

const DOW_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

function periodLabel(hour: number): string {
  if (hour < 6) return '새벽'
  if (hour < 11) return '아침'
  if (hour < 14) return '점심'
  if (hour < 18) return '오후'
  if (hour < 22) return '저녁'
  return '밤'
}

function MomBadge({ percent }: { percent: number | null }) {
  if (percent === null) return null
  const positive = percent >= 0
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
      positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'
    }`}>
      전월 대비 {positive ? '+' : ''}{percent}%
    </span>
  )
}

function FunnelRow({ step, label, value, sub, badge }: {
  step: number; label: string; value: string; sub?: string; badge?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white border border-gray-100">
      <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold shrink-0">{step}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-5 py-5">
      <p className="text-xs font-bold text-orange-500 mb-2">{title}</p>
      {children}
    </div>
  )
}

const now = new Date()

interface ReportClientProps {
  role: AdminRole
  storeId?: string | null
  /** 대시보드 "성과 리포트" 탭에 임베드될 때 true — 전체 페이지 래퍼/고정 헤더를 제거하고 탭 안에 맞는 컴팩트 레이아웃으로 표시 */
  embedded?: boolean
}

export default function ReportClient({ role, storeId, embedded = false }: ReportClientProps) {
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  // advertiser: 세션 storeId 자동 선택, 그 외: 빈 상태로 시작
  const [selectedStore, setSelectedStore] = useState(role === 'advertiser' && storeId ? storeId : '')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  const canSearchStores = role === 'super_admin' || role === 'agency'

  useEffect(() => {
    if (role === 'advertiser') return // advertiser는 자기 매장 고정
    fetch('/api/admin/stores')
      .then((r) => r.json())
      .then((json) => {
        const list: Store[] = json.stores ?? []
        setStores(list)
        setFilteredStores(list)
      })
      .catch(() => setError('매장 목록 조회 실패'))
  }, [role])

  // 검색 필터링 (agency/super_admin만)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStores(stores)
    } else {
      const q = searchQuery.toLowerCase()
      setFilteredStores(stores.filter(s =>
        s.store_name.toLowerCase().includes(q) || s.store_id.toLowerCase().includes(q)
      ))
    }
  }, [searchQuery, stores])

  const fetchReport = useCallback(async () => {
    if (!selectedStore) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin/report?store_id=${encodeURIComponent(selectedStore)}&year=${year}&month=${month}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '조회 실패'); return }
      setData(json)
    } catch { setError('네트워크 오류') }
    finally { setLoading(false) }
  }, [selectedStore, year, month])

  useEffect(() => { if (selectedStore) fetchReport() }, [fetchReport, selectedStore])

  function handlePrint() {
    window.print()
  }

  const couponUseRate = data && data.funnel.couponsIssued.value > 0
    ? Math.round((data.funnel.couponsUsed.value / data.funnel.couponsIssued.value) * 1000) / 10 : 0

  const conversionRate = data && data.conversion.cohortCount > 0
    ? Math.round((data.conversion.convertedCount / data.conversion.cohortCount) * 100) : null

  const monthSelect = (
    <select
      value={`${year}-${month}`}
      onChange={(e) => {
        const [y, m] = e.target.value.split('-').map(Number)
        setYear(y); setMonth(m)
      }}
      className="shrink-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-orange-500"
    >
      {Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        return (
          <option key={i} value={`${d.getFullYear()}-${d.getMonth() + 1}`}>
            {d.getFullYear()}년 {d.getMonth() + 1}월
          </option>
        )
      })}
    </select>
  )

  const printCss = (
    <style>{`
      @media print {
        nav, .no-print { display: none !important; }
        body { background: white; }
        .print-area { padding: 0; }
      }
    `}</style>
  )

  const pdfButton = (
    <button
      onClick={handlePrint}
      className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors shrink-0"
    >
      📄 PDF 저장
    </button>
  )

  // 대시보드 탭 안에 임베드될 때는 전체 페이지 래퍼/고정 헤더 없이 컴팩트 컨트롤바만 보여준다
  if (embedded) {
    return (
      <div>
        {printCss}
        <div className="flex items-center justify-between gap-3 mb-4 no-print">
          {monthSelect}
          {pdfButton}
        </div>
        <div ref={printRef} className="space-y-3 print-area">
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm font-semibold no-print">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm no-print">불러오는 중...</div>
          ) : data ? (
            <>
              <div className="px-1 pb-1">
              <p className="text-lg font-bold text-gray-900">{data.storeName} — {data.year}년 {data.month}월 성과 리포트</p>
            </div>

            {/* ① 헤드라인 */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl px-6 py-8 text-white shadow-lg text-center">
              <p className="text-xs font-bold text-orange-100 mb-2 tracking-wide">이번 달 성과</p>
              {data.headline.multiple !== null && data.headline.multiple >= 1 ? (
                <>
                  <p className="text-xl font-bold leading-snug">
                    이번 달 {data.storeName}은<br />
                    구독료의 <span className="text-4xl font-black">{data.headline.multiple}배</span> 가치를 만들어냈어요
                  </p>
                  <p className="text-xs text-orange-100 mt-3">
                    재방문 {data.returningVisitors.toLocaleString()}명 × 객단가 {data.avgOrderValue.toLocaleString()}원 기준
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold">아직 데이터가 쌓이는 중이에요</p>
                  <p className="text-xs text-orange-100 mt-2">
                    {data.avgOrderValue <= 0
                      ? '포인트 정책 화면에서 평균 결제금액(객단가)을 입력하면 정확한 성과를 보여드려요.'
                      : '재방문 손님이 더 쌓이면 정확한 가치를 보여드릴게요.'}
                  </p>
                </>
              )}
            </div>

            {/* ② 활동 퍼널 */}
            <FunnelRow
              step={1} label="게임 참여자"
              value={`${data.funnel.participants.value.toLocaleString()}명`}
              badge={<MomBadge percent={data.funnel.participants.momPercent} />}
            />
            <div className="text-center text-gray-300 text-lg">↓</div>
            <FunnelRow
              step={2} label="쿠폰 발급"
              value={`${data.funnel.couponsIssued.value.toLocaleString()}건`}
              badge={<MomBadge percent={data.funnel.couponsIssued.momPercent} />}
            />
            <div className="text-center text-gray-300 text-lg">↓</div>
            <FunnelRow
              step={3} label="쿠폰 사용"
              value={`${data.funnel.couponsUsed.value.toLocaleString()}건`}
              sub={data.funnel.couponsIssued.value > 0 ? `사용률 ${couponUseRate}%` : undefined}
              badge={<MomBadge percent={data.funnel.couponsUsed.momPercent} />}
            />

            {/* ③ 단골 전환 스토리 */}
            <SectionCard title="단골 전환 스토리">
              {data.conversion.cohortCount > 0 ? (
                <>
                  <p className="text-base text-gray-800 leading-relaxed">
                    지난달 신규 가입한 손님 <b>{data.conversion.cohortCount}명</b> 중,{' '}
                    <b className="text-orange-600">{data.conversion.convertedCount}명</b>이 이번 달에도 다시 찾아주셔서
                    활성 손님이 됐어요{conversionRate !== null ? ` (전환율 ${conversionRate}%)` : ''}.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">※ 최초 가입 시점과 최근 방문 기록을 기준으로 한 근사치예요.</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">아직 비교할 신규 가입 데이터가 충분하지 않아요.</p>
              )}
            </SectionCard>

            {/* ④ 당근 단골 자산가치 */}
            <SectionCard title="당근 단골 자산가치">
              <p className="text-base text-gray-800 leading-relaxed">
                누적 당근 단골 클릭 <b>{data.daangnAsset.cumulative.toLocaleString()}명</b> — 다음 소식을 올리면
                자동으로 <b>{data.daangnAsset.cumulative.toLocaleString()}명</b>에게 알림이 가요
              </p>
              <p className="text-sm text-orange-600 font-semibold mt-1">
                이번 달에만 {data.daangnAsset.newThisMonth.toLocaleString()}명이 늘었어요
              </p>
              <p className="text-xs text-gray-400 mt-2">※ 클릭 기준(실제 단골추가 확정 아님)</p>
            </SectionCard>

            {/* ⑤ 성장 궤적 */}
            {data.growthTrajectory.hasAnyData && (
              <SectionCard title="성장 궤적">
                <MiniLineChart data={data.growthTrajectory.points} color="#f97316" height={140} />
                {data.growthTrajectory.hasEnoughData ? (
                  <>
                    <p className="text-sm text-gray-800 mt-3">
                      이 속도가 유지된다면, 3개월 후 예상 누적 당근 단골: 약{' '}
                      <b className="text-orange-600">{data.growthTrajectory.projection?.toLocaleString()}명</b>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ※ 현재 추세를 단순 반영한 예상치이며, 실제 결과와 다를 수 있어요.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 mt-3">데이터가 더 쌓이면 예상치를 보여드릴게요.</p>
                )}
              </SectionCard>
            )}

              {/* ⑥ 인기 시간대 */}
              {data.popularTimeSlot && (
                <SectionCard title="인기 시간대">
                  <p className="text-base text-gray-800">
                    <b>
                      {DOW_LABELS[data.popularTimeSlot.dow]} {periodLabel(data.popularTimeSlot.hour)}{' '}
                      {data.popularTimeSlot.hour}시~{data.popularTimeSlot.hour + 1}시
                    </b>
                    에 참여가 가장 많아요
                  </p>
                </SectionCard>
              )}
            </>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 인쇄용 CSS */}
      {printCss}

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-10 no-print">
        <div className="max-w-xl mx-auto space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-gray-900">성과 리포트</h1>
            {pdfButton}
          </div>

          {/* 업체명 검색 (agency/super_admin만) */}
          {canSearchStores && (
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="업체명 또는 매장 ID로 검색..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-orange-500"
            />
          )}

          <div className="flex gap-2">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-orange-500"
            >
              {filteredStores.map((s) => (
                <option key={s.store_id} value={s.store_id}>{s.store_name || s.store_id}</option>
              ))}
              {filteredStores.length === 0 && <option value="">검색 결과 없음</option>}
            </select>
            {monthSelect}
          </div>
        </div>
      </div>

      {/* 리포트 본문 (인쇄 대상) */}
      <div ref={printRef} className="max-w-xl mx-auto px-4 py-6 space-y-3 print-area">
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm font-semibold no-print">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm no-print">불러오는 중...</div>
        ) : data ? (
          <>
            <div className="px-1 pb-1">
              <p className="text-lg font-bold text-gray-900">{data.storeName} — {data.year}년 {data.month}월 성과 리포트</p>
            </div>

            {/* ① 헤드라인 */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl px-6 py-8 text-white shadow-lg text-center">
              <p className="text-xs font-bold text-orange-100 mb-2 tracking-wide">이번 달 성과</p>
              {data.headline.multiple !== null && data.headline.multiple >= 1 ? (
                <>
                  <p className="text-xl font-bold leading-snug">
                    이번 달 {data.storeName}은<br />
                    구독료의 <span className="text-4xl font-black">{data.headline.multiple}배</span> 가치를 만들어냈어요
                  </p>
                  <p className="text-xs text-orange-100 mt-3">
                    재방문 {data.returningVisitors.toLocaleString()}명 × 객단가 {data.avgOrderValue.toLocaleString()}원 기준
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold">아직 데이터가 쌓이는 중이에요</p>
                  <p className="text-xs text-orange-100 mt-2">
                    {data.avgOrderValue <= 0
                      ? '포인트 정책 화면에서 평균 결제금액(객단가)을 입력하면 정확한 성과를 보여드려요.'
                      : '재방문 손님이 더 쌓이면 정확한 가치를 보여드릴게요.'}
                  </p>
                </>
              )}
            </div>

            {/* ② 활동 퍼널 */}
            <FunnelRow
              step={1} label="게임 참여자"
              value={`${data.funnel.participants.value.toLocaleString()}명`}
              badge={<MomBadge percent={data.funnel.participants.momPercent} />}
            />
            <div className="text-center text-gray-300 text-lg">↓</div>
            <FunnelRow
              step={2} label="쿠폰 발급"
              value={`${data.funnel.couponsIssued.value.toLocaleString()}건`}
              badge={<MomBadge percent={data.funnel.couponsIssued.momPercent} />}
            />
            <div className="text-center text-gray-300 text-lg">↓</div>
            <FunnelRow
              step={3} label="쿠폰 사용"
              value={`${data.funnel.couponsUsed.value.toLocaleString()}건`}
              sub={data.funnel.couponsIssued.value > 0 ? `사용률 ${couponUseRate}%` : undefined}
              badge={<MomBadge percent={data.funnel.couponsUsed.momPercent} />}
            />

            {/* ③ 단골 전환 스토리 */}
            <SectionCard title="단골 전환 스토리">
              {data.conversion.cohortCount > 0 ? (
                <>
                  <p className="text-base text-gray-800 leading-relaxed">
                    지난달 신규 가입한 손님 <b>{data.conversion.cohortCount}명</b> 중,{' '}
                    <b className="text-orange-600">{data.conversion.convertedCount}명</b>이 이번 달에도 다시 찾아주셔서
                    활성 손님이 됐어요{conversionRate !== null ? ` (전환율 ${conversionRate}%)` : ''}.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">※ 최초 가입 시점과 최근 방문 기록을 기준으로 한 근사치예요.</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">아직 비교할 신규 가입 데이터가 충분하지 않아요.</p>
              )}
            </SectionCard>

            {/* ④ 당근 단골 자산가치 */}
            <SectionCard title="당근 단골 자산가치">
              <p className="text-base text-gray-800 leading-relaxed">
                누적 당근 단골 클릭 <b>{data.daangnAsset.cumulative.toLocaleString()}명</b> — 다음 소식을 올리면
                자동으로 <b>{data.daangnAsset.cumulative.toLocaleString()}명</b>에게 알림이 가요
              </p>
              <p className="text-sm text-orange-600 font-semibold mt-1">
                이번 달에만 {data.daangnAsset.newThisMonth.toLocaleString()}명이 늘었어요
              </p>
              <p className="text-xs text-gray-400 mt-2">※ 클릭 기준(실제 단골추가 확정 아님)</p>
            </SectionCard>

            {/* ⑤ 성장 궤적 */}
            {data.growthTrajectory.hasAnyData && (
              <SectionCard title="성장 궤적">
                <MiniLineChart data={data.growthTrajectory.points} color="#f97316" height={140} />
                {data.growthTrajectory.hasEnoughData ? (
                  <>
                    <p className="text-sm text-gray-800 mt-3">
                      이 속도가 유지된다면, 3개월 후 예상 누적 당근 단골: 약{' '}
                      <b className="text-orange-600">{data.growthTrajectory.projection?.toLocaleString()}명</b>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ※ 현재 추세를 단순 반영한 예상치이며, 실제 결과와 다를 수 있어요.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 mt-3">데이터가 더 쌓이면 예상치를 보여드릴게요.</p>
                )}
              </SectionCard>
            )}

            {/* ⑥ 인기 시간대 */}
            {data.popularTimeSlot && (
              <SectionCard title="인기 시간대">
                <p className="text-base text-gray-800">
                  <b>
                    {DOW_LABELS[data.popularTimeSlot.dow]} {periodLabel(data.popularTimeSlot.hour)}{' '}
                    {data.popularTimeSlot.hour}시~{data.popularTimeSlot.hour + 1}시
                  </b>
                  에 참여가 가장 많아요
                </p>
              </SectionCard>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
