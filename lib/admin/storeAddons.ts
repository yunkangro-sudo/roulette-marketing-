import { createServerClient } from '@/lib/supabase/server'

/**
 * 매장별 유료 부가기능 게이팅 (store_addons 테이블).
 * 지금은 "매장 홈페이지" 기능 하나뿐이지만, 이후 다른 유료 애드온이 추가되면
 * 이 파일에 필드를 늘려서 재사용한다.
 */
export interface StoreAddons {
  homepageFeatureEnabled: boolean
  /** 마지막으로 true로 전환된 시각 (ISO). 한 번도 켜진 적 없으면 null */
  homepageFeatureEnabledAt: string | null
}

const DEFAULT_ADDONS: StoreAddons = { homepageFeatureEnabled: false, homepageFeatureEnabledAt: null }

export async function getStoreAddons(storeId: string | null | undefined): Promise<StoreAddons> {
  if (!storeId) return DEFAULT_ADDONS

  const supabase = createServerClient()
  const { data } = await supabase
    .from('store_addons')
    .select('homepage_feature_enabled, homepage_feature_enabled_at')
    .eq('store_id', storeId)
    .maybeSingle()

  if (!data) return DEFAULT_ADDONS
  return {
    homepageFeatureEnabled: data.homepage_feature_enabled === true,
    homepageFeatureEnabledAt: data.homepage_feature_enabled_at ?? null,
  }
}

/** 여러 매장을 한 번에 조회 (N+1 방지) — 슈퍼관리자 "업체 구독관리" 목록에서 사용 */
export async function getStoreAddonsBulk(storeIds: string[]): Promise<Map<string, StoreAddons>> {
  const map = new Map<string, StoreAddons>()
  if (storeIds.length === 0) return map

  const supabase = createServerClient()
  const { data } = await supabase
    .from('store_addons')
    .select('store_id, homepage_feature_enabled, homepage_feature_enabled_at')
    .in('store_id', storeIds)

  for (const row of data ?? []) {
    map.set(row.store_id, {
      homepageFeatureEnabled: row.homepage_feature_enabled === true,
      homepageFeatureEnabledAt: row.homepage_feature_enabled_at ?? null,
    })
  }
  return map
}

/**
 * 광고주 admin이 "매장 홈페이지" 기능(화면/API)에 접근 가능한지 판정.
 * super_admin/agency(대리접속 아닌 상태로 다른 매장 관리)는 결제 게이트와 무관하게 항상 허용 —
 * 결제 확인 전에 미리 내용을 세팅해줄 수 있어야 하기 때문. advertiser(대리접속 포함)만 게이팅한다.
 */
export async function canAccessHomepageFeature(
  account: { role: string; storeId: string | null },
  storeId: string | null
): Promise<boolean> {
  if (account.role !== 'advertiser') return true
  if (!storeId) return false
  const addons = await getStoreAddons(storeId)
  return addons.homepageFeatureEnabled
}
