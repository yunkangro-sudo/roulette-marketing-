import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

/** POST /api/admin/impersonation/exit — 대리접속 종료. impersonation_log.ended_at을 기록하고 세션을 원래(super_admin/agency)로 되돌린다 */
export async function POST() {
  const session = await getAdminSession()
  const account = session.account
  if (!account?.impersonation) {
    return NextResponse.json({ error: '대리접속 중이 아닙니다' }, { status: 400 })
  }

  const supabase = createServerClient()
  await supabase
    .from('impersonation_log')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', account.impersonation.logId)

  const { impersonation: _impersonation, ...rest } = account
  session.account = rest
  await session.save()

  return NextResponse.json({ ok: true })
}
