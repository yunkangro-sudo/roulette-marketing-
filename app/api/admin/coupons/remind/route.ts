import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession, getAllowedStoreId } from '@/lib/admin/session'
import { sendAlimtalk } from '@/lib/alimtalk/send'

/**
 * POST /api/admin/coupons/remind
 * body: { coupon_ids: string[] }
 *
 * "미사용" 쿠폰을 선택해 즉시 만료 리마인드를 발송한다. 기존 D-7/D-3/D-1 자동 크론
 * (app/api/cron/expiry-reminder/route.ts)과 동일한 발송규칙(checkSendPermission)과
 * message_log 기록 방식(sendAlimtalk)을 그대로 재사용한다.
 * 만료 리마인드는 솔라피 알림톡으로 발송한다. 전화번호가 없거나 발송 규칙에 걸리면 제외한다.
 */
export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['advertiser', 'agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const couponIds: string[] = body?.coupon_ids ?? []
  if (!Array.isArray(couponIds) || couponIds.length === 0) {
    return NextResponse.json({ error: '선택된 쿠폰이 없습니다' }, { status: 400 })
  }

  const allowedStoreId = getAllowedStoreId(session.account)
  const supabase = createServerClient()

  let query = supabase
    .from('coupons')
    .select('id, store_id, kakao_user_id, amount, label, valid_until, short_code, status')
    .in('id', couponIds)
    .in('status', ['issued', 'pending_verify'])

  if (allowedStoreId) query = query.eq('store_id', allowedStoreId)

  const { data: coupons, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  let skipped = 0
  let failed = 0
  const skippedReasons: Record<string, number> = {}
  const failedReasons: Record<string, number> = {}

  for (const coupon of coupons ?? []) {
    if (!coupon.kakao_user_id) { skipped++; continue }

    const result = await sendAlimtalk({
      storeId: coupon.store_id,
      kakaoUserId: coupon.kakao_user_id,
      messageType: 'expiry_reminder',
      data: {
        couponId: coupon.id,
        shortCode: coupon.short_code,
        amount: coupon.amount,
        label: coupon.label,
        validUntil: coupon.valid_until,
        manual: true,
      },
    })
    if (result.status === 'sent') sent++
    else if (result.status === 'failed') {
      failed++
      failedReasons[result.reason] = (failedReasons[result.reason] ?? 0) + 1
    } else {
      skipped++
      skippedReasons[result.reason] = (skippedReasons[result.reason] ?? 0) + 1
    }
  }

  return NextResponse.json({
    ok: true,
    requested: couponIds.length,
    matched: coupons?.length ?? 0,
    sent,
    skipped,
    failed,
    skippedReasons,
    failedReasons,
  })
}
