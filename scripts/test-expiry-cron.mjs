/**
 * 8-7 쿠폰 만료 알림 크론 실제 테스트
 * 실행: node --env-file=.env.local scripts/test-expiry-cron.mjs
 *
 * 사전 조건: Migration 026 실행 완료 (message_log에 coupon_id, days_remaining 컬럼)
 */

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const BASE_URL      = process.env.NEXT_PUBLIC_APP_URL ?? ''
const CRON_SECRET   = process.env.CRON_SECRET ?? ''

if (!SUPABASE_URL || !SERVICE_KEY || !BASE_URL || !CRON_SECRET) {
  console.error('필수 환경변수 누락: SUPABASE_URL, SERVICE_ROLE_KEY, APP_URL, CRON_SECRET')
  process.exit(1)
}

// Vercel 배포 URL이면 CRON_SECRET을 Vercel에도 같은 값으로 설정해야 함
// 로컬 테스트: BASE_URL=http://localhost:3000 + npm run dev 서버 실행 후 테스트 가능
console.log(`크론 엔드포인트: ${BASE_URL}/api/cron/expiry-reminder`)

const h = {
  apikey:        SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type':'application/json',
  Prefer:        'return=representation',
}

async function sb(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method, headers: h, body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return { status: res.status, data: text ? JSON.parse(text) : null }
}

