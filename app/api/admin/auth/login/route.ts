import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

/**
 * POST /api/admin/auth/login
 * body: { email, password }
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = body?.email?.trim()
  const password = body?.password

  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: account, error } = await supabase
    .from('store_accounts')
    .select('id, store_id, email, password_hash, role')
    .eq('email', email)
    .maybeSingle()

  if (error || !account) {
    return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' }, { status: 401 })
  }

  const isValid = await bcrypt.compare(password, account.password_hash)
  if (!isValid) {
    return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' }, { status: 401 })
  }

  const session = await getAdminSession()
  session.account = {
    id: account.id,
    storeId: account.store_id ?? null,
    email: account.email,
    role: account.role,
  }
  await session.save()

  return NextResponse.json({ ok: true, role: account.role, storeId: account.store_id })
}
