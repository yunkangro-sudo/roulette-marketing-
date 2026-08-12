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
  const { data, error } = await supabase
    .from('loyalty_settings')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? { store_id: storeId, point_per_visit: 10, usage_threshold: 100, point_expiry_days: null })
}

export async function POST(req: Request) {
  const account = await requireAdminAuth()
  if (account.role === 'staff') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const { store_id, point_per_visit, usage_threshold, point_expiry_days } = body ?? {}

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
    updated_at: new Date().toISOString(),
  }, { onConflict: 'store_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
