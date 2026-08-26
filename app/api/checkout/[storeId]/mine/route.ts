/**
 * GET /api/checkout/[storeId]/mine
 * 손님 QR 스캔: 로그인 세션 기준 본인 pending 경품 조회 + 대기번호 부여
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCustomerSession } from '@/lib/auth/session'
import { getEffectiveStatus } from '@/lib/coupons/getEffectiveStatus'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params
  const session = await getCustomerSession()
  const kakaoUserId = session.user?.kakao_user_id

  if (!kakaoUserId) {
    return NextResponse.json({ error: '로그인이 필요합니다', needLogin: true }, { status: 401 })
  }

  const supabase = createServerClient()

  // qr_checkout_enabled(계산대 설정)는 store_settings, store_name(업체명)은 store_contracts가 정답 소스.
  // store_settings.store_name은 대부분 비어있어 store_id 원본값이 그대로 노출되는 버그가 있었다.
  const [{ data: settings }, { data: contract }] = await Promise.all([
    supabase
      .from('store_settings')
      .select('qr_checkout_enabled')
      .eq('store_id', storeId)
      .maybeSingle(),
    supabase
      .from('store_contracts')
      .select('store_name')
      .eq('store_id', storeId)
      .maybeSingle(),
  ])

  const qrEnabled = settings?.qr_checkout_enabled !== false
  const storeName = contract?.store_name ?? storeId

  if (!qrEnabled) {
    return NextResponse.json({
      qrEnabled: false,
      storeName,
      items: [],
      message: '이 매장은 코드 입력 방식만 사용합니다. 직원에게 쿠폰 코드를 보여주세요.',
    })
  }

  const { data: coupons } = await supabase
    .from('coupons')
    .select('id, amount, label, status, valid_until, short_code')
    .eq('store_id', storeId)
    .eq('kakao_user_id', kakaoUserId)
    .in('status', ['pending_verify', 'pending_apply', 'unverified', 'issued'])

  const { data: rewards } = await supabase
    .from('rewards_issued')
    .select('id, status, short_code, reward_catalog(name, point_cost)')
    .eq('store_id', storeId)
    .eq('kakao_user_id', kakaoUserId)
    .in('status', ['pending_verify', 'pending_apply', 'unverified', 'issued'])

  const items: {
    item_type: 'coupon' | 'reward'
    item_id: string
    label: string
    amount: number
    status: string
    short_code: string | null
    display_code: string
    queue_status: string
  }[] = []

  for (const c of coupons ?? []) {
    const st = getEffectiveStatus(c)
    if (st === 'expired' || st === 'used') continue
    // 리워드 교환으로 발급된 쿠폰은 amount가 0원(실물/포인트 리워드)일 수 있어 금액 대신
    // label(실제 품목명)을 우선 써야 한다 — 게임 당첨 쿠폰만 상정하고 항상 "N원 쿠폰"으로
    // 고정했던 부분을 032 마이그레이션의 label 컬럼과 동일한 규칙으로 맞춘다.
    const couponLabel = c.label || `${c.amount.toLocaleString()}원 쿠폰`
    const { data: q } = await supabase.rpc('assign_checkout_queue', {
      p_store_id: storeId,
      p_kakao_user_id: kakaoUserId,
      p_item_type: 'coupon',
      p_item_id: c.id,
      p_label: couponLabel,
      p_amount: c.amount,
    })
    items.push({
      item_type: 'coupon',
      item_id: c.id,
      label: couponLabel,
      amount: c.amount,
      status: st,
      short_code: c.short_code,
      display_code: q?.display_code ?? '—',
      queue_status: q?.status ?? 'waiting',
    })
  }

  for (const r of rewards ?? []) {
    if (r.status === 'used' || r.status === 'expired') continue
    const catalog = r.reward_catalog as { name?: string; point_cost?: number } | { name?: string; point_cost?: number }[] | null
    const cat = Array.isArray(catalog) ? catalog[0] : catalog
    const label = cat?.name ?? '리워드'
    const amount = cat?.point_cost ?? 0
    // 본인확인 불필요 리워드는 발급 시점에 이미 'pending_apply'로 시작한다.
    // 대기열도 처음부터 '확인 완료' 상태로 만들어야 화면 표시가 실제 상태와 어긋나지 않는다.
    const { data: q } = await supabase.rpc('assign_checkout_queue', {
      p_store_id: storeId,
      p_kakao_user_id: kakaoUserId,
      p_item_type: 'reward',
      p_item_id: r.id,
      p_label: label,
      p_amount: amount,
      p_initial_status: r.status === 'pending_apply' ? 'confirmed' : 'waiting',
    })
    items.push({
      item_type: 'reward',
      item_id: r.id,
      label,
      amount,
      status: r.status,
      short_code: r.short_code,
      display_code: q?.display_code ?? '—',
      queue_status: q?.status ?? 'waiting',
    })
  }

  return NextResponse.json({
    qrEnabled: true,
    storeName,
    items,
  })
}
