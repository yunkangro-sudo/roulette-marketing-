import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'

/**
 * GET /api/admin/churn-risk?store_id=xxx
 * risk_level별 이력 수 + 복귀율 반환
 */
export async function GET(req: Request) {
  const account = await requireAdminAuth()
  const { searchParams } = new URL(req.url)
  const storeId = account.role === 'advertiser'
    ? account.storeId
    : (searchParams.get('store_id') ?? null)

  const supabase = createServerClient()

  let query = supabase
    .from('churn_risk_alerts')
    .select('risk_level, recovered')

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data ?? []

  // risk_level별 집계
  const counts = {
    interested: { total: 0, recovered: 0 },
    at_risk:    { total: 0, recovered: 0 },
    dormant:    { total: 0, recovered: 0 },
  }

  for (const row of rows) {
    const level = row.risk_level as keyof typeof counts
    if (level in counts) {
      counts[level].total++
      if (row.recovered) counts[level].recovered++
    }
  }

  const total = rows.length
  const totalRecovered = rows.filter((r) => r.recovered).length
  const recoveryRate = total > 0 ? Math.round((totalRecovered / total) * 100) : 0

  return NextResponse.json({ counts, total, recoveryRate })
}
