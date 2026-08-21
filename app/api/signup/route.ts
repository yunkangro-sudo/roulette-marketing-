/**
 * POST /api/signup
 * 랜딩페이지 회원가입 — 실제 로그인 계정을 즉시 생성한다.
 *
 * 기존 /api/signup-inquiry는 "문의 접수"만 하고 실제 계정은 관리자가
 * 수동으로 만들어줘야 했다. 이 엔드포인트는:
 *   1. store_contracts(업체 계약, 30일 무료 체험) 생성
 *   2. store_accounts(advertiser 로그인 계정, 직접 입력한 비밀번호) 생성
 *   3. signup_inquiries에도 기록 (영업팀 CRM용, 실패해도 가입 자체는 성공 처리)
 *   4. 세션을 즉시 발급해 가입 후 바로 /admin/events로 이동 가능하게 함
 */

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'
import { generateStoreId } from '@/lib/admin/storeId'

const TRIAL_DAYS = 30

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const {
    storeName, ownerName, phone, email, businessType, address, message, password,
  } = body ?? {}

  if (!storeName?.trim() || !ownerName?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: '업체명, 담당자명, 연락처는 필수입니다' }, { status: 400 })
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: '로그인에 사용할 이메일을 입력해주세요' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '올바른 이메일 형식을 입력해주세요' }, { status: 400 })
  }
  if (!password || String(password).length < 8) {
    return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  // 이메일 중복 체크 (로그인 계정 식별자이므로 필수)
  const { data: existingAccount } = await supabase
    .from('store_accounts')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingAccount) {
    return NextResponse.json({ error: '이미 가입된 이메일입니다. 로그인 화면을 이용해주세요.' }, { status: 400 })
  }

  // store_id 자동 발급 (충돌 시 재시도)
  let storeId = generateStoreId()
  for (let i = 0; i < 5; i++) {
    const { data: taken } = await supabase
      .from('store_contracts')
      .select('id')
      .eq('store_id', storeId)
      .maybeSingle()
    if (!taken) break
    storeId = generateStoreId()
  }

  const today = new Date()
  const trialEnd = new Date(today)
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10)

  const { error: contractError } = await supabase.from('store_contracts').insert({
    store_id: storeId,
    store_name: storeName.trim(),
    contract_start_date: toDateStr(today),
    contract_end_date: toDateStr(trialEnd),
    ad_amount: 0,
    contractor_name: ownerName.trim(),
    manager_name: ownerName.trim(),
    phone: phone.trim(),
    address: address?.trim() || null,
    business_type: businessType || null,
    remarks: message?.trim() || null,
  })
  if (contractError) {
    console.error('[signup] store_contracts 생성 실패:', contractError.message)
    return NextResponse.json({ error: '가입 처리에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const { data: account, error: accountError } = await supabase
    .from('store_accounts')
    .insert({
      store_id: storeId,
      email: email.trim(),
      password_hash: passwordHash,
      role: 'advertiser',
    })
    .select('id, store_id, email, role')
    .single()

  if (accountError || !account) {
    // 계정 생성 실패 시 계약 정보도 롤백 (best effort)
    await supabase.from('store_contracts').delete().eq('store_id', storeId)
    console.error('[signup] store_accounts 생성 실패:', accountError?.message)
    return NextResponse.json({ error: '가입 처리에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
  }

  // 영업팀 CRM 기록 (실패해도 가입 자체는 이미 완료된 상태이므로 무시)
  const { error: inquiryError } = await supabase.from('signup_inquiries').insert({
    store_name: storeName.trim(),
    owner_name: ownerName.trim(),
    phone: phone.trim(),
    email: email.trim(),
    business_type: businessType || null,
    message: message?.trim() || null,
    status: 'converted',
  })
  if (inquiryError) {
    console.error('[signup] signup_inquiries 기록 실패 (가입은 정상 완료됨):', inquiryError.message)
  }

  // 가입 즉시 로그인 세션 발급 → 바로 관리자 화면 이용 가능
  const session = await getAdminSession()
  session.account = {
    id: account.id,
    storeId: account.store_id ?? null,
    email: account.email,
    role: 'advertiser',
  }
  await session.save()

  return NextResponse.json({ ok: true, storeId: account.store_id })
}
