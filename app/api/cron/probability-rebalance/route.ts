/**
 * GET /api/cron/probability-rebalance
 *
 * Vercel Cron: 매일 KST 00:00 (UTC 15:00, 전날) 실행
 * → vercel.json: { "path": "/api/cron/probability-rebalance", "schedule": "0 15 * * *" }
 *
 * 동작 (lib/game-engine/dailyRebalance.ts):
 *  1. status='active'이고 오늘이 노출 기간 안인 이벤트 전체 조회
 *  2. quantity 모드 이벤트만 대상 — 잔여 수량·실측 참여자 수 기반으로 확률 재계산
 *  3. 장기 운영(long_term_mode) 이벤트는 캘린더 주기 경계를 넘었으면 먼저 재고 리필
 *
 * 보안: Authorization: Bearer {CRON_SECRET} 헤더 검증 (expiry-reminder와 동일 방식)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { runDailyRebalanceBatch } from '@/lib/game-engine/dailyRebalance'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()
    const summary = await runDailyRebalanceBatch(supabase)
    console.log('[probability-rebalance] 완료:', JSON.stringify(summary))
    return NextResponse.json(summary)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[probability-rebalance] 배치 실패:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
