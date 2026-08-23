import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

/** POST /api/admin/auth/logout */
export async function POST() {
  const session = await getAdminSession()

  // 대리접속 중 로그아웃하면 impersonation_log에도 종료 시각을 남긴다 (감사 로그 정합성)
  if (session.account?.impersonation) {
    const supabase = createServerClient()
    await supabase
      .from('impersonation_log')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', session.account.impersonation.logId)
  }

  session.destroy()
  return NextResponse.json({ ok: true })
}
