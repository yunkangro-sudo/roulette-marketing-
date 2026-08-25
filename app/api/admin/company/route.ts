import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'

/**
 * 광고주 본인 업체 정보 조회/수정 API.
 * `/api/admin/companies/[id]`(수퍼관리자·에이전시 전용)와 별도로 두어, 광고주는 항상
 * 본인 `storeId`로만 스코프되고 계약 정보(이용기간·결제)는 절대 건드릴 수 없도록 분리했다.
 */

/** advertiser(또는 대리접속 중인 super_admin/agency)만 허용. 아니면 응답 반환, 통과 시 storeId 반환 */
async function requireAdvertiserStoreId(): Promise<{ storeId: string } | { error: NextResponse }> {
  const account = await requireAdminAuth()
  if (account.role !== 'advertiser' || !account.storeId) {
    return { error: NextResponse.json({ error: '광고주 전용 화면입니다' }, { status: 403 }) }
  }
  return { storeId: account.storeId }
}

/** GET /api/admin/company — 본인 업체 기본정보 + 이용기간·결제 이력(읽기전용) */
export async function GET() {
  const auth = await requireAdvertiserStoreId()
  if ('error' in auth) return auth.error
  const { storeId } = auth

  const supabase = createServerClient()
  const [companyRes, subscriptionsRes] = await Promise.all([
    supabase.from('store_contracts').select('*').eq('store_id', storeId).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('id, plan_name, amount_paid, start_date, end_date, memo, created_at')
      .eq('store_id', storeId)
      .order('end_date', { ascending: false }),
  ])

  if (companyRes.error || !companyRes.data) {
    return NextResponse.json({ error: '업체 정보를 찾을 수 없습니다' }, { status: 404 })
  }

  return NextResponse.json({
    company: companyRes.data,
    subscriptions: subscriptionsRes.data ?? [],
  })
}

/** 광고주가 스스로 수정 가능한 "기본정보" 필드만 화이트리스트. 계약기간/월 광고비는 절대 포함하지 않는다 */
const ADVERTISER_EDITABLE_FIELDS = [
  'store_name',
  'contractor_name',
  'manager_name',
  'phone',
  'website',
  'address',
  'remarks',
  'business_type',
  'daangn_url',
  'kakao_channel_url',
] as const

/** PATCH /api/admin/company — 기본정보만 수정 (이용기간·결제는 수퍼관리자 전용, 여기서 수정 불가) */
export async function PATCH(req: Request) {
  const auth = await requireAdvertiserStoreId()
  if ('error' in auth) return auth.error
  const { storeId } = auth

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '요청 데이터가 없습니다' }, { status: 400 })

  const update: Record<string, unknown> = {}
  for (const field of ADVERTISER_EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field] || null
  }

  if ('store_name' in update && !String(update.store_name ?? '').trim()) {
    return NextResponse.json({ error: '업체명은 필수입니다' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('store_contracts')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('store_id', storeId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: '수정 실패: ' + error.message }, { status: 500 })
  return NextResponse.json({ ok: true, company: data })
}
