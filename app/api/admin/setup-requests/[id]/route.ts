import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'
import { SETUP_STATUSES, type SetupStatus } from '@/lib/setup-request/types'

type Params = { params: Promise<{ id: string }> }

const VALID = new Set<string>(SETUP_STATUSES.map((s) => s.id))

export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  const status = String(body?.status ?? '') as SetupStatus
  if (!VALID.has(status)) {
    return NextResponse.json({ error: '상태를 다시 선택해 주세요.' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('setup_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: '처리 실패: ' + error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
