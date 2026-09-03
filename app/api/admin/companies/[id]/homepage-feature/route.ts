import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

type Params = { params: Promise<{ id: string }> }

/** PATCH /api/admin/companies/[id]/homepage-feature — 매장 홈페이지 유료 기능 on/off (슈퍼관리자/에이전시 전용) */
export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (typeof body?.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled(boolean) 값이 필요합니다' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: company } = await supabase.from('store_contracts').select('store_id').eq('id', id).maybeSingle()
  if (!company) return NextResponse.json({ error: '업체를 찾을 수 없습니다' }, { status: 404 })

  const { data: existing } = await supabase
    .from('store_addons')
    .select('homepage_feature_enabled, homepage_feature_enabled_at')
    .eq('store_id', company.store_id)
    .maybeSingle()

  // false -> true로 전환되는 순간에만 활성화 시각/처리자를 새로 기록한다 (끌 때는 마지막 활성화 기록을 보존)
  const isTurningOn = body.enabled === true && existing?.homepage_feature_enabled !== true
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('store_addons')
    .upsert(
      {
        store_id: company.store_id,
        homepage_feature_enabled: body.enabled,
        homepage_feature_enabled_at: isTurningOn ? now : existing?.homepage_feature_enabled_at ?? null,
        homepage_feature_enabled_by: isTurningOn ? session.account.id : undefined,
        updated_at: now,
      },
      { onConflict: 'store_id' }
    )
    .select('homepage_feature_enabled, homepage_feature_enabled_at')
    .single()

  if (error) return NextResponse.json({ error: '처리 실패: ' + error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    homepageFeatureEnabled: data.homepage_feature_enabled === true,
    homepageFeatureEnabledAt: data.homepage_feature_enabled_at ?? null,
  })
}
