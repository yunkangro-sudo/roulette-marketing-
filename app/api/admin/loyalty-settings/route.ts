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
  const [loyaltyRes, settingsRes, rewardsRes] = await Promise.all([
    supabase.from('loyalty_settings').select('*').eq('store_id', storeId).maybeSingle(),
    supabase
      .from('store_settings')
      .select('points_enabled, average_order_value, nfc_checkin_enabled, nfc_checkin_mode, nfc_checkin_points, stamp_goal_count, stamp_reward_id')
      .eq('store_id', storeId)
      .maybeSingle(),
    supabase.from('reward_catalog').select('id, name').eq('store_id', storeId).eq('active', true).order('created_at', { ascending: false }),
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
    nfc_checkin_enabled: settingsRes.data?.nfc_checkin_enabled ?? false,
    nfc_checkin_mode: settingsRes.data?.nfc_checkin_mode ?? 'points',
    nfc_checkin_points: settingsRes.data?.nfc_checkin_points ?? 1000,
    stamp_goal_count: settingsRes.data?.stamp_goal_count ?? 10,
    stamp_reward_id: settingsRes.data?.stamp_reward_id ?? null,
    reward_options: rewardsRes.data ?? [],
  })
}

export async function POST(req: Request) {
  const account = await requireAdminAuth()
  if (account.role === 'staff') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const {
    store_id, point_per_visit, usage_threshold, point_expiry_days, default_revisit_interval_days, points_enabled, average_order_value,
    nfc_checkin_enabled, nfc_checkin_mode, nfc_checkin_points, stamp_goal_count, stamp_reward_id,
  } = body ?? {}

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
  const hasNfcEnabled = typeof nfc_checkin_enabled === 'boolean'
  const hasNfcMode = nfc_checkin_mode !== undefined
  const hasNfcPoints = nfc_checkin_points !== undefined
  const hasStampGoal = stamp_goal_count !== undefined
  const hasStampReward = stamp_reward_id !== undefined

  // NFC 스탬프 모드로 저장하려는 경우, 지정한 리워드가 실제 이 매장 소유인지 확인
  // (다른 매장의 reward_catalog.id를 잘못 넣는 사고 방지)
  if (hasStampReward && stamp_reward_id) {
    const { data: reward } = await supabase
      .from('reward_catalog')
      .select('id')
      .eq('id', stamp_reward_id)
      .eq('store_id', storeId)
      .maybeSingle()
    if (!reward) {
      return NextResponse.json({ error: '선택한 리워드를 찾을 수 없습니다' }, { status: 400 })
    }
  }

  if (hasPointsEnabled || hasAvgOrderValue || hasNfcEnabled || hasNfcMode || hasNfcPoints || hasStampGoal || hasStampReward) {
    const { data: existing } = await supabase
      .from('store_settings')
      .select('store_id')
      .eq('store_id', storeId)
      .maybeSingle()

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (hasPointsEnabled) patch.points_enabled = points_enabled
    if (hasAvgOrderValue) patch.average_order_value = Number(average_order_value) || 0
    if (hasNfcEnabled) patch.nfc_checkin_enabled = nfc_checkin_enabled
    if (hasNfcMode) patch.nfc_checkin_mode = nfc_checkin_mode === 'stamp' ? 'stamp' : 'points'
    if (hasNfcPoints) patch.nfc_checkin_points = Number(nfc_checkin_points) || 1000
    if (hasStampGoal) patch.stamp_goal_count = Number(stamp_goal_count) || 10
    if (hasStampReward) patch.stamp_reward_id = stamp_reward_id || null

    const settingsError = existing
      ? (await supabase.from('store_settings').update(patch).eq('store_id', storeId)).error
      : (await supabase.from('store_settings').insert({ store_id: storeId, ...patch })).error

    if (settingsError) {
      console.error('[loyalty-settings] store_settings 저장 실패:', settingsError)
      return NextResponse.json({
        error: '매장 설정 저장에 실패했습니다. Migration 050을 실행했는지 확인해주세요.',
      }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
