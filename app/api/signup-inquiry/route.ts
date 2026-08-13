/**
 * POST /api/signup-inquiry
 * 랜딩페이지 무료 체험 신청 폼 제출
 * → signup_inquiries 테이블에 저장 (Migration 025)
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)

  const { storeName, ownerName, phone, email, businessType, message } = body ?? {}

  if (!storeName || !ownerName || !phone) {
    return NextResponse.json({ error: '업체명, 담당자명, 연락처는 필수입니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { error } = await supabase.from('signup_inquiries').insert({
    store_name:    storeName,
    owner_name:    ownerName,
    phone:         phone,
    email:         email  || null,
    business_type: businessType || null,
    message:       message || null,
    status:        'new',
  })

  if (error) {
    console.error('[signup-inquiry] DB 저장 실패:', error.message)
    return NextResponse.json({ error: '저장에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
