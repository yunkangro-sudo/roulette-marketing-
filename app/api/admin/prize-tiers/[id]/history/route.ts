import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/admin/prize-tiers/[id]/history
 * 경품 티어 수량 변경 이력 조회
 */
export async function GET(_req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { id: tierId } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('tier_quantity_changes')
    .select(`
      id,
      previous_quantity,
      new_quantity,
      changed_at,
      store_accounts(email, role)
    `)
    .eq('prize_tier_id', tierId)
    .order('changed_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: '이력 조회 실패: ' + error.message }, { status: 500 })
  }

  return NextResponse.json({ history: data ?? [] })
}
