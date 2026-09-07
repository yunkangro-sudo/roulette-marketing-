/**
 * 경품 확률 자동 재조정 — 매일 자정(KST) 배치 본체
 * (호출부: app/api/cron/probability-rebalance/route.ts)
 *
 * 이벤트 등록/티어 수정 시점 계산(lib/game-engine/probability.ts의 기존 함수들)은
 * "총 준비 수량 ÷ 전체 기간 예상 참여자"로 한 번 고정한다. 이 파일은 그 대신
 * 매일 "잔여 수량 ÷ 남은 기간 실측 기반 예상 참여자"로 다시 계산해서
 * prize_tiers.computed_probability를 덮어쓴다. 하루 안에서는 갱신하지 않으므로
 * (배치는 자정 1번만 실행) 같은 날 온 손님끼리는 항상 같은 확률을 본다.
 *
 * 적용 대상: prize_tier_mode = 'quantity' 이벤트만. 확률을 직접 입력하는
 * 'percent' 모드는 사장님이 입력한 값을 그대로 존중하고 자동 재조정 대상에서 제외한다.
 */
import type { createServerClient } from '@/lib/supabase/server'
import { computeTierProbabilitiesFromRemaining } from './probability'
import { resolveCycle, diffDays, type ResetCycle } from './longTermCycle'

type Supabase = ReturnType<typeof createServerClient>

export interface RebalanceEventRow {
  id: string
  store_id: string
  display_start_date: string
  display_end_date: string
  expected_daily_participants: number
  prize_tier_mode: string
  long_term_mode: boolean
  reset_cycle: ResetCycle | null
  current_cycle_start: string | null
}

export interface RebalanceResult {
  eventId: string
  skipped?: 'percent_mode' | 'no_tiers'
  cycleReset?: boolean
  measuredDailyAverage?: number
  usedFallback?: boolean
  updatedTiers?: number
  error?: string
}

/** KST 기준 오늘 날짜 문자열 (YYYY-MM-DD) */
export function kstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/**
 * 지난 3일 미만이면(데이터 부족으로 왜곡 위험) 사장님이 입력한 예상치를 쓰고,
 * 그 이상이면 activity_log의 실제 게임 시작(game_start) 건수로 일평균을 낸다.
 * game_start는 재고 차감(remaining_quantity -1)과 정확히 같은 시점에 기록되므로
 * (lib/game/persistPlayResult.ts) 확률 소진 속도와 가장 정확히 대응하는 지표다.
 */
async function computeMeasuredDailyAverage(
  supabase: Supabase,
  params: { eventId: string; effectiveStart: string; today: string; elapsedDays: number; fallback: number }
): Promise<{ value: number; usedFallback: boolean }> {
  const { eventId, effectiveStart, today, elapsedDays, fallback } = params
  if (elapsedDays < 3) {
    return { value: Math.max(0, fallback), usedFallback: true }
  }

  const { count, error } = await supabase
    .from('activity_log')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'game_start')
    .eq('ref_id', eventId)
    .gte('occurred_at', `${effectiveStart}T00:00:00+09:00`)
    .lt('occurred_at', `${today}T00:00:00+09:00`)

  if (error) {
    // 실측 조회 실패 시 예상치로 안전하게 폴백 (배치 전체를 실패시키지 않음)
    console.warn(`[dailyRebalance] activity_log 조회 실패(event=${eventId}):`, error.message)
    return { value: Math.max(0, fallback), usedFallback: true }
  }

  return { value: (count ?? 0) / elapsedDays, usedFallback: false }
}

/** 장기 운영 이벤트의 주기 리셋 처리 — remaining_quantity를 total_quantity로 리필하고 current_cycle_start를 갱신 */
async function resetCycleStock(supabase: Supabase, eventId: string, newCycleStart: string): Promise<void> {
  const { data: tiers } = await supabase
    .from('prize_tiers')
    .select('id, total_quantity')
    .eq('event_id', eventId)

  for (const t of tiers ?? []) {
    await supabase.from('prize_tiers').update({ remaining_quantity: t.total_quantity }).eq('id', t.id)
  }

  await supabase.from('events').update({ current_cycle_start: newCycleStart }).eq('id', eventId)
}

