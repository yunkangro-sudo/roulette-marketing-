import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'

/**
 * GET /api/admin/segments?store_id=xxx
 * 매장별 고객 세그먼트 분포 반환
 * store_id 미지정 시 → 권한 범위 내 전체 매장 합산
 */
export async function GET(req: Request) {
  const account = await requireAdminAuth()
  const { searchParams } = new URL(req.url)
  const storeId = account.role === 'advertiser'
    ? account.storeId
    : (searchParams.get('store_id') ?? null)

  const supabase = createServerClient()

  let query = supabase
    .from('customer_loyalty')
    .select('segment')

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const counts: Record<string, number> = {
    NEW: 0, ACTIVE: 0, AT_RISK: 0, DORMANT: 0, RETURNED: 0,
  }

  for (const row of data ?? []) {
    const seg = row.segment as string
    if (seg in counts) counts[seg]++
    else counts['NEW']++  // 기본값 fallback
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return NextResponse.json({ counts, total, storeId })
}
