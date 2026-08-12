import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'
import bcrypt from 'bcryptjs'

/**
 * POST /api/admin/companies/reset-password
 * 광고주 계정의 임시 비밀번호를 재발급합니다.
 * body: { store_id }
 * 응답: { ok, temp_password } — 임시 비밀번호는 1회만 노출, 해시만 DB 저장
 */
export async function POST(req: Request) {
  const account = await requireAdminAuth()
  if (!['super_admin', 'agency'].includes(account.role)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const { store_id } = body ?? {}

  if (!store_id) {
    return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })
  }

  // 임시 비밀번호 생성 (12자리)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let tempPassword = ''
  for (let i = 0; i < 12; i++) {
    tempPassword += chars[Math.floor(Math.random() * chars.length)]
  }
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('store_accounts')
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('store_id', store_id)
    .eq('role', 'advertiser')
    .select('id, email')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: '계정을 찾을 수 없거나 비밀번호 갱신에 실패했습니다' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, temp_password: tempPassword, email: data.email })
}
