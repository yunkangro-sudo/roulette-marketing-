import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'

function resolveStoreId(account: { role: string; storeId: string | null }, provided: string | null): string | null {
  if (account.role === 'advertiser') return account.storeId
  return provided
}

/**
 * GET  /api/admin/reward-catalog?store_id=xxx
 * POST /api/admin/reward-catalog  — body: { store_id, name, point_cost, stock?, reward_type?, start_at?, end_at?, image_url?, requires_verification?, discount_amount? }
 */
export async function GET(req: Request) {
  const account = await requireAdminAuth()

  const { searchParams } = new URL(req.url)
  const storeId = resolveStoreId(account, searchParams.get('store_id'))

  if (!storeId) return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('reward_catalog')
    .select('id, name, point_cost, active, stock, requires_verification, reward_type, start_at, end_at, image_url, discount_amount, created_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const account = await requireAdminAuth()
  if (account.role === 'staff') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const {
    store_id, name, point_cost, stock, requires_verification, reward_type,
    start_at, end_at, image_url, discount_amount,
  } = body ?? {}

  const storeId = resolveStoreId(account, store_id)
  if (!storeId) return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })
  if (!name || !point_cost) return NextResponse.json({ error: '이름과 필요 포인트를 입력해주세요' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('reward_catalog')
    .insert({
      store_id: storeId,
      name,
      point_cost: Number(point_cost),
      active: true,
      stock: stock !== undefined && stock !== '' ? Number(stock) : null,
      // 광고주가 폼에서 끄고 켤 수 있다. 값이 안 오면(하위호환) 기본 true.
      requires_verification: requires_verification !== undefined ? Boolean(requires_verification) : true,
      reward_type: reward_type ?? 'free_item',
      start_at: start_at || null,
      end_at: end_at || null,
      image_url: image_url || null,
      discount_amount: discount_amount !== undefined && discount_amount !== '' ? Number(discount_amount) : null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
