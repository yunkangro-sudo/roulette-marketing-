import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCustomerSession } from '@/lib/auth/session'

/**
 * POST /api/me/points/redeem
 * body: { store_id, reward_catalog_id }
 * kakao_user_id는 세션에서만 읽는다.
 */
export async function POST(req: Request) {
  const session = await getCustomerSession()
  const kakao_user_id = session.user?.kakao_user_id
  if (!kakao_user_id) {
    return NextResponse.json({ error: '로그인이 필요합니다', needLogin: true }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { store_id, reward_catalog_id } = body ?? {}

  if (!store_id || !reward_catalog_id) {
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

  // 리워드 교환 가능 여부는 해당 리워드의 point_cost만으로 판단한다 — 매장 전체의
  // "최소 사용 가능 잔액"(loyalty_settings.usage_threshold) 설정은 더 이상 여기 관여하지
  // 않는다 (예전엔 이 값이 리워드 가격 위에 추가로 얹혀져서, 가격만큼 모아도 여전히
  // 교환이 막히는 혼란스러운 버그가 있었다). RPC 시그니처 호환을 위해 0을 넘긴다.
  //
  // 이 시점(교환하기)에는 포인트도 재고도 차감하지 않는다 — 둘 다 "사장님 확인"
  // 시점(confirm_coupon_used_atomic)에 비로소 차감된다. 여기서는 쿠폰 코드만 발급한다.
  const { data: result, error } = await supabase.rpc('redeem_points_atomic', {
    p_kakao_user_id: kakao_user_id,
    p_store_id: store_id,
    p_reward_id: reward_catalog_id,
    p_point_cost: reward.point_cost,
    p_usage_threshold: 0,
  })

  if (error) {
    return NextResponse.json({ error: '교환 처리 실패: ' + error.message }, { status: 500 })
  }

  if (!result?.ok) {
    return NextResponse.json({ error: result?.error ?? '교환 실패' }, { status: 400 })
  }

  // 리워드 교환도 게임 당첨과 동일하게 coupons 테이블에 발급된다 — 반환된 coupon_id로
  // 게임 당첨 쿠폰과 완전히 동일한 코드 확인 화면(/me/points/[couponId])으로 이동시킨다.
  return NextResponse.json({
    ok: true,
    coupon_id: result.coupon_id,
    new_balance: result.new_balance,
    reward_name: reward.name,
  })
}
