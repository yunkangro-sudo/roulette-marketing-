import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

type Params = { params: Promise<{ id: string }> }

/** GET /api/admin/companies/[id] */
export async function GET(_req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const supabase = createServerClient()
  const { data, error } = await supabase.from('store_contracts').select('*').eq('id', id).single()

  if (error || !data) return NextResponse.json({ error: '업체를 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json({ company: data })
}

/** PATCH /api/admin/companies/[id] */
export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '요청 데이터가 없습니다' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('store_contracts')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: '수정 실패: ' + error.message }, { status: 500 })
  return NextResponse.json({ ok: true, company: data })
}
