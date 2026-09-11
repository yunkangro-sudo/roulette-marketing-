import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES = ['new', 'contacted', 'converted', 'declined']

/** PATCH /api/admin/leads/[id] — 신청/문의(signup_inquiries) 상태 변경 (슈퍼관리자/에이전시 전용) */
export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!VALID_STATUSES.includes(body?.status)) {
    return NextResponse.json({ error: `status는 ${VALID_STATUSES.join(', ')} 중 하나여야 합니다` }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('signup_inquiries')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: '처리 실패: ' + error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

/** DELETE /api/admin/leads/[id] — 신청/문의(signup_inquiries) 단건 삭제 (슈퍼관리자/에이전시 전용) */
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id가 필요합니다' }, { status: 400 })

  const supabase = createServerClient()
  const { error, count } = await supabase
    .from('signup_inquiries')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: '삭제 실패: ' + error.message }, { status: 500 })
  if (count === 0) return NextResponse.json({ error: '해당 문의를 찾을 수 없습니다' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
