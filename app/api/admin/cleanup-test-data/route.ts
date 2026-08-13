/**
 * POST /api/admin/cleanup-test-data
 * 테스트용 reward_catalog 데이터 정리 (개발 전용 — 배포 후 삭제 예정)
 * Authorization: Bearer {CRON_SECRET} 필요
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const supabase = createServerClient()

  // 테스트성 이름 패턴
  const patterns = ['[TEST', '[테스트]', '[A]', '[B]', '[C]', '[D]']

  // 해당 reward_catalog 조회
  const { data: catalogs } = await supabase
    .from('reward_catalog')
    .select('id, name')
    .eq('store_id', 'chj-001')

  const targets = catalogs?.filter(c =>
    patterns.some(p => c.name.startsWith(p))
  ) ?? []

  const ids = targets.map(c => c.id)
  if (ids.length === 0) {
    return NextResponse.json({ message: '정리할 데이터 없음', deleted: 0 })
  }

  // rewards_issued 먼저 삭제
  await supabase.from('rewards_issued').delete().in('reward_catalog_id', ids)

  // reward_catalog 삭제
  const { error } = await supabase.from('reward_catalog').delete().in('id', ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    deleted: ids.length,
    names: targets.map(t => t.name),
  })
}
