import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { safeHttpUrl } from '@/lib/store/profileUrls'
import { getTrustMetrics } from '@/lib/business-page/trustMetrics'
import BusinessPageView from './BusinessPageView'

interface Props {
  params: Promise<{ storeId: string }>
}

async function loadData(storeId: string) {
  const supabase = createServerClient()

  const [contractRes, entityRes, mediaRes, faqRes, linksRes, eventRes] = await Promise.all([
    supabase
      .from('store_contracts')
      .select('store_name, address, phone, website, daangn_url, kakao_channel_url')
      .eq('store_id', storeId)
      .maybeSingle(),
    supabase.from('business_entity').select('*').eq('store_id', storeId).maybeSingle(),
    supabase.from('business_media').select('media_type, url').eq('store_id', storeId).order('sort_order'),
    supabase.from('business_faq').select('question, answer').eq('store_id', storeId).order('sort_order'),
    supabase.from('business_external_links').select('platform, url').eq('store_id', storeId).order('sort_order'),
    supabase.from('events').select('id, name').eq('store_id', storeId).eq('status', 'active').maybeSingle(),
  ])

  if (!contractRes.data) return null

  let tiers: { label: string }[] = []
  if (eventRes.data) {
    const { data } = await supabase
      .from('prize_tiers')
      .select('label')
      .eq('event_id', eventRes.data.id)
      .neq('label', '꽝')
      .order('amount', { ascending: true })
    tiers = data ?? []
  }

  // business_entity row가 아직 없으면(광고주가 설정 화면을 한 번도 안 열어본 경우)
  // "기본이 있고"라는 방침대로 기본값으로 취급 — homepage_enabled=true, online_play_enabled=false.
  const entity = entityRes.data ?? {
    homepage_enabled: true,
    online_play_enabled: false,
    show_trust_metrics: true,
    category: null,
    description: null,
    business_hours: null,
    naver_review_url: null,
    google_review_url: null,
  }

  const trustMetrics = entity.show_trust_metrics ? await getTrustMetrics(storeId) : null

  return {
    storeId,
    storeName: contractRes.data.store_name || storeId,
    address: contractRes.data.address ?? null,
    phone: contractRes.data.phone ?? null,
    daangnUrl: safeHttpUrl(contractRes.data.daangn_url),
    kakaoChannelUrl: safeHttpUrl(contractRes.data.kakao_channel_url),
    homepageEnabled: entity.homepage_enabled !== false,
    onlinePlayEnabled: entity.online_play_enabled === true,
    category: entity.category as string | null,
    description: entity.description as string | null,
    businessHours: entity.business_hours as string | null,
    naverReviewUrl: safeHttpUrl(entity.naver_review_url as string | null),
    googleReviewUrl: safeHttpUrl(entity.google_review_url as string | null),
    logoUrl: mediaRes.data?.find((m) => m.media_type === 'LOGO')?.url ?? null,
    coverUrl: mediaRes.data?.find((m) => m.media_type === 'COVER')?.url ?? null,
    storePhotos: (mediaRes.data ?? []).filter((m) => m.media_type === 'STORE').map((m) => m.url),
    faq: faqRes.data ?? [],
    externalLinks: linksRes.data ?? [],
    eventName: eventRes.data?.name ?? null,
    tierLabels: tiers.map((t) => t.label),
    trustMetrics,
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeId } = await params
  const data = await loadData(storeId)
  if (!data) return { title: '매장을 찾을 수 없습니다' }

  const title = `${data.storeName}${data.category ? ` — ${data.category}` : ''}`
  const description = data.description || `${data.storeName}의 소개 페이지입니다. 게임 한 판으로 쿠폰도 받아가세요.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.dgting.co.kr/b/${storeId}`,
      images: data.coverUrl ? [data.coverUrl] : data.logoUrl ? [data.logoUrl] : undefined,
      type: 'website',
    },
  }
}

export default async function BusinessPage({ params }: Props) {
  const { storeId } = await params
  const data = await loadData(storeId)
  if (!data) notFound()

  return <BusinessPageView data={data} />
}
