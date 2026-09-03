import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { safeHttpUrl } from '@/lib/store/profileUrls'
import { getLiveStats } from '@/lib/business-page/trustMetrics'
import { resolveBusinessType } from '@/lib/business-page/businessTypeLabels'
import { getSubscriptionStatus } from '@/lib/admin/subscription'
import { getStoreAddons } from '@/lib/admin/storeAddons'
import BusinessPageView from './BusinessPageView'

interface Props {
  params: Promise<{ storeId: string }>
}

async function loadData(storeId: string) {
  const supabase = createServerClient()

  const [contractRes, entityRes, mediaRes, faqRes, linksRes, eventRes, productsRes, rewardCountRes, subscription, addons] = await Promise.all([
    supabase
      .from('store_contracts')
      .select('store_name, address, phone, website, daangn_url, kakao_channel_url, is_demo')
      .eq('store_id', storeId)
      .maybeSingle(),
    supabase.from('business_entity').select('*').eq('store_id', storeId).maybeSingle(),
    supabase.from('business_media').select('media_type, url').eq('store_id', storeId).order('sort_order'),
    supabase.from('business_faq').select('question, answer').eq('store_id', storeId).order('sort_order'),
    supabase.from('business_external_links').select('platform, url').eq('store_id', storeId).order('sort_order'),
    supabase.from('events').select('id, name').eq('store_id', storeId).eq('status', 'active').maybeSingle(),
    supabase.from('business_products').select('name, image_url, price, description').eq('store_id', storeId).order('sort_order'),
    supabase.from('reward_catalog').select('id', { count: 'exact', head: true }).eq('store_id', storeId).eq('active', true),
    getSubscriptionStatus(storeId),
    getStoreAddons(storeId),
  ])

  if (!contractRes.data) return null

  // 이용기간 유예(7일) 초과 시 "지금 진행중인 이벤트" 섹션이 자연히 숨겨지도록 이벤트를
  // 못 찾은 것처럼 취급한다 (아래 eventName/tierLabels가 비어 기존 조건부 렌더링 재사용).
  // /play/[storeId]/page.tsx와 동일한 판단 기준.
  const isAccessBlocked = subscription.status === 'expired'
  const effectiveEvent = isAccessBlocked ? null : eventRes.data

  let tiers: { label: string }[] = []
  if (effectiveEvent) {
    const { data } = await supabase
      .from('prize_tiers')
      .select('label')
      .eq('event_id', effectiveEvent.id)
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
    tagline: null,
    game_cta_label: null,
    business_hours: null,
    naver_review_url: null,
    google_review_url: null,
    business_type: 'service',
    parking_info: null,
    pet_friendly: false,
    store_pride_points: [],
  }

  const liveStats = entity.show_trust_metrics ? await getLiveStats(storeId) : null

  // 매장 홈페이지는 유료 애드온(store_addons.homepage_feature_enabled)이 켜져있어야 하고,
  // 그 위에 광고주 본인이 끄고 켤 수 있는 business_entity.homepage_enabled도 true여야 공개된다.
  // 결제 게이트(상위)가 false면 광고주의 설정값과 무관하게 무조건 "준비중" 화면으로 대체 —
  // 이 값이 false로 내려가면 BusinessPageView가 즉시 "준비중" 화면을 반환하므로
  // onlinePlayEnabled(게임 진입 버튼)도 자연히 함께 숨겨진다 (상위-하위 스위치 관계).
  const homepageEnabled = addons.homepageFeatureEnabled && entity.homepage_enabled !== false

  return {
    storeId,
    storeName: contractRes.data.store_name || storeId,
    isDemo: contractRes.data.is_demo === true,
    address: contractRes.data.address ?? null,
    phone: contractRes.data.phone ?? null,
    daangnUrl: safeHttpUrl(contractRes.data.daangn_url),
    kakaoChannelUrl: safeHttpUrl(contractRes.data.kakao_channel_url),
    homepageEnabled,
    onlinePlayEnabled: homepageEnabled && entity.online_play_enabled === true,
    category: entity.category as string | null,
    description: entity.description as string | null,
    tagline: entity.tagline as string | null,
    gameCtaLabel: entity.game_cta_label as string | null,
    businessHours: entity.business_hours as string | null,
    naverReviewUrl: safeHttpUrl(entity.naver_review_url as string | null),
    googleReviewUrl: safeHttpUrl(entity.google_review_url as string | null),
    businessType: resolveBusinessType(entity.business_type),
    parkingInfo: entity.parking_info as string | null,
    petFriendly: entity.pet_friendly === true,
    pridePoints: (entity.store_pride_points as string[] | null) ?? [],
    logoUrl: mediaRes.data?.find((m) => m.media_type === 'LOGO')?.url ?? null,
    coverUrl: mediaRes.data?.find((m) => m.media_type === 'COVER')?.url ?? null,
    storePhotos: (mediaRes.data ?? []).filter((m) => m.media_type === 'STORE').map((m) => m.url),
    faq: faqRes.data ?? [],
    externalLinks: linksRes.data ?? [],
    eventName: effectiveEvent?.name ?? null,
    tierLabels: tiers.map((t) => t.label),
    products: productsRes.data ?? [],
    activeRewardCount: rewardCountRes.count ?? 0,
    liveStats,
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
    // 영업 시연용 샘플 매장은 접속은 되지만 검색결과에는 노출되지 않아야 한다
    ...(data.isDemo ? { robots: { index: false, follow: false } } : {}),
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
