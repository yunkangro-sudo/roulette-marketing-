import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'
import { generateTempPassword } from '@/lib/admin/tempPassword'
import bcrypt from 'bcryptjs'

/**
 * POST /api/admin/companies/reset-password
 * 광고주 계정의 비밀번호를 규칙(이메일 아이디 + 1234)에 맞게 재발급합니다.
 * body: { store_id }
 * 응답: { ok, temp_password, email }
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

  const supabase = createServerClient()

  // 계정을 먼저 조회해서 실패 원인을 명확히 구분한다 (이메일도 여기서 확보해서 비밀번호 규칙에 사용)
  const { data: accounts, error: findError } = await supabase
    .from('store_accounts')
    .select('id, email')
    .eq('store_id', store_id)
    .eq('role', 'advertiser')

  if (findError) {
    return NextResponse.json({ error: '계정 조회 실패: ' + findError.message }, { status: 500 })
  }
  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ error: '이 매장에 등록된 광고주 계정이 없습니다' }, { status: 404 })
  }
  if (accounts.length > 1) {
    return NextResponse.json(
      { error: `이 매장에 광고주 계정이 ${accounts.length}개 중복 등록되어 있어 처리할 수 없습니다. 개발팀에 문의해주세요.` },
      { status: 409 }
    )
  }

  const targetAccount = accounts[0]
  const tempPassword = generateTempPassword(targetAccount.email)
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const { error: updateError } = await supabase
    .from('store_accounts')
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('id', targetAccount.id)

  if (updateError) {
    return NextResponse.json({ error: '비밀번호 갱신 실패: ' + updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, temp_password: tempPassword, email: targetAccount.email })
}
