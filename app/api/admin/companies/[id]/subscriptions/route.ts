import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

type Params = { params: Promise<{ id: string }> }

/** GET /api/admin/companies/[id]/subscriptions — 해당 업체(store_contracts.id)의 구독(이용기간) 이력 */
export async function GET(_req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const supabase = createServerClient()

  const { data: company } = await supabase.from('store_contracts').select('store_id').eq('id', id).maybeSingle()
  if (!company) return NextResponse.json({ error: '업체를 찾을 수 없습니다' }, { status: 404 })

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, plan_name, amount_paid, start_date, end_date, memo, created_at')
    .eq('store_id', company.store_id)
    .order('end_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subscriptions: data ?? [] })
}

/** POST /api/admin/companies/[id]/subscriptions — 새 구독(갱신) row 추가. 기존 row는 덮어쓰지 않고 이력으로 남긴다 */
export async function POST(req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body?.plan_name || !body?.start_date || !body?.end_date) {
    return NextResponse.json({ error: '플랜명, 시작일, 종료일은 필수입니다' }, { status: 400 })
  }
  if (body.start_date > body.end_date) {
    return NextResponse.json({ error: '종료일은 시작일보다 이후여야 합니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: company } = await supabase.from('store_contracts').select('store_id').eq('id', id).maybeSingle()
  if (!company) return NextResponse.json({ error: '업체를 찾을 수 없습니다' }, { status: 404 })

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      store_id: company.store_id,
      plan_name: String(body.plan_name),
      amount_paid: Number(body.amount_paid) || 0,
      start_date: body.start_date,
      end_date: body.end_date,
      memo: body.memo || null,
      created_by: session.account.id,
    })
    .select('id, plan_name, amount_paid, start_date, end_date, memo, created_at')
    .single()

  if (error) return NextResponse.json({ error: '구독 등록 실패: ' + error.message }, { status: 500 })
  return NextResponse.json({ ok: true, subscription: data })
}
