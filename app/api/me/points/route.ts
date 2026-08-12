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

  const [loyaltyRes, settingsRes, catalogRes, historyRes] = await Promise.all([
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
  ])

  return NextResponse.json({
    loyalty: loyaltyRes.data ?? { point_balance: 0, visit_count: 0 },
    settings: settingsRes.data ?? { point_per_visit: 10, usage_threshold: 100 },
    catalog: catalogRes.data ?? [],
    history: historyRes.data ?? [],
  })
}
