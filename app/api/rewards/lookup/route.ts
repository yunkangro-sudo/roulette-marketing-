import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/rewards/lookup?code=<rewards_issued.id>
 * 직원 계산대에서 리워드 코드 조회
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')?.trim()

  if (!code) {
    return NextResponse.json({ error: '코드를 입력해주세요' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('rewards_issued')
    .select(`
      id,
      store_id,
      kakao_user_id,
      status,
      issued_at,
      used_at,
      reward_catalog (name, point_cost)
    `)
    .eq('id', code)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: '해당 리워드 코드를 찾을 수 없습니다' }, { status: 404 })
  }

  return NextResponse.json({ reward: data })
}
