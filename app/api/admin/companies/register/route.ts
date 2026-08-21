import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'
import { generateTempPassword } from '@/lib/admin/tempPassword'
import bcrypt from 'bcryptjs'

/**
 * POST /api/admin/companies/register
 * 업체 등록 + store_contracts + 광고주 계정을 한 번에 생성
 * body: {
 *   store_id, store_name,
 *   contract_start_date, contract_end_date, ad_amount, contractor_name, manager_name,
 *   advertiser_email
 * }
 * 응답: { ok, temp_password } — 임시 비밀번호는 1회만 노출, 저장하지 않음
 */
export async function POST(req: Request) {
  const account = await requireAdminAuth()
  if (!['super_admin', 'agency'].includes(account.role)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const {
    store_id, store_name,
    contract_start_date, contract_end_date,
    ad_amount, contractor_name, manager_name,
    advertiser_email,
    phone, website, address, remarks,
    daangn_url, kakao_channel_url,
  } = body ?? {}

  if (!store_id || !store_name || !advertiser_email) {
    return NextResponse.json({ error: '매장ID, 업체명, 광고주 이메일은 필수입니다' }, { status: 400 })
  }
  if (!contract_start_date || !contract_end_date) {
    return NextResponse.json({ error: '계약 기간을 입력해주세요' }, { status: 400 })
  }

  // 이메일 형식 체크
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(advertiser_email)) {
    return NextResponse.json({ error: '올바른 이메일 형식을 입력해주세요' }, { status: 400 })
  }

  // 임시 비밀번호 생성 (이메일 아이디 + 1234)
  const tempPassword = generateTempPassword(advertiser_email)
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const supabase = createServerClient()

  // 이메일 중복 체크
  const { data: existing } = await supabase
    .from('store_accounts')
    .select('id')
    .eq('email', advertiser_email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: '이미 사용 중인 이메일입니다' }, { status: 400 })
  }

  // store_id 중복 체크
  const { data: existingStore } = await supabase
    .from('store_contracts')
    .select('id')
    .eq('store_id', store_id)
    .maybeSingle()

  if (existingStore) {
    return NextResponse.json({ error: '이미 등록된 매장 ID입니다' }, { status: 400 })
  }

  // store_contracts 생성
  const { error: contractError } = await supabase.from('store_contracts').insert({
    store_id,
    store_name,
    contract_start_date,
    contract_end_date,
    ad_amount: Number(ad_amount) || 0,
    contractor_name: contractor_name || '',
    manager_name: manager_name || '',
    phone: phone || null,
    website: website || null,
    address: address || null,
    remarks: remarks || null,
    daangn_url: daangn_url || null,
    kakao_channel_url: kakao_channel_url || null,
  })
  if (contractError) {
    return NextResponse.json({ error: '업체 등록 실패: ' + contractError.message }, { status: 500 })
  }

  // store_accounts (광고주) 생성
  const { error: accountError } = await supabase.from('store_accounts').insert({
    store_id,
    email: advertiser_email,
    password_hash: passwordHash,
    role: 'advertiser',
  })
  if (accountError) {
    // 계정 생성 실패 시 계약 정보도 롤백 (best effort)
    await supabase.from('store_contracts').delete().eq('store_id', store_id)
    return NextResponse.json({ error: '계정 생성 실패: ' + accountError.message }, { status: 500 })
  }

  // 임시 비밀번호는 응답으로만 전달 (DB에 저장하지 않음 — 이미 해시됨)
  return NextResponse.json({ ok: true, temp_password: tempPassword })
}
