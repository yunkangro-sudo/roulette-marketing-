import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/auth/setup
 * body: { email, password, role?, store_id? }
 *
 * 개발용 초기 계정 생성 엔드포인트.
 * store_accounts가 비어있을 때만 동작 (첫 super_admin 생성용).
 * 이후에는 403 반환.
 */
export async function POST(request: Request) {
  const supabase = createServerClient()

  // 이미 계정이 있으면 막음
  const { count } = await supabase
    .from('store_accounts')
    .select('id', { count: 'exact', head: true })

  if (count && count > 0) {
    return NextResponse.json(
      { error: '이미 계정이 존재합니다. 이 엔드포인트는 첫 계정 생성 시에만 사용 가능합니다.' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null)
  const email = body?.email?.trim()
  const password = body?.password
  const role = body?.role ?? 'super_admin'
  const storeId = body?.store_id ?? null

  if (!email || !password) {
    return NextResponse.json({ error: 'email과 password가 필요합니다' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const { data, error } = await supabase
    .from('store_accounts')
    .insert({ email, password_hash: passwordHash, role, store_id: storeId })
    .select('id, email, role, store_id')
    .single()

  if (error) {
    return NextResponse.json({ error: '계정 생성 실패: ' + error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, account: data })
}
