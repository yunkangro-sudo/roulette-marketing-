import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

type Params = { params: Promise<{ id: string; subId: string }> }

/**
 * PATCH /api/admin/companies/[id]/subscriptions/[subId]
 * 결제 확인 워크플로우 전용 — "입금확인 처리" 버튼 등에서 payment_status/payment_date만 갱신한다.
 * (플랜/금액/기간 정정은 새 구독 row를 등록하는 방식으로 이력을 남긴다)
 */
export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { id, subId } = await params
  const body = await req.json().catch(() => null)
  if (!body?.payment_status || !['paid', 'unpaid', 'overdue'].includes(body.payment_status)) {
    return NextResponse.json({ error: 'payment_status 값이 올바르지 않습니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: company } = await supabase.from('store_contracts').select('store_id').eq('id', id).maybeSingle()
  if (!company) return NextResponse.json({ error: '업체를 찾을 수 없습니다' }, { status: 404 })

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      payment_status: body.payment_status,
      payment_date: body.payment_status === 'paid' ? (body.payment_date || new Date().toISOString().slice(0, 10)) : null,
    })
    .eq('id', subId)
    .eq('store_id', company.store_id)
    .select('id, plan_name, amount_paid, start_date, end_date, memo, created_at, payment_date, payment_status')
    .single()

  if (error) return NextResponse.json({ error: '처리 실패: ' + error.message }, { status: 500 })
  return NextResponse.json({ ok: true, subscription: data })
}
