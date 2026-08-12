/**
 * GET /api/auth/me
 * 현재 고객(손님) 세션 반환
 * PlayFlow.tsx 마운트 시 기존 로그인 상태 확인용
 */

import { NextResponse } from 'next/server'
import { getCustomerSession } from '@/lib/auth/session'

export async function GET() {
  const session = await getCustomerSession()
  if (session.user) {
    return NextResponse.json({ user: session.user })
  }
  return NextResponse.json({ user: null })
}
