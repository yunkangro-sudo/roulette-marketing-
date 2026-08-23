import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

/**
 * POST /api/admin/impersonation/start
 * body: { storeId: string }
 *
 * super_admin/agency가 특정 업체로 "관리 진입"할 때 호출한다. 원본(진짜) 계정 정보는
 * 세션에 그대로 남기고, impersonation 필드만 추가해 이후 요청들이 advertiser처럼
 * 동작하도록 한다 (lib/admin/session.ts의 getEffectiveAccount 참고).
 */
export async function POST(req: Request) {
  const session = await getAdminSession()
  const account = session.account
  if (!account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['super_admin', 'agency'].includes(account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }
  if (account.impersonation) {
    return NextResponse.json({ error: '이미 다른 업체를 대리접속 중입니다. 먼저 나가기를 눌러주세요.' }, { status: 409 })
  }

  const body = await req.json().catch(() => null)
  const storeId = body?.storeId ? String(body.storeId) : null
  if (!storeId) return NextResponse.json({ error: 'storeId가 필요합니다' }, { status: 400 })

  const supabase = createServerClient()
  const { data: company } = await supabase
    .from('store_contracts')
    .select('store_id, store_name')
    .eq('store_id', storeId)
    .maybeSingle()
  if (!company) return NextResponse.json({ error: '업체를 찾을 수 없습니다' }, { status: 404 })

  const { data: log, error: logError } = await supabase
    .from('impersonation_log')
    .insert({ super_admin_id: account.id, store_id: storeId })
    .select('id, started_at')
    .single()
  if (logError || !log) {
    return NextResponse.json({ error: '대리접속 기록 생성 실패: ' + (logError?.message ?? '') }, { status: 500 })
  }

  session.account = {
    ...account,
    impersonation: {
      storeId,
      storeName: company.store_name,
      originalAccountId: account.id,
      originalEmail: account.email,
      logId: log.id,
      startedAt: log.started_at,
    },
  }
  await session.save()

  return NextResponse.json({ ok: true, storeId, storeName: company.store_name })
}
