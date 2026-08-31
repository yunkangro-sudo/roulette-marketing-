/**
 * POST /api/aeo-waitlist
 * 랜딩페이지 요금제 섹션 — "AEO마케팅"(준비중) 카드의 "출시 알림 받기" 폼 제출
 * → aeo_waitlist 테이블에 저장 (Migration 047)
 *
 * 베이직 신청(signup_inquiries)과는 리드 성격이 달라(결제 의사 없음, 단순
 * 대기자 등록) 완전히 별도 테이블에 저장한다.
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)

  const { storeName, phone } = body ?? {}

  if (!storeName || !phone) {
    return NextResponse.json({ error: '업체명, 연락처는 필수입니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { error } = await supabase.from('aeo_waitlist').insert({
    store_name: storeName,
    phone:      phone,
  })

  if (error) {
    console.error('[aeo-waitlist] DB 저장 실패:', error.message)
    return NextResponse.json({ error: '저장에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
