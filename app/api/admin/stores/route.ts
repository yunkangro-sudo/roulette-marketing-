import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/stores
 * events 테이블에 존재하는 store_id 목록과 store_settings 이름을 반환.
 */
export async function GET() {
  const supabase = createServerClient()

  const [eventsResult, settingsResult] = await Promise.all([
    supabase.from('events').select('store_id').neq('status', 'draft'),
    supabase.from('store_settings').select('store_id, store_name'),
  ])

  if (eventsResult.error) {
    return NextResponse.json({ error: '매장 목록 조회 실패' }, { status: 500 })
  }

  const storeIds = [...new Set((eventsResult.data ?? []).map((e) => e.store_id))]
  const nameMap = Object.fromEntries(
    (settingsResult.data ?? []).map((s) => [s.store_id, s.store_name])
  )

  const stores = storeIds.map((id) => ({
    store_id: id,
    store_name: nameMap[id] ?? id,
  }))

  return NextResponse.json({ stores })
}
