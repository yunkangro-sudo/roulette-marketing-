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

  // 기존 이벤트 조회 (권한 확인 + 상태 이력용)
  const { data: existing } = await supabase.from('events').select('store_id, status').eq('id', id).single()
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
    coupon_validity_type,
    coupon_validity_value,
    status,
  } = body

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (display_start_date !== undefined) updateData.display_start_date = display_start_date
  if (display_end_date !== undefined) updateData.display_end_date = display_end_date
  if (expected_daily_participants !== undefined) updateData.expected_daily_participants = expected_daily_participants
  if (coupon_validity_type !== undefined) updateData.coupon_validity_type = coupon_validity_type
  if (coupon_validity_value !== undefined) updateData.coupon_validity_value = String(coupon_validity_value)
  if (status !== undefined) updateData.status = status

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
