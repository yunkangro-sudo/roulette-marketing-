import { NextResponse } from 'next/server'
import pg from 'pg'
import { requireAdminAuth } from '@/lib/admin/session'
// scripts/*.mjs는 타입 선언이 없는 순수 JS 모듈이지만, CLI(node scripts/seed-*.mjs)와 이 API가
// 동일한 시드 로직을 공유하기 위해 그대로 import한다 (로직 이중관리 방지).
import { runDemoStoresSeed } from '../../../../../../scripts/seed-demo-stores.mjs'
import { runDemoActivitySeed } from '../../../../../../scripts/seed-demo-activity.mjs'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/admin/super/demo-stores/regenerate
 * body: { storeId?: string }  — 없으면 샘플 매장 10곳 전체, 있으면 해당 매장 1곳만.
 *
 * super_admin 전용. scripts/seed-demo-stores.mjs(Phase 1) → scripts/seed-demo-activity.mjs(Phase 2)를
 * 순서대로(반드시 이 순서로 — Phase 2가 Phase 1의 이벤트/리워드를 재사용한다) 같은 로직으로 실행한다.
 * DATABASE_URL(직접 Postgres 연결 문자열)이 배포 환경에 설정되어 있어야 동작한다 —
 * Supabase 프로젝트 설정 > Database > Connection string에서 확인 가능.
 */
export async function POST(request: Request) {
  const account = await requireAdminAuth()
  if (account.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 사용할 수 있습니다' }, { status: 403 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'DATABASE_URL 환경변수가 설정되어 있지 않습니다 (Supabase 직접 연결 문자열 필요)' },
      { status: 500 },
    )
  }

  const body = await request.json().catch(() => null)
  const storeId = body?.storeId ? String(body.storeId) : null
  const storeIds = storeId ? [storeId] : undefined

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  try {
    await client.connect()

    // 안전장치: is_demo=true가 아닌 store_id가 실수로 들어오면 즉시 중단 (실매장 데이터 파괴 방지)
    if (storeId) {
      const { rows } = await client.query(
        'select is_demo from store_contracts where store_id = $1',
        [storeId],
      )
      if (rows.length === 0 || rows[0].is_demo !== true) {
        return NextResponse.json({ error: '샘플(is_demo=true) 매장이 아닙니다' }, { status: 400 })
      }
    }

    const phase1 = await runDemoStoresSeed(client, storeIds)
    const phase2 = await runDemoActivitySeed(client, storeIds)

    return NextResponse.json({ ok: true, storesRegenerated: phase1.count, activityRegenerated: phase2.count })
  } catch (err) {
    console.error('[demo-stores/regenerate] 실패:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '재생성 중 오류가 발생했습니다' },
      { status: 500 },
    )
  } finally {
    await client.end().catch(() => {})
  }
}
