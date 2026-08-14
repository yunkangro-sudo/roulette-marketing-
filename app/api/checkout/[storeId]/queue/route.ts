/**
 * GET /api/checkout/[storeId]/queue
 * 직원 화면: 오늘 대기/확인된 경품 목록
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireCheckoutStaff } from '@/lib/checkout/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params
  const auth = await requireCheckoutStaff(storeId)
  if (!auth.ok) return auth.response

  const supabase = createServerClient()
  const { data: settings } = await supabase
    .from('store_settings')
    .select('qr_checkout_enabled')
    .eq('store_id', storeId)
    .maybeSingle()

  const todayKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: rows, error } = await supabase
    .from('checkout_queue')
    .select('id, display_code, seq, kakao_user_id, item_type, item_id, label, amount, status, created_at')
    .eq('store_id', storeId)
    .eq('queue_date', todayKst)
    .in('status', ['waiting', 'confirmed'])
    .order('seq', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    qrEnabled: settings?.qr_checkout_enabled !== false,
    items: rows ?? [],
  })
}
