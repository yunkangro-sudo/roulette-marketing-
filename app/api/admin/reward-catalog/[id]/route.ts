import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'

interface Params { params: Promise<{ id: string }> }

/**
 * PATCH /api/admin/reward-catalog/[id]
 * body: { name?, point_cost?, active?, stock?, reward_type?, start_at?, end_at?, image_url?, requires_verification?, discount_amount? }
 */
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const account = await requireAdminAuth()
  if (account.role === 'staff') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const {
    name, point_cost, active, stock, reward_type, start_at, end_at, image_url,
    requires_verification, discount_amount,
  } = body ?? {}

  const supabase = createServerClient()

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (point_cost !== undefined) updateData.point_cost = Number(point_cost)
  if (active !== undefined) updateData.active = Boolean(active)
  if (stock !== undefined) updateData.stock = stock === '' || stock === null ? null : Number(stock)
  if (reward_type !== undefined) updateData.reward_type = reward_type
  if (start_at !== undefined) updateData.start_at = start_at || null
  if (end_at !== undefined) updateData.end_at = end_at || null
  if (image_url !== undefined) updateData.image_url = image_url || null
  if (requires_verification !== undefined) updateData.requires_verification = Boolean(requires_verification)
  if (discount_amount !== undefined) {
    updateData.discount_amount = discount_amount === '' || discount_amount === null ? null : Number(discount_amount)
  }

  const { error } = await supabase.from('reward_catalog').update(updateData).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
