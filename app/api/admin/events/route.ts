import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession, getAllowedStoreId } from '@/lib/admin/session'
import {
  computeExpectedParticipants,
  computeTierProbabilities,
  normalizeProbabilities,
  UNLIMITED_TIER_QUANTITY,
} from '@/lib/game-engine/probability'

type PrizeTierMode = 'quantity' | 'percent'

/**
 * GET /api/admin/events?store_id=xxx
 * 로그인 계정 기준 접근 가능한 이벤트 목록 반환.
 */
export async function GET(request: Request) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const requestedStoreId = searchParams.get('store_id')
  const allowedStoreId = getAllowedStoreId(session.account)

  // advertiser는 자기 매장만, 그 외는 store_id 파라미터로 필터
  const filterStoreId = allowedStoreId ?? requestedStoreId

  const supabase = createServerClient()
  let query = supabase
    .from('events')
    .select('id, store_id, name, status, display_start_date, display_end_date, created_at')
    .order('created_at', { ascending: false })

  if (filterStoreId) query = query.eq('store_id', filterStoreId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: '이벤트 조회 실패' }, { status: 500 })

  return NextResponse.json({ events: data ?? [] })
}

/**
 * POST /api/admin/events
 * 새 이벤트 등록 (events + prize_tiers 동시 생성)
 */
export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '요청 데이터가 없습니다' }, { status: 400 })

  const {
    name,
    display_start_date,
    display_end_date,
    expected_daily_participants,
    challenge_frequency,
    coupon_validity_type,
    coupon_validity_value,
    tiers,
  } = body

  const prizeTierMode: PrizeTierMode = body.prize_tier_mode === 'percent' ? 'percent' : 'quantity'

  const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly', 'unlimited']
  if (challenge_frequency && !VALID_FREQUENCIES.includes(challenge_frequency)) {
    return NextResponse.json({ error: '올바르지 않은 도전 횟수 설정입니다' }, { status: 400 })
  }

  if (!name || !display_start_date || !display_end_date || !expected_daily_participants || !tiers?.length) {
    return NextResponse.json({ error: '필수 항목이 누락됐습니다' }, { status: 400 })
  }

  if (prizeTierMode === 'percent') {
    for (const t of tiers) {
      const p = Number(t.probability_percent)
      if (Number.isNaN(p) || p < 0 || p > 100) {
        return NextResponse.json({ error: '모든 티어의 확률(%)을 0~100 사이로 입력해주세요' }, { status: 400 })
      }
    }
  } else {
    for (const t of tiers) {
      if (!t.total_quantity || Number(t.total_quantity) <= 0) {
        return NextResponse.json({ error: '모든 티어의 수량을 입력해주세요' }, { status: 400 })
      }
    }
  }

  // advertiser는 자기 store_id 고정, 그 외는 body.store_id 사용
  const allowedStoreId = getAllowedStoreId(session.account)
  const storeId = allowedStoreId ?? body.store_id
  if (!storeId) return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })

  const supabase = createServerClient()

  // 이미 active 이벤트가 있는지 확인 (종료일이 지난 것은 제외)
  const today = new Date().toISOString().slice(0, 10)
  const { data: existingActive } = await supabase
    .from('events')
    .select('id')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .gte('display_end_date', today)
    .maybeSingle()

  if (existingActive) {
    return NextResponse.json(
      { error: '이미 진행 중인 이벤트가 있습니다. 기존 이벤트를 종료한 후 등록해주세요.' },
      { status: 409 }
    )
  }

  // 시작일 기준 status 자동 결정
  const status = display_start_date <= today ? 'active' : 'scheduled'

  // 확률 계산 — mode에 따라 "수량 기반 자동계산" 또는 "직접입력 확률 정규화" 중 하나
  const startDate = new Date(display_start_date)
  const endDate = new Date(display_end_date)
  const periodDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  const expectedParticipants = computeExpectedParticipants(expected_daily_participants, periodDays)

  const probabilities = prizeTierMode === 'percent'
    ? normalizeProbabilities(tiers.map((t: { probability_percent: number }) => Number(t.probability_percent) || 0))
    : computeTierProbabilities(tiers.map((t: { total_quantity: number }) => t.total_quantity), expectedParticipants)

  // events INSERT
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      store_id: storeId,
      name,
      status,
      display_start_date,
      display_end_date,
      expected_daily_participants,
      challenge_frequency: challenge_frequency ?? 'daily',
      coupon_validity_type: coupon_validity_type ?? 'relative_days',
      coupon_validity_value: String(coupon_validity_value ?? '14'),
      prize_tier_mode: prizeTierMode,
    })
    .select('id')
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: '이벤트 저장 실패: ' + eventError?.message }, { status: 500 })
  }

  // prize_tiers INSERT
  // percent 모드에서 수량을 입력하지 않은 티어는 UNLIMITED_TIER_QUANTITY로 채워
  // "재고 소진 → 꽝 강제 전환" 안전장치가 걸리지 않게 한다.
  const tierRows = tiers.map((t: {
    label: string; amount: number; total_quantity?: number; requires_verification: boolean
  }, i: number) => {
    const qty = prizeTierMode === 'percent'
      ? (Number(t.total_quantity) > 0 ? Number(t.total_quantity) : UNLIMITED_TIER_QUANTITY)
      : Number(t.total_quantity)
    return {
      event_id: event.id,
      label: t.label,
      amount: t.amount,
      total_quantity: qty,
      remaining_quantity: qty,
      computed_probability: probabilities[i],
      requires_verification: true,
    }
  })

  const { error: tierError } = await supabase.from('prize_tiers').insert(tierRows)

  if (tierError) {
    // 이벤트는 만들어졌지만 티어 저장 실패 → 이벤트도 롤백
    await supabase.from('events').delete().eq('id', event.id)
    return NextResponse.json({ error: '경품 티어 저장 실패: ' + tierError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, eventId: event.id, status }, { status: 201 })
}
