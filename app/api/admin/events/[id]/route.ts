import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession, getAllowedStoreId } from '@/lib/admin/session'

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/admin/events/[id]
 * 이벤트 단건 조회 (prize_tiers 포함)
 */
export async function GET(_req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { id } = await params
  const supabase = createServerClient()

  const { data: event, error } = await supabase
    .from('events')
    .select('*, prize_tiers(*)')
    .eq('id', id)
    .single()

  if (error || !event) return NextResponse.json({ error: '이벤트를 찾을 수 없습니다' }, { status: 404 })

  // advertiser는 자기 매장만 조회 가능
  const allowedStoreId = getAllowedStoreId(session.account)
  if (allowedStoreId && event.store_id !== allowedStoreId) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  return NextResponse.json({ event })
}

/**
 * PATCH /api/admin/events/[id]
 * 이벤트 기본 정보 수정 (name, 기간, 참여자수, 쿠폰 기간, status)
 */
export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '요청 데이터가 없습니다' }, { status: 400 })

  const supabase = createServerClient()

  // 기존 이벤트 조회 (권한 확인 + 상태 이력 + 장기 운영 모드 전환 판단용)
  const { data: existing } = await supabase
    .from('events')
    .select('store_id, status, display_start_date, prize_tier_mode, long_term_mode, reset_cycle')
    .eq('id', id)
    .single()
  if (!existing) return NextResponse.json({ error: '이벤트를 찾을 수 없습니다' }, { status: 404 })

  const allowedStoreId = getAllowedStoreId(session.account)
  if (allowedStoreId && existing.store_id !== allowedStoreId) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const {
    name,
    display_start_date,
    display_end_date,
    expected_daily_participants,
    challenge_frequency,
    coupon_validity_type,
    coupon_validity_value,
    status,
    long_term_mode,
    reset_cycle,
  } = body

  const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly', 'unlimited']
  if (challenge_frequency !== undefined && !VALID_FREQUENCIES.includes(challenge_frequency)) {
    return NextResponse.json({ error: '올바르지 않은 도전 횟수 설정입니다' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (display_start_date !== undefined) updateData.display_start_date = display_start_date
  if (display_end_date !== undefined) updateData.display_end_date = display_end_date
  if (expected_daily_participants !== undefined) updateData.expected_daily_participants = expected_daily_participants
  if (challenge_frequency !== undefined) updateData.challenge_frequency = challenge_frequency
  if (coupon_validity_type !== undefined) updateData.coupon_validity_type = coupon_validity_type
  if (coupon_validity_value !== undefined) updateData.coupon_validity_value = String(coupon_validity_value)
  if (status !== undefined) updateData.status = status

  // ── 장기 운영 모드 토글 처리 ─────────────────────────────────
  // (확률 자동 재조정 대상인 quantity 모드에서만 지원 — percent 모드는 대상 제외)
  if (long_term_mode !== undefined || reset_cycle !== undefined) {
    const nextLongTerm = long_term_mode !== undefined ? Boolean(long_term_mode) : existing.long_term_mode
    const nextResetCycle: 'weekly' | 'monthly' | null = nextLongTerm
      ? (reset_cycle === 'monthly' ? 'monthly' : reset_cycle === 'weekly' ? 'weekly' : existing.reset_cycle ?? 'weekly')
      : null

    if (nextLongTerm && existing.prize_tier_mode === 'percent') {
      return NextResponse.json(
        { error: '장기 운영 모드는 "수량으로 입력" 방식에서만 사용할 수 있습니다. 경품 티어 입력 방식을 먼저 변경해주세요.' },
        { status: 400 }
      )
    }

    updateData.long_term_mode = nextLongTerm
    updateData.reset_cycle = nextResetCycle

    const turningOn = nextLongTerm && !existing.long_term_mode
    const cycleChanged = nextLongTerm && existing.long_term_mode && existing.reset_cycle !== nextResetCycle

    if (!nextLongTerm) {
      // 꺼질 때는 사이클 앵커를 비운다 — 다음에 다시 켜면 그 시점부터 새로 시작
      updateData.current_cycle_start = null
    } else if (turningOn || cycleChanged) {
      const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const startDate = display_start_date ?? existing.display_start_date
      // 이미 진행 중인 이벤트에서 켜면 "지금부터"가 첫 주기 시작(짧은 첫 주기),
      // 아직 시작 전이면 노출 시작일부터 (한 번도 리셋 안 된 상태 그대로 시작)
      updateData.current_cycle_start = today > startDate ? today : startDate
    }
  }

  const { data, error } = await supabase.from('events').update(updateData).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: '수정 실패: ' + error.message }, { status: 500 })

  // 상태가 변경된 경우 이력 기록
  if (status !== undefined && status !== existing.status) {
    await supabase.from('event_status_changes').insert({
      event_id: id,
      store_id: existing.store_id,
      changed_by: session.account.id,
      previous_status: existing.status,
      new_status: status,
    })
  }

  return NextResponse.json({ ok: true, event: data })
}
