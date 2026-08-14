import { NextResponse } from 'next/server'

/**
 * POST /api/rewards/use — 즉시 사용 경로는 폐기됨.
 * POST /api/checkout/[storeId]/approve 를 사용한다.
 */
export async function POST() {
  return NextResponse.json(
    { error: '즉시 사용은 불가합니다. 계산대에서 당근 단골 확인 후 할인 적용을 완료해주세요.' },
    { status: 400 },
  )
}
