import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/me/points/redeem
 * body: { kakao_user_id, store_id, reward_catalog_id }
 * PostgreSQL RPC로 원자적 처리 (이중 차감 방지)
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const { kakao_user_id, store_id, reward_catalog_id } = body ?? {}

  if (!kakao_user_id || !store_id || !reward_catalog_id) {
    return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })
  }

  const supabase = createServerClient()

  // 리워드 정보 조회 (point_cost 확인)
  const { data: reward } = await supabase
    .from('reward_catalog')
    .select('id, name, point_cost, active, stock')
    .eq('id', reward_catalog_id)
    .eq('store_id', store_id)
    .single()

  if (!reward || !reward.active) {
    return NextResponse.json({ error: '유효하지 않은 리워드입니다' }, { status: 404 })
  }

  // 정책 조회 (usage_threshold)
  const { data: settings } = await supabase
    .from('loyalty_settings')
    .select('usage_threshold')
    .eq('store_id', store_id)
    .maybeSingle()

  const threshold = settings?.usage_threshold ?? 0

  // RPC 호출 (원자 처리)
  const { data: result, error } = await supabase.rpc('redeem_points_atomic', {
    p_kakao_user_id: kakao_user_id,
    p_store_id: store_id,
    p_reward_id: reward_catalog_id,
    p_point_cost: reward.point_cost,
    p_usage_threshold: threshold,
  })

  if (error) {
    return NextResponse.json({ error: '교환 처리 실패: ' + error.message }, { status: 500 })
  }

  if (!result?.ok) {
    return NextResponse.json({ error: result?.error ?? '교환 실패' }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    issued_id: result.issued_id,
    new_balance: result.new_balance,
    reward_name: reward.name,
  })
}
