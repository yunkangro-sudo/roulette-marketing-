import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity/log'

/**
 * POST /api/rewards/use
 * body: { reward_issued_id: string }
 * 직원이 리워드 사용 처리 — status: 'issued' → 'used'
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const { reward_issued_id } = body ?? {}

  if (!reward_issued_id) {
    return NextResponse.json({ error: 'reward_issued_id가 필요합니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  // 현재 상태 확인
  const { data: reward } = await supabase
    .from('rewards_issued')
    .select('id, store_id, kakao_user_id, status')
    .eq('id', reward_issued_id)
    .single()

  if (!reward) {
    return NextResponse.json({ error: '리워드를 찾을 수 없습니다' }, { status: 404 })
  }

  if (reward.status !== 'issued') {
    return NextResponse.json(
      { error: reward.status === 'used' ? '이미 사용된 리워드입니다' : '사용할 수 없는 리워드입니다' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('rewards_issued')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('id', reward_issued_id)
    .eq('status', 'issued')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── reward_redeemed 기록 (silent fail) ───────────────────────
  logActivity({
    storeId:     reward.store_id,
    kakaoUserId: reward.kakao_user_id,
    eventType:   'reward_redeemed',
    refId:       reward_issued_id,
    refType:     'reward',
  }).catch(() => {})
  // ─────────────────────────────────────────────────────────────

  return NextResponse.json({ ok: true })
}
