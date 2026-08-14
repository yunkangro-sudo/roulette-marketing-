import { NextResponse } from 'next/server'

/**
 * POST /api/coupons/verify — 폐기. 계산대 승인은 /api/checkout/[storeId]/approve
 */
export async function POST() {
  return NextResponse.json(
    { error: '이 API는 더 이상 사용하지 않습니다. /api/checkout/[storeId]/approve 를 사용하세요.' },
    { status: 400 },
  )
}
