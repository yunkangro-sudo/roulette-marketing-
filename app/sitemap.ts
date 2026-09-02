import type { MetadataRoute } from 'next'
import { createServerClient } from '@/lib/supabase/server'

const BASE_URL = 'https://www.dgting.co.kr'

/**
 * homepage_enabled가 false인 매장의 /b/{slug}는 사이트맵에서 제외한다.
 * business_entity row가 없는 매장은 기본값(true)으로 취급하므로 포함한다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient()

  const [contractsRes, entitiesRes] = await Promise.all([
    supabase.from('store_contracts').select('store_id, updated_at'),
    supabase.from('business_entity').select('store_id, homepage_enabled'),
  ])

  const disabledStoreIds = new Set(
    (entitiesRes.data ?? []).filter((e) => e.homepage_enabled === false).map((e) => e.store_id),
  )

  const businessPages: MetadataRoute.Sitemap = (contractsRes.data ?? [])
    .filter((c) => !disabledStoreIds.has(c.store_id))
    .map((c) => ({
      url: `${BASE_URL}/b/${c.store_id}`,
      lastModified: c.updated_at ?? undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  return [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    ...businessPages,
  ]
}
