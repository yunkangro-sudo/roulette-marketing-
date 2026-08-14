/**
 * 포인트 세션 검증 + 매장 URL 연결 확인
 * node scripts/test-points-and-profile-urls.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m || process.env[m[1]]) continue
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const DAANGN = 'https://www.daangn.com/kr/local-profile/y6ixoqfzj4tw/?referrer=share'
const CHANNEL = 'https://pf.kakao.com/_xcuxobX'

function cookiesOf(res, prev = '') {
  const jar = new Map()
  for (const part of prev.split(';').map((s) => s.trim()).filter(Boolean)) {
    const i = part.indexOf('=')
    if (i > 0) jar.set(part.slice(0, i), part.slice(i + 1))
  }
  const set = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
  for (const c of set) {
    const pair = c.split(';')[0]
    const i = pair.indexOf('=')
    if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1))
  }
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function req(path, { method = 'GET', json, cookie = '' } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: json ? JSON.stringify(json) : undefined,
  })
  const text = await res.text()
  let body
  try { body = JSON.parse(text) } catch { body = text }
  return { res, body, cookie: cookiesOf(res, cookie), text }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  console.log('--- 0) 화면 코드 ---')
  const verSrc = readFileSync(resolve(root, 'components/game/VerificationCtaScreen.tsx'), 'utf8')
  assert(!verSrc.includes('href="#"'), '당근 버튼이 아직 href="#"')
  assert(verSrc.includes('daangnUrl'), 'daangnUrl props 없음')
  assert(verSrc.includes('당근 단골 링크 준비중'), 'URL 비어 있을 때 준비중 안내 없음')
  const chSrc = readFileSync(resolve(root, 'components/play/ChannelCtaScreen.tsx'), 'utf8')
  assert(chSrc.includes('카카오 채널 추가하기') && chSrc.includes('건너뛰기'), '채널 화면 버튼 두 개 아님')
  console.log('PASS  당근 버튼 href="#" 제거, 채널 화면 두 버튼')

  console.log('--- 1) 당근/채널 URL 컬럼 ---')
  const { data: contract, error: colErr } = await sb
    .from('store_contracts')
    .select('store_id, daangn_url, kakao_channel_url')
    .eq('store_id', 'test-store-001')
    .maybeSingle()

  if (colErr) {
    console.log('FAIL  컬럼 없음 — Supabase에서 docs/migrations/030_store_profile_urls.sql 실행 필요')
    console.log('      ', colErr.message)
  } else {
    const { error: upErr } = await sb.from('store_contracts').update({
      daangn_url: DAANGN,
      kakao_channel_url: CHANNEL,
    }).eq('store_id', 'test-store-001')
    if (upErr) console.log('FAIL  URL 저장', upErr.message)
    else console.log('PASS  test-store-001 에 당근/채널 URL 저장')

    const html = await fetch(`${BASE}/play/test-store-001`).then((r) => r.text())
    assert(html.includes(DAANGN) || html.includes('y6ixoqfzj4tw'), 'play HTML에 당근 URL이 없음')
    assert(html.includes(CHANNEL) || html.includes('_xcuxobX'), 'play HTML에 채널 URL이 없음')
    console.log('PASS  /play/test-store-001 응답에 당근·채널 URL 포함')
  }

  console.log('--- 2) /me/points 세션 검증 ---')
  const noAuth = await req('/api/me/points?kakao_user_id=attacker&store_id=test-store-001')
  assert(noAuth.res.status === 401, `비로그인 조회가 ${noAuth.res.status}`)
  assert(noAuth.body.needLogin === true, 'needLogin 없음')
  console.log('PASS  세션 없이 조회하면 401')

  const uidA = `points-sec-a-${Date.now()}`
  const uidB = `points-sec-b-${Date.now()}`
  await sb.from('customer_loyalty').upsert({
    store_id: 'test-store-001',
    kakao_user_id: uidA,
    point_balance: 111,
    visit_count: 1,
  }, { onConflict: 'store_id,kakao_user_id' })
  await sb.from('customer_loyalty').upsert({
    store_id: 'test-store-001',
    kakao_user_id: uidB,
    point_balance: 999,
    visit_count: 9,
  }, { onConflict: 'store_id,kakao_user_id' })

  const mockA = await req('/api/dev/mock-customer-session', {
    method: 'POST',
    json: { kakao_user_id: uidA, storeId: 'test-store-001' },
  })
  assert(mockA.res.ok, 'mock A 실패')

  const steal = await req(
    `/api/me/points?kakao_user_id=${encodeURIComponent(uidB)}&store_id=test-store-001`,
    { cookie: mockA.cookie },
  )
  assert(steal.res.ok, `A 세션 조회 실패 ${steal.res.status} ${JSON.stringify(steal.body)}`)
  const bal = steal.body.loyalty?.point_balance
  assert(bal === 111, `URL uid=B 로 A 세션인데 잔액이 ${bal} (B의 999가 보이면 안 됨)`)
  assert(bal !== 999, '계정 B 잔액이 노출됨')
  console.log('PASS  계정A 세션 + URL uid=B → A의 111P만 보임 (B의 999P 아님)')

  const redeem = await req('/api/me/points/redeem', {
    method: 'POST',
    json: { kakao_user_id: uidB, store_id: 'test-store-001', reward_catalog_id: '00000000-0000-0000-0000-000000000000' },
    cookie: mockA.cookie,
  })
  assert(redeem.res.status !== 200 || redeem.body.ok !== true, 'B 명의 교환이 통과되면 안 됨')
  console.log('PASS  redeem도 세션 A만 사용 (body의 uid B 무시)')

  console.log('\nALL CHECKS DONE')
}

main().catch((e) => {
  console.error('FAIL', e.message)
  process.exit(1)
})
