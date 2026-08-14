import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'

export type CheckoutStaff = {
  id: string
  storeId: string
  role: 'staff' | 'advertiser'
}

/**
 * 계산대 승인 API 권한:
 * - staff / advertiser 만 허용
 * - 계정 store_id 와 대상 매장 store_id 가 일치해야 함
 */
export async function requireCheckoutStaff(storeId: string): Promise<
  { ok: true; account: CheckoutStaff } | { ok: false; response: NextResponse }
> {
  const session = await getAdminSession()
  const account = session.account

  if (!account) {
    return { ok: false, response: NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 }) }
  }

  if (account.role !== 'staff' && account.role !== 'advertiser') {
    return { ok: false, response: NextResponse.json({ error: '계산대 권한이 없습니다' }, { status: 403 }) }
  }

  if (!account.storeId || account.storeId !== storeId) {
    return { ok: false, response: NextResponse.json({ error: '다른 매장의 경품은 처리할 수 없습니다' }, { status: 403 }) }
  }

  return {
    ok: true,
    account: { id: account.id, storeId: account.storeId, role: account.role },
  }
}
