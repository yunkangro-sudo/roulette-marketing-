import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import { decryptPhone } from '@/lib/crypto/phoneEncryption'

/**
 * GET /api/admin/super/participants?storeId=&from=&to=&limit=
 * 슈퍼관리자 전용. 게임 완료(game_complete) 시각과 복호화한 휴대폰 번호를 내려준다.
 * format=csv 이면 엑셀에서 여는 CSV 파일.
 */

const VIEW_LIMIT = 300
const EXPORT_LIMIT = 5000

function kstDayStartUtc(ymd: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 9 * 60 * 60 * 1000).toISOString()
}

function kstDayEndExclusiveUtc(ymd: string): string | null {
  const start = kstDayStartUtc(ymd)
  if (!start) return null
  return new Date(new Date(start).getTime() + 24 * 60 * 60 * 1000).toISOString()
}

/** +82 10-2937-1548 → 010-2937-1548 */
function formatKoreanMobile(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('82')) digits = `0${digits.slice(2)}`
  if (digits.startsWith('10')) digits = `0${digits}`
  if (digits.length === 11 && digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10 && digits.startsWith('01')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return digits || raw
}

function formatKst(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  const session = await getAdminSession()
  if (session.account?.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 조회할 수 있습니다' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('storeId')?.trim() || ''
  const from = searchParams.get('from')?.trim() || ''
  const to = searchParams.get('to')?.trim() || ''
  const asCsv = searchParams.get('format') === 'csv'
  const requested = Number(searchParams.get('limit') || (asCsv ? EXPORT_LIMIT : VIEW_LIMIT))
  const limit = Math.min(asCsv ? EXPORT_LIMIT : VIEW_LIMIT, Math.max(1, requested || VIEW_LIMIT))

  const supabase = createServerClient()

  let query = supabase
    .from('activity_log')
    .select('store_id, kakao_user_id, occurred_at')
    .eq('event_type', 'game_complete')
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (storeId) query = query.eq('store_id', storeId)
  if (from) {
    const start = kstDayStartUtc(from)
    if (!start) return NextResponse.json({ error: '시작 날짜 형식이 올바르지 않습니다' }, { status: 400 })
    query = query.gte('occurred_at', start)
  }
  if (to) {
    const end = kstDayEndExclusiveUtc(to)
    if (!end) return NextResponse.json({ error: '종료 날짜 형식이 올바르지 않습니다' }, { status: 400 })
    query = query.lt('occurred_at', end)
  }

  const [{ data: plays, error }, { data: stores }] = await Promise.all([
    query,
    supabase.from('store_contracts').select('store_id, store_name, is_demo').order('store_name'),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const storeName = new Map((stores ?? []).map((s) => [s.store_id, s.store_name || s.store_id]))
  const userIds = [...new Set((plays ?? []).map((p) => p.kakao_user_id).filter(Boolean))]

  const phoneByKey = new Map<string, string>()
  for (let i = 0; i < userIds.length; i += 200) {
    const chunk = userIds.slice(i, i + 200)
    const { data: loyalties } = await supabase
      .from('customer_loyalty')
      .select('store_id, kakao_user_id, phone_encrypted')
      .in('kakao_user_id', chunk)
    for (const row of loyalties ?? []) {
      const phone = row.phone_encrypted ? decryptPhone(row.phone_encrypted) : null
      if (phone) phoneByKey.set(`${row.store_id}::${row.kakao_user_id}`, formatKoreanMobile(phone))
    }
  }

  const rows = (plays ?? []).map((p) => ({
    playedAt: formatKst(p.occurred_at),
    storeId: p.store_id,
    storeName: storeName.get(p.store_id) || p.store_id,
    phone: phoneByKey.get(`${p.store_id}::${p.kakao_user_id}`) || '',
  }))

  if (asCsv) {
    const header = ['참여일시', '업체명', '업체아이디', '휴대폰번호']
    const lines = [
      header.map(csvCell).join(','),
      ...rows.map((r) => [r.playedAt, r.storeName, r.storeId, r.phone || '번호 없음'].map(csvCell).join(',')),
    ]
    const body = `\uFEFF${lines.join('\r\n')}`
    const filename = `game-participants-${from || 'all'}-${to || 'all'}.csv`
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  return NextResponse.json({
    rows,
    limited: (plays ?? []).length >= limit,
    stores: (stores ?? []).map((s) => ({
      storeId: s.store_id,
      storeName: s.is_demo ? `${s.store_name || s.store_id} (샘플)` : (s.store_name || s.store_id),
    })),
  })
}
