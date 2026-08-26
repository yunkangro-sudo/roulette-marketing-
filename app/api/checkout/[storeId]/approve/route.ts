/**
 * POST /api/checkout/[storeId]/approve
 *
 * 계산대 승인 API — staff/advertiser + 동일 store_id 필수.
 *
 * body: {
 *   action: 'confirm' | 'apply' | 'reject'
 *   item_type: 'coupon' | 'reward'
 *   item_id: string
 *   reason?: '앱없음' | '거부' | '기타'   // reject 시
 * }
 *
 * confirm → 당근 단골 [확인함]           pending_verify → pending_apply
 * apply   → [할인 적용 완료]             pending_apply  → used
 * reject  → [미확인 처리]                pending_verify → unverified
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireCheckoutStaff } from '@/lib/checkout/auth'
import { getEffectiveStatus } from '@/lib/coupons/getEffectiveStatus'
import { logActivity } from '@/lib/activity/log'

const VALID_REASONS = ['앱없음', '거부', '기타'] as const

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params
  const auth = await requireCheckoutStaff(storeId)
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const action = body?.action as string | undefined
  const itemType = body?.item_type as string | undefined
  const itemId = body?.item_id as string | undefined
  const reason = body?.reason as string | undefined

  if (!action || !['confirm', 'apply', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action은 confirm/apply/reject 중 하나여야 합니다' }, { status: 400 })
  }
  if (itemType !== 'coupon' && itemType !== 'reward') {
    return NextResponse.json({ error: 'item_type이 필요합니다' }, { status: 400 })
  }
  if (!itemId) {
    return NextResponse.json({ error: 'item_id가 필요합니다' }, { status: 400 })
  }
  if (action === 'reject' && !VALID_REASONS.includes(reason as typeof VALID_REASONS[number])) {
    return NextResponse.json({ error: `미확인 사유는 ${VALID_REASONS.join('/')} 중 하나여야 합니다` }, { status: 400 })
  }

  const supabase = createServerClient()
  const now = new Date().toISOString()

  if (itemType === 'coupon') {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('id, store_id, kakao_user_id, status, valid_until, amount')
      .eq('id', itemId)
      .maybeSingle()

    if (error || !coupon) {
      return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다' }, { status: 404 })
    }
    if (coupon.store_id !== storeId) {
      return NextResponse.json({ error: '다른 매장의 경품은 처리할 수 없습니다' }, { status: 403 })
    }

    const effective = getEffectiveStatus(coupon)
    if (effective === 'expired') {
      return NextResponse.json({ error: '사용기간이 지난 쿠폰입니다' }, { status: 409 })
    }
    if (effective === 'used') {
      return NextResponse.json({ error: '이미 사용된 쿠폰입니다' }, { status: 409 })
    }

    if (action === 'confirm') {
      if (effective !== 'pending_verify' && effective !== 'unverified' && effective !== 'issued') {
        return NextResponse.json({ error: `현재 상태(${effective})에서는 확인할 수 없습니다` }, { status: 409 })
      }
      const { error: upErr } = await supabase.from('coupons').update({
        status: 'pending_apply',
        verified_by_staff_id: auth.account.id,
        unverified_reason: null,
      }).eq('id', itemId)
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
      await markQueue(supabase, storeId, 'coupon', itemId, 'confirmed')
      return NextResponse.json({ ok: true, status: 'pending_apply' })
    }

    if (action === 'apply') {
      if (effective !== 'pending_apply') {
        return NextResponse.json({ error: '당근 단골 확인 후에만 할인 적용이 가능합니다' }, { status: 409 })
      }
      // 리워드 교환 쿠폰의 포인트 차감은 여기(실사용 확정 순간)에서 처리한다.
      const { data: result, error: rpcErr } = await supabase.rpc('confirm_coupon_used_atomic', {
        p_coupon_id: itemId,
        p_expected_status: 'pending_apply',
      })
      if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 })
      if (!result?.ok) return NextResponse.json({ error: result?.error ?? '처리에 실패했습니다' }, { status: 409 })
      await markQueue(supabase, storeId, 'coupon', itemId, 'applied')
      logActivity({
        storeId, kakaoUserId: coupon.kakao_user_id,
        eventType: 'coupon_used', refId: itemId, refType: 'coupon',
      }).catch(() => {})
      return NextResponse.json({ ok: true, status: 'used' })
    }

    // reject
    if (effective !== 'pending_verify' && effective !== 'unverified' && effective !== 'issued') {
      return NextResponse.json({ error: `현재 상태(${effective})에서는 미확인 처리할 수 없습니다` }, { status: 409 })
    }
    const { error: upErr } = await supabase.from('coupons').update({
      status: 'unverified',
      unverified_reason: reason,
    }).eq('id', itemId)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    await markQueue(supabase, storeId, 'coupon', itemId, 'cancelled')
    return NextResponse.json({ ok: true, status: 'unverified' })
  }

  // ── reward ────────────────────────────────────────────────
  const { data: reward, error: rErr } = await supabase
    .from('rewards_issued')
    .select('id, store_id, kakao_user_id, status')
    .eq('id', itemId)
    .maybeSingle()

  if (rErr || !reward) {
    return NextResponse.json({ error: '리워드를 찾을 수 없습니다' }, { status: 404 })
  }
  if (reward.store_id !== storeId) {
    return NextResponse.json({ error: '다른 매장의 경품은 처리할 수 없습니다' }, { status: 403 })
  }
  if (reward.status === 'used') {
    return NextResponse.json({ error: '이미 사용된 리워드입니다' }, { status: 409 })
  }
  if (reward.status === 'expired') {
    return NextResponse.json({ error: '만료된 리워드입니다' }, { status: 409 })
  }

  if (action === 'confirm') {
    if (!['pending_verify', 'unverified', 'issued'].includes(reward.status)) {
      return NextResponse.json({ error: `현재 상태(${reward.status})에서는 확인할 수 없습니다` }, { status: 409 })
    }
    const { error: upErr } = await supabase.from('rewards_issued').update({
      status: 'pending_apply',
      verified_by_staff_id: auth.account.id,
    }).eq('id', itemId)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    await markQueue(supabase, storeId, 'reward', itemId, 'confirmed')
    return NextResponse.json({ ok: true, status: 'pending_apply' })
  }

  if (action === 'apply') {
    if (reward.status !== 'pending_apply') {
      return NextResponse.json({ error: '당근 단골 확인 후에만 할인 적용이 가능합니다' }, { status: 409 })
    }
    const { error: upErr } = await supabase.from('rewards_issued').update({
      status: 'used',
      used_at: now,
    }).eq('id', itemId).eq('status', 'pending_apply')
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    await markQueue(supabase, storeId, 'reward', itemId, 'applied')
    logActivity({
      storeId, kakaoUserId: reward.kakao_user_id,
      eventType: 'reward_redeemed', refId: itemId, refType: 'reward',
    }).catch(() => {})
    return NextResponse.json({ ok: true, status: 'used' })
  }

  if (!['pending_verify', 'unverified', 'issued'].includes(reward.status)) {
    return NextResponse.json({ error: `현재 상태(${reward.status})에서는 미확인 처리할 수 없습니다` }, { status: 409 })
  }
  const { error: upErr } = await supabase.from('rewards_issued').update({
    status: 'unverified',
  }).eq('id', itemId)
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  await markQueue(supabase, storeId, 'reward', itemId, 'cancelled')
  return NextResponse.json({ ok: true, status: 'unverified' })
}

async function markQueue(
  supabase: ReturnType<typeof createServerClient>,
  storeId: string,
  itemType: string,
  itemId: string,
  status: 'confirmed' | 'applied' | 'cancelled',
) {
  const todayKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
  await supabase
    .from('checkout_queue')
    .update({ status })
    .eq('store_id', storeId)
    .eq('queue_date', todayKst)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
}
