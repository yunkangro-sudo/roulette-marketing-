import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { SETUP_PRODUCTS, type SetupPrize, type SetupReward, type SetupProductId } from '@/lib/setup-request/types'

const PRODUCT_IDS = new Set<string>(SETUP_PRODUCTS.map((p) => p.id))
const MAX_ROWS = 20

function cleanText(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max)
}

function parseQty(value: unknown): number | null {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1 || n > 100000) return null
  return n
}

function parsePrizes(value: unknown): SetupPrize[] | null {
  if (!Array.isArray(value)) return null
  const rows: SetupPrize[] = []
  for (const row of value.slice(0, MAX_ROWS)) {
    const content = cleanText(row?.content, 80)
    const monthlyQty = parseQty(row?.monthlyQty)
    if (!content && !row?.monthlyQty) continue
    if (!content || monthlyQty == null) return null
    rows.push({ content, monthlyQty })
  }
  return rows
}

function parseRewards(value: unknown): SetupReward[] | null {
  if (!Array.isArray(value)) return null
  const rows: SetupReward[] = []
  for (const row of value.slice(0, MAX_ROWS)) {
    const name = cleanText(row?.name, 80)
    const visits = parseQty(row?.visits)
    const rawCap = row?.monthlyQty
    const monthlyQty = rawCap === '' || rawCap == null ? null : parseQty(rawCap)
    if (!name && !row?.visits && (rawCap === '' || rawCap == null)) continue
    if (!name || visits == null) return null
    if (rawCap !== '' && rawCap != null && monthlyQty == null) return null
    rows.push({ name, visits, monthlyQty })
  }
  return rows
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '내용을 확인할 수 없습니다.' }, { status: 400 })

  const storeName = cleanText(body.storeName, 80)
  const address = cleanText(body.address, 200)
  const phone = cleanText(body.phone, 30)
  const salespersonName = cleanText(body.salespersonName, 40)
  const salespersonPhone = cleanText(body.salespersonPhone, 30)
  const products = Array.isArray(body.products)
    ? [...new Set(body.products.map((id: unknown) => String(id)))] as SetupProductId[]
    : []

  if (!storeName || !address || !phone || !salespersonName || !salespersonPhone) {
    return NextResponse.json({ error: '매장명, 주소, 광고주 연락처, 영업담당자 이름과 연락처는 필수입니다.' }, { status: 400 })
  }
  if (phone.replace(/\D/g, '').length < 8 || salespersonPhone.replace(/\D/g, '').length < 8) {
    return NextResponse.json({ error: '연락처를 다시 확인해 주세요.' }, { status: 400 })
  }
  if (products.length === 0 || products.some((id) => !PRODUCT_IDS.has(id))) {
    return NextResponse.json({ error: '신청 상품을 하나 이상 선택해 주세요.' }, { status: 400 })
  }

  const wantsDangolting = products.includes('dangolting')
  const hqCall = Boolean(body.hqCall)
  const prizes = parsePrizes(body.prizes)
  const rewards = parseRewards(body.rewards)
  if (!prizes || !rewards) {
    return NextResponse.json({ error: '경품과 리워드의 내용, 수량을 숫자로 적어 주세요.' }, { status: 400 })
  }

  const daangnUrl = cleanText(body.daangnUrl, 300)
  if (wantsDangolting && !hqCall) {
    if (prizes.length === 0) {
      return NextResponse.json({ error: '게임 경품을 하나 이상 적어 주세요. 어려우면 본사 통화를 선택해 주세요.' }, { status: 400 })
    }
    if (rewards.length === 0) {
      return NextResponse.json({ error: '방문하면 주는 메뉴를 하나 이상 적어 주세요.' }, { status: 400 })
    }
    if (!daangnUrl) {
      return NextResponse.json({ error: '당근 단골 주소를 적어 주세요. 모르면 본사 통화를 선택해 주세요.' }, { status: 400 })
    }
  }

  const openDate = cleanText(body.openDate, 10)
  if (openDate && !/^\d{4}-\d{2}-\d{2}$/.test(openDate)) {
    return NextResponse.json({ error: '오픈 희망일 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase.from('setup_requests').insert({
    store_name: storeName,
    address,
    phone,
    salesperson_name: salespersonName,
    salesperson_phone: salespersonPhone,
    products,
    hq_call: hqCall,
    prizes: wantsDangolting ? prizes : [],
    rewards: wantsDangolting ? rewards : [],
    daangn_url: daangnUrl || null,
    naver_review_url: cleanText(body.naverReviewUrl, 300) || null,
    google_review_url: cleanText(body.googleReviewUrl, 300) || null,
    naver_place_url: cleanText(body.naverPlaceUrl, 300) || null,
    intro: cleanText(body.intro, 200) || null,
    business_hours: cleanText(body.businessHours, 80) || null,
    open_date: openDate || null,
    photo_via_kakao: Boolean(body.photoViaKakao),
    memo: cleanText(body.memo, 1000) || null,
  })

  if (error) {
    console.error('[setup-requests]', error.message)
    return NextResponse.json({ error: '접수에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
