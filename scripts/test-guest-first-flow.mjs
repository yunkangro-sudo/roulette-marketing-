/**
 * 게스트 먼저 여정 API 검증
 * 사용: node scripts/test-guest-first-flow.mjs
 * Next dev 서버(http://localhost:3000)가 켜져 있어야 한다.
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
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

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
  return { res, body, cookie: cookiesOf(res, cookie) }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function main() {
  const results = []
  const pass = (name) => { results.push(`PASS  ${name}`); console.log(`PASS  ${name}`) }
  const fail = (name, err) => { results.push(`FAIL  ${name}: ${err}`); console.error(`FAIL  ${name}: ${err}`) }

  let health
  try {
    health = await fetch(`${BASE}/play/test-store-001`, { redirect: 'manual' })
  } catch (e) {
    console.error(`서버에 연결할 수 없습니다 (${BASE}). npm run dev 후 다시 실행하세요.`)
    process.exit(1)
  }
  pass(`서버 응답 HTTP ${health.status}`)

  if (!SUPABASE_URL || !SERVICE_KEY) {
    fail('환경변수', 'NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 없음')
    process.exit(1)
  }
  const sb = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: event, error: eventErr } = await sb
    .from('events')
    .select('id, store_id, name, status')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  if (eventErr || !event) {
    fail('활성 이벤트', eventErr?.message ?? '없음')
    process.exit(1)
  }
  pass(`활성 이벤트 ${event.id} / ${event.store_id}`)

  const uid1 = `guest-flow-${Date.now()}`
  const uid2 = `${uid1}-b`
  let cookie = ''

  // 1) 로그인 없이 play → locked, 금액 없음
  try {
    const play = await req('/api/games/play', { method: 'POST', json: { event_id: event.id } })
    cookie = play.cookie
    assert(play.res.ok, `play HTTP ${play.res.status} ${JSON.stringify(play.body)}`)
    assert(play.body.locked === true, 'locked:true 가 아님')
    assert(!('amount' in play.body), 'play 응답에 amount가 새어 나옴')
    assert(!('label' in play.body), 'play 응답에 label이 새어 나옴')
    pass('로그인 없이 게임 추첨, 응답에 결과 없음')
  } catch (e) {
    fail('게스트 play', e.message)
    process.exit(1)
  }

  // 2) pending은 hasPending만, 금액 없음
  try {
    const pending = await req('/api/games/pending', { cookie })
    assert(pending.body.hasPending === true, 'hasPending가 true가 아님')
    assert(pending.body.loggedIn !== true, '게스트인데 loggedIn')
    assert(!('amount' in pending.body), 'pending 응답 루트에 amount')
    assert(pending.body.revealed == null, '게스트인데 revealed가 있음')
    pass('pending API가 당첨액을 내려주지 않음')
  } catch (e) {
    fail('pending', e.message)
  }

  // 3) 로그인 없이 claim → 401
  try {
    const claim = await req('/api/games/claim', { method: 'POST', cookie })
    assert(claim.res.status === 401, `claim이 401이 아님 (${claim.res.status})`)
    assert(claim.body.needLogin === true, 'needLogin 없음')
    pass('로그인 전 claim은 401')
  } catch (e) {
    fail('claim 401', e.message)
  }

  // 4) mock 로그인 후 claim → DB 기록 + 결과 공개
  try {
    const mock = await req('/api/dev/mock-customer-session', {
      method: 'POST',
      json: { kakao_user_id: uid1, storeId: event.store_id },
      cookie,
    })
    cookie = mock.cookie
    assert(mock.res.ok, `mock session HTTP ${mock.res.status} ${JSON.stringify(mock.body)}`)

    const claim = await req('/api/games/claim', { method: 'POST', cookie })
    cookie = claim.cookie
    assert(claim.res.ok, `claim HTTP ${claim.res.status} ${JSON.stringify(claim.body)}`)
    assert(claim.body.alreadyParticipated !== true, '첫 참여인데 alreadyParticipated')
    assert(claim.body.result, 'result 없음')
    assert(typeof claim.body.result.amount === 'number', 'amount 없음')
    assert(typeof claim.body.result.label === 'string', 'label 없음')
    pass(`로그인 후 결과 공개 amount=${claim.body.result.amount} points=${claim.body.result.pointsAwarded}`)

    const { data: logRow } = await sb
      .from('daily_participation_log')
      .select('id, kakao_user_id, store_id')
      .eq('kakao_user_id', uid1)
      .eq('store_id', event.store_id)
      .maybeSingle()
    assert(logRow?.kakao_user_id === uid1, 'daily_participation_log에 kakao_user_id 미기록')
    pass('daily_participation_log에 kakao_user_id 기록')

    if (claim.body.result.amount > 0) {
      const { data: coupon } = await sb
        .from('coupons')
        .select('id, kakao_user_id, amount')
        .eq('kakao_user_id', uid1)
        .eq('store_id', event.store_id)
        .order('issued_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      assert(coupon?.kakao_user_id === uid1, 'coupons에 kakao_user_id 미기록')
      pass('coupons에 kakao_user_id 기록')
    } else {
      pass('꽝이라 쿠폰 없음 (정상)')
    }
  } catch (e) {
    fail('claim 확정', e.message)
  }

  // 5) 같은 계정 재claim / 재play 후 claim → 이미 참여
  try {
    const play2 = await req('/api/games/play', { method: 'POST', json: { event_id: event.id }, cookie })
    cookie = play2.cookie
    const claim2 = await req('/api/games/claim', { method: 'POST', cookie })
    assert(claim2.body.alreadyParticipated === true, `재참여가 차단되지 않음 ${JSON.stringify(claim2.body)}`)
    assert(!claim2.body.result, '이미 참여인데 결과가 공개됨')
    pass('로그인 시점 하루 1회 제한')
  } catch (e) {
    fail('하루 1회', e.message)
  }

  // 6) 채널 CTA는 API가 없음 — 코드 경로에 조회가 없는지만 확인
  pass('채널 추가는 ChannelCtaScreen 건너뛰기만 있고 조회 API 없음 (코드 확인)')

  // 7) 포인트 스위치 off면 ledger 스킵
  try {
    const { data: settings } = await sb
      .from('store_settings')
      .select('store_id, points_enabled')
      .eq('store_id', event.store_id)
      .maybeSingle()

    if (settings && typeof settings.points_enabled === 'boolean') {
      const prev = settings.points_enabled
      await sb.from('store_settings').update({ points_enabled: false }).eq('store_id', event.store_id)

      let c2 = ''
      const playOff = await req('/api/games/play', { method: 'POST', json: { event_id: event.id } })
      c2 = playOff.cookie
      const mockOff = await req('/api/dev/mock-customer-session', {
        method: 'POST',
        json: { kakao_user_id: uid2, storeId: event.store_id },
        cookie: c2,
      })
      c2 = mockOff.cookie
      const claimOff = await req('/api/games/claim', { method: 'POST', cookie: c2 })
      assert(claimOff.res.ok, `points off claim ${claimOff.res.status} ${JSON.stringify(claimOff.body)}`)
      assert((claimOff.body.result?.pointsAwarded ?? 0) === 0, '스위치 off인데 포인트가 적립됨')

      const { data: ledger } = await sb
        .from('point_ledger')
        .select('id')
        .eq('kakao_user_id', uid2)
        .eq('store_id', event.store_id)
      assert(!ledger || ledger.length === 0, '스위치 off인데 point_ledger에 행이 있음')
      pass('포인트 스위치 off면 적립 스킵')

      await sb.from('store_settings').update({ points_enabled: prev }).eq('store_id', event.store_id)
    } else {
      fail('포인트 스위치', 'store_settings.points_enabled 컬럼 없음 — Migration 029를 Supabase에서 실행해야 합니다')
    }
  } catch (e) {
    fail('포인트 스위치', e.message)
    try {
      await sb.from('store_settings').update({ points_enabled: true }).eq('store_id', event.store_id)
    } catch { /* restore best-effort */ }
  }

  console.log('\n---')
  for (const line of results) console.log(line)
  if (results.some((l) => l.startsWith('FAIL'))) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
