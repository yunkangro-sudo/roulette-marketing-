import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'

/**
 * GET /api/admin/stores
 * store_contracts를 매장 마스터로 사용. super_admin/agency만 호출.
 */
export async function GET() {
  const account = await requireAdminAuth()

  // advertiser는 자기 매장만 — 드롭다운 불필요
  if (account.role === 'advertiser') {
    return NextResponse.json({ stores: account.storeId ? [{ store_id: account.storeId, store_name: account.storeId }] : [] })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('store_contracts')
    .select('store_id, store_name')
    .order('store_name', { ascending: true })

  if (error) return NextResponse.json({ error: '매장 목록 조회 실패' }, { status: 500 })

  return NextResponse.json({ stores: data ?? [] })
}