/** 이벤트 1개에 대한 확률 재조정. 리셋 여부·측정치·갱신 개수를 반환해서 배치 로그로 남긴다. */
export async function rebalanceEvent(
  supabase: Supabase,
  event: RebalanceEventRow,
  today: string
): Promise<RebalanceResult> {
  if (event.prize_tier_mode !== 'quantity') {
    return { eventId: event.id, skipped: 'percent_mode' }
  }

  let effectiveStart = event.display_start_date
  let effectiveEnd = event.display_end_date
  let cycleReset = false

  if (event.long_term_mode && event.reset_cycle) {
    const cycleStartBase = event.current_cycle_start ?? event.display_start_date
    const bounds = resolveCycle({
      today,
      currentCycleStart: cycleStartBase,
      resetCycle: event.reset_cycle,
      displayEndDate: event.display_end_date,
    })
    effectiveStart = bounds.cycleStart
    effectiveEnd = bounds.cycleEnd
    cycleReset = bounds.didReset

    if (cycleReset) {
      // 리셋은 "새로운 추첨을 위한 재고·확률"에만 적용된다 — 이미 발급된(issued 계열) 쿠폰은
      // coupons 테이블의 독립된 row라서 remaining_quantity를 건드려도 전혀 영향받지 않는다.
      await resetCycleStock(supabase, event.id, bounds.cycleStart)
    }
  }

  const elapsedDays = Math.max(0, diffDays(today, effectiveStart))
  // 남은 일수는 최소 1일 — 오늘 하루도 남은 기간에 포함, 0으로 나누기 방지
  const remainingDays = Math.max(1, diffDays(effectiveEnd, today) + 1)

  const { value: measuredDailyAverage, usedFallback } = await computeMeasuredDailyAverage(supabase, {
    eventId: event.id,
    effectiveStart,
    today,
    elapsedDays,
    fallback: event.expected_daily_participants,
  })

  const expectedRemainingParticipants = measuredDailyAverage * remainingDays

  const { data: tiers, error: tiersError } = await supabase
    .from('prize_tiers')
    .select('id, remaining_quantity')
    .eq('event_id', event.id)

  if (tiersError) {
    return { eventId: event.id, error: `티어 조회 실패: ${tiersError.message}`, cycleReset }
  }
  if (!tiers || tiers.length === 0) {
    return { eventId: event.id, skipped: 'no_tiers', cycleReset }
  }

  const probabilities = computeTierProbabilitiesFromRemaining(
    tiers.map((t) => t.remaining_quantity),
    expectedRemainingParticipants
  )

  for (let i = 0; i < tiers.length; i++) {
    const { error: updateError } = await supabase
      .from('prize_tiers')
      .update({ computed_probability: probabilities[i] })
      .eq('id', tiers[i].id)
    if (updateError) {
      console.warn(`[dailyRebalance] computed_probability 갱신 실패(tier=${tiers[i].id}):`, updateError.message)
    }
  }

  return {
    eventId: event.id,
    cycleReset,
    measuredDailyAverage,
    usedFallback,
    updatedTiers: tiers.length,
  }
}

export interface RebalanceBatchSummary {
  executed_at: string
  kst_date: string
  total: number
  results: RebalanceResult[]
}

/**
 * 배치 진입점 — status='active'이면서 오늘이 노출 기간 안에 있는 이벤트 전체를 대상으로 한다.
 * (종료됐거나 시작 전인 이벤트는 조건에서 자연히 제외됨)
 */
export async function runDailyRebalanceBatch(supabase: Supabase): Promise<RebalanceBatchSummary> {
  const today = kstToday()

  const { data: events, error } = await supabase
    .from('events')
    .select(
      'id, store_id, display_start_date, display_end_date, expected_daily_participants, prize_tier_mode, long_term_mode, reset_cycle, current_cycle_start'
    )
    .eq('status', 'active')
    .lte('display_start_date', today)
    .gte('display_end_date', today)

  if (error) {
    throw new Error(`대상 이벤트 조회 실패: ${error.message}`)
  }

  const results: RebalanceResult[] = []
  for (const event of (events ?? []) as RebalanceEventRow[]) {
    try {
      results.push(await rebalanceEvent(supabase, event, today))
    } catch (err) {
      results.push({ eventId: event.id, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return {
    executed_at: new Date().toISOString(),
    kst_date: today,
    total: events?.length ?? 0,
    results,
  }
}
