import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/me/points?kakao_user_id=xxx&store_id=xxx
 * 손님 포인트 잔액 + 리워드 카탈로그
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const kakaoUserId = searchParams.get('kakao_user_id')
  const storeId = searchParams.get('store_id')

  if (!kakaoUserId || !storeId) {
    return NextResponse.json({ error: 'kakao_user_id와 store_id가 필요합니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  const [loyaltyRes, settingsRes, catalogRes, historyRes, missionsRes] = await Promise.all([
    supabase
      .from('customer_loyalty')
      .select('point_balance, visit_count, last_visit_at')
      .eq('store_id', storeId)
      .eq('kakao_user_id', kakaoUserId)
      .maybeSingle(),
    supabase
      .from('loyalty_settings')
      .select('point_per_visit, usage_threshold, point_expiry_days')
      .eq('store_id', storeId)
      .maybeSingle(),
    supabase
      .from('reward_catalog')
      .select('id, name, point_cost, stock')
      .eq('store_id', storeId)
      .eq('active', true)
      .order('point_cost', { ascending: true }),
    supabase
      .from('point_ledger')
      .select('type, amount, created_at')
      .eq('store_id', storeId)
      .eq('kakao_user_id', kakaoUserId)
      .order('created_at', { ascending: false })
      .limit(20),
    // 진행 중 미션 조회 (완료되지 않은 것만)
    supabase
      .from('missions')
      .select(`
        id, name, mission_type, target_value, reward_type, reward_value, end_at,
        mission_progress!left(current_value, completed_at)
      `)
      .eq('store_id', storeId)
      .eq('active', true)
      .or('end_at.is.null,end_at.gt.' + new Date().toISOString()),
  ])

  // 미션 데이터 가공 — 완료된 미션 제외, 진행률 추출
  const rawMissions = missionsRes.data ?? []
  const missions = rawMissions
    .map((m) => {
      const progress = Array.isArray(m.mission_progress) ? m.mission_progress[0] : m.mission_progress
      const currentValue = progress?.current_value ?? 0
      const completedAt  = progress?.completed_at ?? null
      return {
        id:           m.id,
        name:         m.name,
        missionType:  m.mission_type,
        targetValue:  m.target_value,
        rewardType:   m.reward_type,
        rewardValue:  m.reward_value,
        endAt:        m.end_at,
        currentValue,
        completedAt,
      }
    })
    .filter((m) => !m.completedAt)  // 완료된 미션 제외

  return NextResponse.json({
    loyalty:  loyaltyRes.data ?? { point_balance: 0, visit_count: 0 },
    settings: settingsRes.data ?? { point_per_visit: 10, usage_threshold: 100 },
    catalog:  catalogRes.data ?? [],
    history:  historyRes.data ?? [],
    missions,
  })
}