function kstDay(offset) {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

async function run() {
  console.log('\n========== 8-7 쿠폰 만료 알림 크론 실제 테스트 ==========\n')

  // 테스트용 store_id, kakao_user_id
  const storeId     = 'chj-001'
  const kakaoUserId = 'test-expiry-cron-7777'

  console.log(`store_id: ${storeId}`)
  console.log(`kakao_user_id: ${kakaoUserId}`)
  console.log(`오늘 (KST): ${kstDay(0)}\n`)

  // ── Step 0. 테스트용 event_id 조회 (쿠폰은 event 참조 필수) ──
  console.log('── Step 0. 테스트 event_id 조회 ──')
  const { data: events } = await sb('GET', `/events?store_id=eq.${storeId}&select=id&limit=1`)
  if (!Array.isArray(events) || events.length === 0) {
    console.error('  ❌ storeId에 해당하는 이벤트 없음. 먼저 이벤트를 만들어주세요.')
    process.exit(1)
  }
  const eventId = events[0].id
  console.log(`  event_id: ${eventId}`)

  // ── Step 1. 테스트 쿠폰 3개 삽입 ──────────────────────────────
  // D-7: 오늘로부터 정확히 7일 뒤 만료
  // D-3: 3일 뒤
  // D-999: 999일 뒤 (배치 대상 아님)
  console.log('\n── Step 1. 테스트 쿠폰 삽입 ──')
  const insertBody = [
    { event_id: eventId, store_id: storeId, kakao_user_id: kakaoUserId, status: 'issued', amount: 2000,  valid_until: `${kstDay(7)}T23:59:59+09:00`, source_type: 'game_win' },
    { event_id: eventId, store_id: storeId, kakao_user_id: kakaoUserId, status: 'issued', amount: 3000,  valid_until: `${kstDay(3)}T23:59:59+09:00`, source_type: 'game_win' },
    { event_id: eventId, store_id: storeId, kakao_user_id: kakaoUserId, status: 'issued', amount: 10000, valid_until: `${kstDay(999)}T23:59:59+09:00`, source_type: 'game_win' },
  ]

  const { status: ins, data: inserted } = await sb('POST', '/coupons', insertBody)
  console.log(`  삽입 status: ${ins}`)
  if (!Array.isArray(inserted) || inserted.length === 0) {
    console.error('  ❌ 쿠폰 삽입 실패:', JSON.stringify(inserted, null, 2))
    process.exit(1)
  }
  const couponIds = inserted.map(c => c.id)
  inserted.forEach(c => console.log(`  - ${c.id} | amount=${c.amount} | 만료: ${c.valid_until}`))

  // ── Step 2. message_consent 설정 (발송 동의) ──────────────
  console.log('\n── Step 2. message_consent 동의 설정 (consented=true) ──')
  const { status: consentStatus } = await sb('POST', '/message_consent', [{
    store_id: storeId, kakao_user_id: kakaoUserId, consented: true,
  }])
  // 이미 있으면 UPSERT
  if (consentStatus === 409 || consentStatus === 201 || consentStatus === 200) {
    await sb('PATCH', `/message_consent?store_id=eq.${storeId}&kakao_user_id=eq.${kakaoUserId}`, { consented: true })
  }
  console.log(`  consent 설정 완료 (status: ${consentStatus})`)

  // ── Step 3. 크론 엔드포인트 1차 호출 ──────────────────────
  console.log('\n── Step 3. 크론 엔드포인트 1차 호출 ──')
  const cronRes1 = await fetch(`${BASE_URL}/api/cron/expiry-reminder`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  })
  const cronData1 = await cronRes1.json()
  console.log('1차 응답 (전체 원문):')
  console.log(JSON.stringify(cronData1, null, 2))

  // ── Step 4. message_log 확인 ──────────────────────────────
  console.log('\n── Step 4. message_log 실제 기록 확인 ──')
  // Migration 026 실행됐으면 coupon_id, days_remaining 포함; 아니면 기본 컬럼만
  let logs1 = null
  const { data: logsExt, status: logStatus } = await sb('GET',
    `/message_log?kakao_user_id=eq.${kakaoUserId}&message_type=eq.expiry_reminder&select=id,message_type,days_remaining,coupon_id,sent_at&order=sent_at.desc`)
  if (logStatus === 200) {
    logs1 = logsExt
    console.log('message_log 기록 (Migration 026 포함):')
  } else {
    // Migration 026 미실행 → 기본 컬럼으로 재시도
    const { data: logsBasic } = await sb('GET',
      `/message_log?kakao_user_id=eq.${kakaoUserId}&message_type=eq.expiry_reminder&select=id,message_type,sent_at&order=sent_at.desc`)
    logs1 = logsBasic
    console.log('⚠️  message_log 기록 (Migration 026 미실행 — coupon_id/days_remaining 없음):')
  }
  console.log(JSON.stringify(logs1, null, 2))

  // ── Step 5. 크론 엔드포인트 2차 호출 (중복 방지 확인) ──────
  console.log('\n── Step 5. 크론 엔드포인트 2차 호출 (중복 방지 검증) ──')
  const cronRes2 = await fetch(`${BASE_URL}/api/cron/expiry-reminder`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  })
  const cronData2 = await cronRes2.json()
  console.log('2차 응답 (전체 원문):')
  console.log(JSON.stringify(cronData2, null, 2))

  const sent2nd = cronData2.total_sent ?? 0
  const dup2nd  = cronData2.total_skipped_dup ?? 0
  console.log(`\n중복 발송 방지 결과: 2차 실행 시 sent=${sent2nd}, skipped_dup=${dup2nd}`)
  console.log(dup2nd > 0 ? '  ✅ 중복 방지 정상 작동' : '  ❌ 중복 방지 미작동 (버그!)')

  // ── Step 6. 정리 ──────────────────────────────────────────
  console.log('\n── Step 6. 테스트 데이터 정리 ──')
  for (const id of couponIds) {
    await sb('DELETE', `/coupons?id=eq.${id}`)
  }
  await sb('DELETE', `/message_log?kakao_user_id=eq.${kakaoUserId}&message_type=eq.expiry_reminder`)
  await sb('DELETE', `/message_consent?store_id=eq.${storeId}&kakao_user_id=eq.${kakaoUserId}`)
  console.log('  ✅ 테스트 데이터 정리 완료')

  console.log('\n========== 테스트 완료 ==========\n')
}

run().catch(err => { console.error('스크립트 오류:', err); process.exit(1) })
