import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

/** GET /api/admin/companies — 업체 계약 목록 */
export async function GET() {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('store_contracts')
    .select('*')
    .order('contract_end_date', { ascending: true })

  if (error) return NextResponse.json({ error: '조회 실패: ' + error.message }, { status: 500 })
  return NextResponse.json({ companies: data ?? [] })
}

/** POST /api/admin/companies — 업체 계약 신규 등록 */
export async function POST(req: Request) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.store_id || !body?.store_name || !body?.contract_start_date || !body?.contract_end_date) {
    return NextResponse.json({ error: '필수 항목이 누락됐습니다' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.from('store_contracts').insert({
    store_id: body.store_id,
    store_name: body.store_name,
    contract_start_date: body.contract_start_date,
    contract_end_date: body.contract_end_date,
    ad_amount: Number(body.ad_amount) || 0,
    contractor_name: body.contractor_name ?? '',
    manager_name: body.manager_name ?? '',
    daangn_url: body.daangn_url || null,
    kakao_channel_url: body.kakao_channel_url || null,
  }).select().single()

  if (error) return NextResponse.json({ error: '등록 실패: ' + error.message }, { status: 500 })
  return NextResponse.json({ ok: true, company: data }, { status: 201 })
}
