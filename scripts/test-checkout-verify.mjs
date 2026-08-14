/**
 * 전 경품 확인 + 계산대 대기번호 테스트
 * 실행: node --env-file=.env.local scripts/test-checkout-verify.mjs
 *
 * 사전: Migration 028 실행
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const BASE_URL     = process.env.NEXT_PUBLIC_APP_URL ?? ''

const h = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function sb(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method, headers: h, body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return { status: res.status, data: text ? JSON.parse(text) : null }
}

async function rpc(name, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: h, body: JSON.stringify(args),
  })
  const text = await res.text()
  return { status: res.status, data: text ? JSON.parse(text) : null }
}

async function run() {
  console.log('\n========== 전 경품 확인 / 계산대 테스트 ==========\n')
  const storeId = 'chj-001'
  const userA = 'test-checkout-aaa'
  const userB = 'test-checkout-bbb'

  const { data: evs } = await sb('GET', `/events?store_id=eq.${storeId}&select=id&limit=1`)
  const eventId = evs?.[0]?.id
  if (!eventId) { console.error('이벤트 없음'); process.exit(1) }

  // 1) 1,000원 쿠폰 → pending_verify
  console.log('── 1. 1,000원 쿠폰 발급 상태 ──')
  const { status: ins, data: coupons } = await sb('POST', '/coupons', [{
    event_id: eventId, store_id: storeId, kakao_user_id: userA,
    status: 'pending_verify', amount: 1000, source_type: 'game_win',
    requires_verification: true,
    valid_until: new Date(Date.now() + 14 * 86400000).toISOString(),
  }])
  const couponA = coupons?.[0]
  console.log('insert', ins, '| status=', couponA?.status, '| amount=', couponA?.amount)
  console.log(couponA?.status === 'pending_verify' ? '  ✅ 즉시 used/issued 아님' : '  ❌ 상태 오류')

  const useRes = await fetch(`${BASE_URL}/api/coupons/use`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coupon_id: couponA.id }),
  })
  const useJson = await useRes.json()
  console.log('즉시 사용 API:', useRes.status, useJson.error)
  console.log(useRes.status === 400 ? '  ✅ 즉시 사용 차단' : '  ❌ 즉시 사용이 열림')

  // 2) 리워드 발급 상태
  console.log('\n── 2. 리워드 발급 ──')
  const { data: cats } = await sb('POST', '/reward_catalog', [{
    store_id: storeId, name: '[테스트] 확인필수 리워드', point_cost: 100, active: true, requires_verification: true,
  }])
  const catId = cats?.[0]?.id
  const { data: issued } = await sb('POST', '/rewards_issued', [{
    reward_catalog_id: catId, store_id: storeId, kakao_user_id: userA, status: 'pending_verify',
  }])
  console.log('reward status=', issued?.[0]?.status)
  console.log(issued?.[0]?.status === 'pending_verify' ? '  ✅ 리워드도 확인 대기' : '  ❌')

  const rUse = await fetch(`${BASE_URL}/api/rewards/use`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reward_issued_id: issued?.[0]?.id }),
  })
  console.log('리워드 즉시사용:', rUse.status, (await rUse.json()).error)
  console.log(rUse.status === 400 ? '  ✅ 차단' : '  ❌')

  // 3) 두 명 QR 대기번호
  console.log('\n── 3. 두 명 대기번호 ──')
  const { data: couponB } = (await sb('POST', '/coupons', [{
    event_id: eventId, store_id: storeId, kakao_user_id: userB,
    status: 'pending_verify', amount: 2000, source_type: 'game_win',
    requires_verification: true,
    valid_until: new Date(Date.now() + 14 * 86400000).toISOString(),
  }])).data

  const q1 = await rpc('assign_checkout_queue', {
    p_store_id: storeId, p_kakao_user_id: userA, p_item_type: 'coupon',
    p_item_id: couponA.id, p_label: '1000원', p_amount: 1000,
  })
  const q2 = await rpc('assign_checkout_queue', {
    p_store_id: storeId, p_kakao_user_id: userB, p_item_type: 'coupon',
    p_item_id: couponB?.[0]?.id, p_label: '2000원', p_amount: 2000,
  })
  console.log('A:', JSON.stringify(q1.data))
  console.log('B:', JSON.stringify(q2.data))
  const code1 = q1.data?.display_code
  const code2 = q2.data?.display_code
  console.log(code1 && code2 && code1 !== code2 ? `  ✅ 서로 다른 번호 (${code1} / ${code2})` : '  ❌ 번호 충돌 또는 RPC 실패')

  // 4) 승인 API 무인증 → 401
  console.log('\n── 4. 승인 API 권한 ──')
  const unauth = await fetch(`${BASE_URL}/api/checkout/${storeId}/approve`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'confirm', item_type: 'coupon', item_id: couponA.id }),
  })
  const unauthJson = await unauth.json()
  console.log('무인증:', unauth.status, unauthJson.error)
  console.log(unauth.status === 401 || unauth.status === 403 ? '  ✅ 비직원 차단' : '  ❌')

  const otherStore = await fetch(`${BASE_URL}/api/checkout/other-store-999/approve`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'confirm', item_type: 'coupon', item_id: couponA.id }),
  })
  console.log('다른 매장 경로 무인증:', otherStore.status, (await otherStore.json()).error)
  console.log(otherStore.status === 401 || otherStore.status === 403 ? '  ✅ 매장 불일치/무인증 차단' : '  ❌')

  // 정리
  console.log('\n── 정리 ──')
  if (couponA?.id) await sb('DELETE', `/coupons?id=eq.${couponA.id}`)
  if (couponB?.[0]?.id) await sb('DELETE', `/coupons?id=eq.${couponB[0].id}`)
  if (issued?.[0]?.id) await sb('DELETE', `/rewards_issued?id=eq.${issued[0].id}`)
  if (catId) {
    await sb('DELETE', `/rewards_issued?reward_catalog_id=eq.${catId}`)
    await sb('DELETE', `/reward_catalog?id=eq.${catId}`)
  }
  await sb('DELETE', `/checkout_queue?kakao_user_id=eq.${userA}`)
  await sb('DELETE', `/checkout_queue?kakao_user_id=eq.${userB}`)
  console.log('완료')
}

run().catch((e) => { console.error(e); process.exit(1) })
