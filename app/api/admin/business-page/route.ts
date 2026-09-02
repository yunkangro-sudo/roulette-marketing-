import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'

/** advertiser → 자기 storeId 강제, 그 외 → 쿼리/바디의 store_id 사용 */
function resolveStoreId(account: { role: string; storeId: string | null }, provided: string | null): string | null {
  if (account.role === 'advertiser') return account.storeId
  return provided
}

/**
 * GET /api/admin/business-page?store_id=xxx
 *
 * business_entity 없으면 기본값(homepage_enabled=true, online_play_enabled=false)으로
 * 응답한다 — 실제 row 생성은 POST(첫 저장) 시점에 이뤄진다. address/phone/website는
 * store_contracts가 정답 소스라 여기서 중복 저장하지 않고 조회만 같이 내려준다.
 */
export async function GET(req: Request) {
  const account = await requireAdminAuth()

  const { searchParams } = new URL(req.url)
  const storeId = resolveStoreId(account, searchParams.get('store_id'))
  if (!storeId) {
    return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })
  }

  const supabase = createServerClient()
  const [entityRes, contractRes, mediaRes, faqRes, linksRes] = await Promise.all([
    supabase.from('business_entity').select('*').eq('store_id', storeId).maybeSingle(),
    supabase.from('store_contracts').select('store_name, address, phone, website, daangn_url, kakao_channel_url').eq('store_id', storeId).maybeSingle(),
    supabase.from('business_media').select('id, media_type, url, sort_order').eq('store_id', storeId).order('sort_order'),
    supabase.from('business_faq').select('id, question, answer, sort_order').eq('store_id', storeId).order('sort_order'),
    supabase.from('business_external_links').select('id, platform, url, sort_order').eq('store_id', storeId).order('sort_order'),
  ])

  const entity = entityRes.data ?? {
    store_id: storeId,
    homepage_enabled: true,
    online_play_enabled: false,
    show_trust_metrics: true,
    category: null,
    description: null,
    business_hours: null,
    naver_review_url: null,
    google_review_url: null,
  }

  return NextResponse.json({
    ...entity,
    store_name: contractRes.data?.store_name ?? null,
    address: contractRes.data?.address ?? null,
    phone: contractRes.data?.phone ?? null,
    website: contractRes.data?.website ?? null,
    daangn_url: contractRes.data?.daangn_url ?? null,
    kakao_channel_url: contractRes.data?.kakao_channel_url ?? null,
    media: mediaRes.data ?? [],
    faq: faqRes.data ?? [],
    external_links: linksRes.data ?? [],
  })
}

interface MediaInput { media_type: 'LOGO' | 'COVER' | 'STORE'; url: string }
interface FaqInput { question: string; answer: string }
interface LinkInput { platform: string; url: string }

/**
 * POST /api/admin/business-page
 * body: {
 *   store_id, homepage_enabled, online_play_enabled, show_trust_metrics,
 *   category, description, business_hours, naver_review_url, google_review_url,
 *   media: [{media_type, url}], faq: [{question, answer}], external_links: [{platform, url}]
 * }
 *
 * media/faq/external_links는 매번 전체 교체(삭제 후 재삽입) — 목록이 짧고
 * 다른 테이블이 FK로 참조하지 않아 안전하다 (prize_tiers처럼 부분 diff할 필요 없음).
 */
export async function POST(req: Request) {
  const account = await requireAdminAuth()
  if (account.role === 'staff') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const {
    store_id, homepage_enabled, online_play_enabled, show_trust_metrics,
    category, description, business_hours, naver_review_url, google_review_url,
    media, faq, external_links,
  } = body ?? {}

  const storeId = resolveStoreId(account, store_id)
  if (!storeId) {
    return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { error: entityError } = await supabase.from('business_entity').upsert({
    store_id: storeId,
    homepage_enabled: homepage_enabled !== false,
    online_play_enabled: online_play_enabled === true,
    show_trust_metrics: show_trust_metrics !== false,
    category: category?.trim() || null,
    description: description?.trim() || null,
    business_hours: business_hours?.trim() || null,
    naver_review_url: naver_review_url?.trim() || null,
    google_review_url: google_review_url?.trim() || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'store_id' })

  if (entityError) return NextResponse.json({ error: entityError.message }, { status: 500 })

  const mediaInput: MediaInput[] = Array.isArray(media) ? media : []
  const faqInput: FaqInput[] = Array.isArray(faq) ? faq : []
  const linksInput: LinkInput[] = Array.isArray(external_links) ? external_links : []

  const [, , ] = await Promise.all([
    supabase.from('business_media').delete().eq('store_id', storeId),
    supabase.from('business_faq').delete().eq('store_id', storeId),
    supabase.from('business_external_links').delete().eq('store_id', storeId),
  ])

  const inserts: PromiseLike<{ error: { message: string } | null }>[] = []

  if (mediaInput.length > 0) {
    inserts.push(
      supabase.from('business_media').insert(
        mediaInput.map((m, i) => ({ store_id: storeId, media_type: m.media_type, url: m.url, sort_order: i })),
      ),
    )
  }
  if (faqInput.length > 0) {
    inserts.push(
      supabase.from('business_faq').insert(
        faqInput
          .filter((f) => f.question?.trim() && f.answer?.trim())
          .map((f, i) => ({ store_id: storeId, question: f.question.trim(), answer: f.answer.trim(), sort_order: i })),
      ),
    )
  }
  if (linksInput.length > 0) {
    inserts.push(
      supabase.from('business_external_links').insert(
        linksInput
          .filter((l) => l.platform?.trim() && l.url?.trim())
          .map((l, i) => ({ store_id: storeId, platform: l.platform.trim(), url: l.url.trim(), sort_order: i })),
      ),
    )
  }

  const results = await Promise.all(inserts)
  const failed = results.find((r) => r.error)
  if (failed?.error) {
    return NextResponse.json({ error: '일부 항목 저장 실패: ' + failed.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
