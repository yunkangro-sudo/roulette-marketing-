/**
 * POST /api/auth/logout
 * 고객(손님) 세션 삭제
 */

import { NextResponse } from 'next/server'
import { getCustomerSession } from '@/lib/auth/session'

export async function POST() {
  const session = await getCustomerSession()
  session.destroy()
  return NextResponse.json({ ok: true })
}
