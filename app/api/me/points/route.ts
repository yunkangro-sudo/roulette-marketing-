import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCustomerSession } from '@/lib/auth/session'

/**
 * GET /api/me/points?store_id=xxx
 * 세션의 kakao_user_id만 사용한다. URL uid는 무시한다.
 */
export async function GET(req: Request) {
  const session = await getCustomerSession()
  const kakaoUserId = session.user?.kakao_user_id
  if (!kakaoUserId) {
    return NextResponse.json({ error: '로그인이 필요합니다', needLogin: true }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('store_id') || session.user?.storeId || ''

  if (!storeId) {
    return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  const now = new Date().toISOString()

  const [loyaltyRes, settingsRes, catalogRes, historyRes, missionsRes, progressRes] = await Promise.all([
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
      // requires_verification은 Migration 023 실행 후 추가 예정
      .select('id, name, point_cost, stock, reward_type, image_url, start_at, end_at')
      .eq('store_id', storeId)
      .eq('active', true)
      // start_at이 없거나 현재 시각 이전인 것만
      .or(`start_at.is.null,start_at.lte.${now}`)
      // end_at이 없거나 현재 시각 이후인 것만
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order('point_cost', { ascending: true }),
    supabase
      .from('point_ledger')
      .select('type, amount, created_at')
      .eq('store_id', storeId)
      .eq('kakao_user_id', kakaoUserId)
      .order('created_at', { ascending: false })
      .limit(20),
    // 활성 미션 목록 (join 없이 — kakao_user_id 필터 문제 방지)
    supabase
      .from('missions')
      .select('id, name, mission_type, target_value, reward_type, reward_value, end_at')
      .eq('store_id', storeId)
      .eq('active', true)
      .or(`end_at.is.null,end_at.gt.${now}`),
    // 이 손님의 미션 진행률 별도 조회 (kakao_user_id 정확히 필터)
    supabase
      .from('mission_progress')
      .select('mission_id, current_value, completed_at')
      .eq('store_id', storeId)
      .eq('kakao_user_id', kakaoUserId),
  ])

  // 미션 + 진행률 합산 — 완료된 미션 제외
  const progressMap = Object.fromEntries(
    (progressRes.data ?? []).map((p) => [p.mission_id, p])
  )

  const missions = (missionsRes.data ?? [])
    .map((m) => {
      const prog = progressMap[m.id]
      return {
        id:           m.id,
        name:         m.name,
        missionType:  m.mission_type,
        targetValue:  m.target_value,
        rewardType:   m.reward_type,
        rewardValue:  m.reward_value,
        endAt:        m.end_at,
        currentValue: prog?.current_value ?? 0,
        completedAt:  prog?.completed_at ?? null,
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
