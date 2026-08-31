import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'

/** advertiser → 자기 storeId 강제, 그 외 → 쿼리/바디의 store_id 사용 */
function resolveStoreId(account: { role: string; storeId: string | null }, provided: string | null): string | null {
  if (account.role === 'advertiser') return account.storeId
  return provided
}

/**
 * GET /api/admin/loyalty-settings?store_id=xxx
 * POST /api/admin/loyalty-settings  — body: { store_id, point_per_visit, usage_threshold, point_expiry_days }
 */
export async function GET(req: Request) {
  const account = await requireAdminAuth()

  const { searchParams } = new URL(req.url)
  const storeId = resolveStoreId(account, searchParams.get('store_id'))

  if (!storeId) {
    return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })
  }

  const supabase = createServerClient()
  const [loyaltyRes, settingsRes] = await Promise.all([
    supabase.from('loyalty_settings').select('*').eq('store_id', storeId).maybeSingle(),
    supabase.from('store_settings').select('points_enabled, average_order_value').eq('store_id', storeId).maybeSingle(),
  ])

  if (loyaltyRes.error) return NextResponse.json({ error: loyaltyRes.error.message }, { status: 500 })

  const loyalty = loyaltyRes.data ?? {
    store_id: storeId,
    point_per_visit: 10,
    usage_threshold: 100,
    point_expiry_days: null,
  }

  return NextResponse.json({
    ...loyalty,
    points_enabled: settingsRes.data?.points_enabled !== false,
    average_order_value: settingsRes.data?.average_order_value ?? 0,
  })
}

export async function POST(req: Request) {
  const account = await requireAdminAuth()
  if (account.role === 'staff') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const { store_id, point_per_visit, usage_threshold, point_expiry_days, default_revisit_interval_days, points_enabled, average_order_value } = body ?? {}

  const storeId = resolveStoreId(account, store_id)
  if (!storeId) {
    return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase.from('loyalty_settings').upsert({
    store_id: storeId,
    point_per_visit: Number(point_per_visit) || 10,
    usage_threshold: Number(usage_threshold) || 100,
    point_expiry_days: point_expiry_days ? Number(point_expiry_days) : null,
    default_revisit_interval_days: default_revisit_interval_days ? Number(default_revisit_interval_days) : 7,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'store_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const hasPointsEnabled = typeof points_enabled === 'boolean'
  const hasAvgOrderValue = average_order_value !== undefined

  if (hasPointsEnabled || hasAvgOrderValue) {
    const { data: existing } = await supabase
      .from('store_settings')
      .select('store_id')
      .eq('store_id', storeId)
      .maybeSingle()

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (hasPointsEnabled) patch.points_enabled = points_enabled
    if (hasAvgOrderValue) patch.average_order_value = Number(average_order_value) || 0

    const settingsError = existing
      ? (await supabase.from('store_settings').update(patch).eq('store_id', storeId)).error
      : (await supabase.from('store_settings').insert({ store_id: storeId, ...patch })).error

    if (settingsError) {
      console.error('[loyalty-settings] store_settings 저장 실패:', settingsError)
      return NextResponse.json({
        error: '매장 설정 저장에 실패했습니다. Migration 029를 실행했는지 확인해주세요.',
      }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
