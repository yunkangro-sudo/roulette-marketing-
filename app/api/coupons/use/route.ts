import { NextResponse } from 'next/server'

/**
 * POST /api/coupons/use — 즉시 사용 경로는 폐기됨.
 * 모든 쿠폰은 계산대 당근 단골 확인 → 할인 적용 완료 순서로만 used 가 된다.
 */
export async function POST() {
  return NextResponse.json(
    { error: '즉시 사용은 불가합니다. 계산대에서 당근 단골 확인 후 할인 적용을 완료해주세요.' },
    { status: 400 },
  )
}
