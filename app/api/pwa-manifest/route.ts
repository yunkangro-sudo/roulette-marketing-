import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/pwa-manifest?store_id=xxx
 *
 * "내 쿠폰함 — 홈화면에 추가" 기능용 매장별 동적 Web App Manifest.
 * 이 서비스는 단일 도메인(dgting.co.kr)을 여러 매장이 store_id로 나눠 쓰는
 * 멀티테넌트 구조라, manifest.json을 정적 파일 하나로 고정하면 손님이
 * 홈화면 아이콘으로 어느 매장의 쿠폰함을 열어야 하는지 알 수 없다.
 * → 접속한 매장의 store_id를 start_url에 심고, 앱 이름도 매장명으로 채워서
 *   여러 매장을 이용하는 손님이 홈화면에서 서로 구분할 수 있게 한다.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('store_id') || ''

  let storeName = ''
  if (storeId) {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('store_contracts')
      .select('store_name')
      .eq('store_id', storeId)
      .maybeSingle()
    storeName = data?.store_name?.trim() || ''
  }

  const appName = storeName ? `${storeName} 쿠폰함` : '단골팅 내 쿠폰함'
  // 홈화면 이름은 길면 잘리므로 최대한 짧게 — 매장명 자체가 짧은 경우가 많아 그대로 사용
  const shortName = storeName || '단골팅'

  const startUrl = storeId
    ? `/me/points?store_id=${encodeURIComponent(storeId)}&pwa=1`
    : '/me/points'

  const manifest = {
    id: storeId ? `/me/points?store_id=${storeId}` : '/me/points',
    name: appName,
    short_name: shortName,
    description: '내 쿠폰함 — 포인트·쿠폰·스탬프를 한 곳에서 확인하세요',
    start_url: startUrl,
    scope: '/me/points',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#EFE6D6',
    theme_color: '#00C7A7',
    lang: 'ko',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      // 매장명이 바뀌거나 아이콘을 업데이트해도 손님 브라우저가 오래된 manifest를
      // 계속 들고 있지 않도록 짧게만 캐시한다 (설치 자체와는 무관, manifest 파일 캐싱임).
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
