/**
 * '촌놈칩스'(store_id=aschip) 성과 리포트 화면 데모용 가상 데이터 시딩 스크립트.
 * 실서비스 진짜 손님 데이터가 아닌, 개발/데모 전용 store_id='aschip'(내부 테스트 매장)에만 사용.
 *
 * 사용법: node scripts/seed-report-demo-aschip.mjs
 *
 * 생성 데이터 (2026년 8월 기준 리포트가 그럴듯하게 보이도록):
 *  - daily_participation_log: 8월 신규 320행(기존 3행 포함 총 323명) + 7월 85행(전월 대비 %용)
 *  - customer_loyalty: 위 참여자 345명 분(첫방문/최근방문/세그먼트)
 *  - coupons: 8월 140건(87 used / 53 pending_verify) + 7월 45건(25 used / 20 pending_verify)
 *  - activity_log(daangn_click): 4~8월 월별 누적 성장 추이용
 *  - activity_log(game_start): 8월 인기 시간대(화요일 저녁) 데모용
 *  - store_settings.average_order_value = 6000원
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

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const STORE_ID = 'aschip'

function kstToUtcIso(year, month, day, hour = 12, minute = 0) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0) - 9 * 60 * 60 * 1000).toISOString()
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr) { return arr[randInt(0, arr.length - 1)] }
function randAugDate() { return randInt(1, 31) }
function randJulDate() { return randInt(1, 31) }

async function insertChunked(table, rows, chunkSize = 400) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await sb.from(table).insert(chunk)
    if (error) throw new Error(`${table} insert 실패 (${i}~${i + chunk.length}): ${error.message}`)
  }
  console.log(`✅ ${table}: ${rows.length}행 삽입 완료`)
}

async function main() {
  // 0) 객단가 설정
  {
    const { data: existing } = await sb.from('store_settings').select('store_id').eq('store_id', STORE_ID).maybeSingle()
    if (existing) {
      await sb.from('store_settings').update({ average_order_value: 6000 }).eq('store_id', STORE_ID)
    } else {
      await sb.from('store_settings').insert({ store_id: STORE_ID, average_order_value: 6000 })
    }
    console.log('✅ store_settings.average_order_value = 6000원')
  }

  const dplRows = []
  const clRows = []
  let uidSeq = 1
  const nextUid = () => `demo-visit-${String(uidSeq++).padStart(4, '0')}`

  // Group A: 8월 신규만 (260명)
  const groupA = Array.from({ length: 260 }, nextUid)
  for (const uid of groupA) {
    const d = randAugDate()
    const ts = kstToUtcIso(2026, 8, d, randInt(10, 22))
    dplRows.push({ store_id: STORE_ID, kakao_user_id: uid, date: `2026-08-${String(d).padStart(2, '0')}`, last_played_at: ts, created_at: ts })
    clRows.push({
      store_id: STORE_ID, kakao_user_id: uid, point_balance: randInt(0, 150),
      visit_count: 1, first_seen_at: ts, last_visit_at: ts, kakao_first_login_at: ts, segment: 'NEW',
    })
  }

  // Group B: 오래된 단골, 7월+8월 모두 방문 (40명)
  const groupB = Array.from({ length: 40 }, nextUid)
  for (const uid of groupB) {
    const jd = randJulDate()
    const jts = kstToUtcIso(2026, 7, jd, randInt(10, 22))
    const ad = randAugDate()
    const ats = kstToUtcIso(2026, 8, ad, randInt(10, 22))
    dplRows.push({ store_id: STORE_ID, kakao_user_id: uid, date: `2026-07-${String(jd).padStart(2, '0')}`, last_played_at: jts, created_at: jts })
    dplRows.push({ store_id: STORE_ID, kakao_user_id: uid, date: `2026-08-${String(ad).padStart(2, '0')}`, last_played_at: ats, created_at: ats })
    const firstSeen = kstToUtcIso(2026, randInt(4, 6), randInt(1, 28), randInt(10, 22))
    clRows.push({
      store_id: STORE_ID, kakao_user_id: uid, point_balance: randInt(50, 400),
      visit_count: randInt(3, 6), first_seen_at: firstSeen, last_visit_at: ats, kakao_first_login_at: firstSeen, segment: 'ACTIVE',
    })
  }

  // Group C: 7월에 가입해서 8월에도 재방문 (전환 스토리, 20명)
  const groupC = Array.from({ length: 20 }, nextUid)
  for (const uid of groupC) {
    const jd = randJulDate()
    const jts = kstToUtcIso(2026, 7, jd, randInt(10, 22))
    const ad = randAugDate()
    const ats = kstToUtcIso(2026, 8, ad, randInt(10, 22))
    dplRows.push({ store_id: STORE_ID, kakao_user_id: uid, date: `2026-07-${String(jd).padStart(2, '0')}`, last_played_at: jts, created_at: jts })
    dplRows.push({ store_id: STORE_ID, kakao_user_id: uid, date: `2026-08-${String(ad).padStart(2, '0')}`, last_played_at: ats, created_at: ats })
    clRows.push({
      store_id: STORE_ID, kakao_user_id: uid, point_balance: randInt(0, 200),
      visit_count: 2, first_seen_at: jts, last_visit_at: ats, kakao_first_login_at: jts, segment: 'ACTIVE',
    })
  }

  // Group D: 7월에 가입했지만 8월엔 재방문 안 함 (전환 스토리 분모용, 25명)
  const groupD = Array.from({ length: 25 }, nextUid)
  for (const uid of groupD) {
    const jd = randJulDate()
    const jts = kstToUtcIso(2026, 7, jd, randInt(10, 22))
    dplRows.push({ store_id: STORE_ID, kakao_user_id: uid, date: `2026-07-${String(jd).padStart(2, '0')}`, last_played_at: jts, created_at: jts })
    clRows.push({
      store_id: STORE_ID, kakao_user_id: uid, point_balance: randInt(0, 100),
      visit_count: 1, first_seen_at: jts, last_visit_at: jts, kakao_first_login_at: jts, segment: 'AT_RISK',
    })
  }

  await insertChunked('daily_participation_log', dplRows)
  await insertChunked('customer_loyalty', clRows)

  // 쿠폰: 8월 140건(87 used/53 pending), 7월 45건(25 used/20 pending)
  const augPool = [...groupA, ...groupB, ...groupC]
  const julPool = [...groupB, ...groupC, ...groupD]
  const LABELS = [
    { label: '감자칩 1봉 무료교환권', amount: 3000 },
    { label: '아메리카노 교환권', amount: 4000 },
    { label: '2,000원 할인권', amount: 2000 },
    { label: '5,000원 할인권', amount: 5000 },
    { label: '음료수 1개 무료교환권', amount: 1500 },
  ]
  const couponRows = []
  function makeCoupon(pool, year, month, used) {
    const uid = pick(pool)
    const d = randInt(1, month === 8 ? 31 : 31)
    const issuedAt = kstToUtcIso(year, month, d, randInt(10, 22))
    const l = pick(LABELS)
    const validUntil = new Date(new Date(issuedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    return {
      store_id: STORE_ID,
      kakao_user_id: uid,
      event_id: null,
      source_type: 'game_win',
      amount: l.amount,
      label: l.label,
      status: used ? 'used' : 'pending_verify',
      issued_at: issuedAt,
      valid_until: validUntil,
      used_at: used ? new Date(new Date(issuedAt).getTime() + randInt(1, 72) * 60 * 60 * 1000).toISOString() : null,
    }
  }
  for (let i = 0; i < 87; i++) couponRows.push(makeCoupon(augPool, 2026, 8, true))
  for (let i = 0; i < 53; i++) couponRows.push(makeCoupon(augPool, 2026, 8, false))
  for (let i = 0; i < 25; i++) couponRows.push(makeCoupon(julPool, 2026, 7, true))
  for (let i = 0; i < 20; i++) couponRows.push(makeCoupon(julPool, 2026, 7, false))
  await insertChunked('coupons', couponRows)

  // 당근 단골 클릭: 4~8월 월별 신규 클릭자 누적 성장 추이
  const clickRows = []
  let clickSeq = 1
  const nextClickUid = () => `demo-click-${String(clickSeq++).padStart(4, '0')}`
  const monthlyNewClickers = [
    { month: 4, count: 8 },
    { month: 5, count: 12 },
    { month: 6, count: 18 },
    { month: 7, count: 25 },
    { month: 8, count: 35 },
  ]
  for (const { month, count } of monthlyNewClickers) {
    for (let i = 0; i < count; i++) {
      const uid = nextClickUid()
      const d = randInt(1, 28)
      const ts = kstToUtcIso(2026, month, d, randInt(9, 23))
      clickRows.push({ store_id: STORE_ID, kakao_user_id: uid, event_type: 'daangn_click', occurred_at: ts })
    }
  }
  await insertChunked('activity_log', clickRows)

  // 인기 시간대 데모: 8월 화요일 저녁 19시대에 집중된 게임 시작 이벤트
  const augTuesdays = []
  for (let d = 1; d <= 31; d++) {
    const dow = new Date(Date.UTC(2026, 7, d)).getUTCDay()
    if (dow === 2) augTuesdays.push(d)
  }
  const gameStartRows = []
  // 화요일 저녁 19시대 집중 (80건)
  for (let i = 0; i < 80; i++) {
    const d = pick(augTuesdays)
    const ts = kstToUtcIso(2026, 8, d, 19, randInt(0, 59))
    gameStartRows.push({ store_id: STORE_ID, kakao_user_id: `demo-play-${i}`, event_type: 'game_start', occurred_at: ts })
  }
  // 나머지 요일/시간대에 분산 (120건, 각 버킷 최대 8건 수준으로 분산)
  for (let i = 0; i < 120; i++) {
    const d = randInt(1, 31)
    const hour = randInt(9, 23)
    const ts = kstToUtcIso(2026, 8, d, hour, randInt(0, 59))
    gameStartRows.push({ store_id: STORE_ID, kakao_user_id: `demo-play-scatter-${i}`, event_type: 'game_start', occurred_at: ts })
  }
  await insertChunked('activity_log', gameStartRows)

  console.log('\n🎉 촌놈칩스(aschip) 데모 데이터 시딩 완료')
  console.log(`   - daily_participation_log 신규: ${dplRows.length}행 (8월 ${groupA.length + groupB.length + groupC.length}행 / 7월 ${groupB.length + groupC.length + groupD.length}행)`)
  console.log(`   - customer_loyalty 신규: ${clRows.length}행`)
  console.log(`   - coupons 신규: ${couponRows.length}행`)
  console.log(`   - activity_log(daangn_click) 신규: ${clickRows.length}행`)
  console.log(`   - activity_log(game_start) 신규: ${gameStartRows.length}행`)
}

main().catch((e) => {
  console.error('❌ 시딩 실패:', e.message)
  process.exit(1)
})
