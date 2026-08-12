import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'

/** POST /api/admin/auth/logout */
export async function POST() {
  const session = await getAdminSession()
  session.destroy()
  return NextResponse.json({ ok: true })
}
