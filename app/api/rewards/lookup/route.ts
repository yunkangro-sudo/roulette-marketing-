import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/rewards/lookup?code=<short_code>&store_id=<store_id>
 * 직원 계산대에서 리워드 코드 조회. short_code 기반, store_id 필터.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code    = searchParams.get('code')?.trim().toUpperCase()
  const storeId = searchParams.get('store_id')?.trim()

  if (!code) {
    return NextResponse.json({ error: '코드를 입력해주세요' }, { status: 400 })
  }

  const supabase = createServerClient()

  let query = supabase
    .from('rewards_issued')
    .select(`
      id,
      short_code,
      store_id,
      kakao_user_id,
      status,
      issued_at,
      used_at,
      reward_catalog (name, point_cost)
    `)

  if (code.length === 8) {
    query = query.eq('short_code', code)
  } else {
    query = query.eq('id', code)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: '해당 리워드 코드를 찾을 수 없습니다' }, { status: 404 })
  }

  // store_id 필터
  if (storeId && data.store_id !== storeId) {
    return NextResponse.json({ error: '해당 매장의 코드가 아닙니다' }, { status: 403 })
  }

  return NextResponse.json({ reward: data })
}
