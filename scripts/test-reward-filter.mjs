/**
 * 8-6 기간한정 리워드 필터 실제 테스트
 * node scripts/test-reward-filter.mjs
 */

// .env.local에서 값을 읽어서 실행: node --env-file=.env.local scripts/test-reward-filter.mjs
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const BASE_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://roulette-marketing.vercel.app'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('환경변수 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다.')
  process.exit(1)
}

const headers = {
  apikey:        SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type':'application/json',
  Prefer:        'return=representation',
}

async function supabase(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return { status: res.status, data: text ? JSON.parse(text) : null }
}

function kstNow() {
  // KST 기준 현재 날짜/시간
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

function kstDay(offsetDays) {
  const d = kstNow()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function toISO(dateStr, endOfDay = false) {
  return endOfDay
    ? `${dateStr}T23:59:59+09:00`
    : `${dateStr}T00:00:00+09:00`
}

// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n========== 8-6 기간한정 리워드 필터 실제 테스트 ==========\n')

  // 1. 사용할 store_id 확인
  const storeId = 'chj-001'
  console.log(`✅ 사용할 store_id: ${storeId}\n`)

  // 2. 날짜 계산 (KST 기준)
  const yesterday = kstDay(-1)
  const today     = kstDay(0)
  const tomorrow  = kstDay(1)
  const dayAfterTomorrow = kstDay(2)
  const dayBeforeYesterday = kstDay(-2)

  console.log('── Step 2. 날짜 기준 확인 (KST) ──')
  console.log(`  그제: ${dayBeforeYesterday}`)
  console.log(`  어제: ${yesterday}`)
  console.log(`  오늘: ${today}`)
  console.log(`  내일: ${tomorrow}`)
  console.log(`  모레: ${dayAfterTomorrow}`)
  console.log()

  // 3. 기존 테스트 리워드 정리 (있다면)
  await supabase('DELETE', `/reward_catalog?name=like.%5BTEST%5D%25&store_id=eq.${storeId}`)

  // 4. 테스트 리워드 3+1개 삽입
  console.log('── Step 3. 테스트 리워드 삽입 ──')

  const testRewards = [
    {
      name:        '[TEST-A] 현재 노출중 (어제~내일)',
      store_id:    storeId,
      point_cost:  100,
      active:      true,
      reward_type: 'free_item',
      start_at:    toISO(yesterday, false),   // 어제 00:00 KST
      end_at:      toISO(tomorrow, true),      // 내일 23:59 KST
    },
    {
      name:        '[TEST-B] 미래 (내일~모레 — 아직 미노출)',
      store_id:    storeId,
      point_cost:  200,
      active:      true,
      reward_type: 'free_item',
      start_at:    toISO(tomorrow, false),     // 내일 00:00 KST
      end_at:      toISO(dayAfterTomorrow, true),
    },
    {
      name:        '[TEST-C] 기간만료 (그제~어제 — 이미 지남)',
      store_id:    storeId,
      point_cost:  300,
      active:      true,
      reward_type: 'free_item',
      start_at:    toISO(dayBeforeYesterday, false), // 그제 00:00 KST
      end_at:      toISO(yesterday, true),           // 어제 23:59 KST
    },
    {
      name:        '[TEST-D] 경계값 — end_at=오늘 23:59 (오늘 하루 유효해야 함)',
      store_id:    storeId,
      point_cost:  400,
      active:      true,
      reward_type: 'free_item',
      start_at:    toISO(yesterday, false),   // 어제 00:00
      end_at:      toISO(today, true),         // 오늘 23:59 KST
    },
  ]

  const { status: insertStatus, data: inserted } = await supabase('POST', '/reward_catalog', testRewards)
  console.log(`  삽입 결과 status: ${insertStatus}`)
  if (insertStatus !== 201) {
    console.error('  ❌ 삽입 실패:', JSON.stringify(inserted, null, 2))
    process.exit(1)
  }
  console.log(`  ✅ ${inserted.length}개 삽입 완료`)
  inserted.forEach(r => console.log(`     - ${r.id}: ${r.name}`))

  // kakao_user_id 아무 값으로 (없으면 loyalty=빈값으로 반환됨)
  const testKakaoId = 'test-filter-check-9999'

  // 5. /api/me/points 실제 호출
  console.log('\n── Step 4. /api/me/points 실제 API 호출 ──')
  const apiUrl = `${BASE_URL}/api/me/points?kakao_user_id=${encodeURIComponent(testKakaoId)}&store_id=${encodeURIComponent(storeId)}`
  console.log(`  URL: ${apiUrl}`)

  const apiRes  = await fetch(apiUrl)
  const apiData = await apiRes.json()

  console.log('\n── Step 5. API 응답 중 catalog 부분 (전체 원문) ──')
  console.log(JSON.stringify({ catalog: apiData.catalog }, null, 2))

  // 6. 분석
  console.log('\n── Step 6. 필터링 결과 분석 ──')
  const catalog = apiData.catalog ?? []
  const testNames = catalog.map(r => r.name).filter(n => n?.startsWith('[TEST'))

  const hasA = catalog.some(r => r.name?.includes('TEST-A'))
  const hasB = catalog.some(r => r.name?.includes('TEST-B'))
  const hasC = catalog.some(r => r.name?.includes('TEST-C'))
  const hasD = catalog.some(r => r.name?.includes('TEST-D'))

  console.log(`  TEST-A (어제~내일, 현재 노출되어야 함):   ${hasA ? '✅ 포함됨' : '❌ 빠짐 (오류!)'}`)
  console.log(`  TEST-B (내일~모레, 노출되면 안 됨):       ${!hasB ? '✅ 정상 제외됨' : '❌ 포함됨 (오류!)'}`)
  console.log(`  TEST-C (그제~어제, 노출되면 안 됨):       ${!hasC ? '✅ 정상 제외됨' : '❌ 포함됨 (오류!)'}`)
  console.log(`  TEST-D (어제~오늘 23:59 경계값):          ${hasD ? '✅ 포함됨 — 당일 23:59까지 유효' : '❌ 빠짐 — 전날까지만 유효 (주의!)'}`)

  console.log('\n── 경계값 결론 ──')
  if (hasD) {
    console.log('  → end_at을 오늘 23:59:59 KST로 설정하면 오늘 하루 동안 노출됩니다.')
    console.log('  → 즉, "설정한 날짜 당일까지 유효" 입니다.')
  } else {
    console.log('  → end_at=오늘 23:59인데 노출 안 됨 — 시간대 이슈 가능성 있음')
  }

  // 7. 테스트 데이터 정리
  console.log('\n── Step 7. 테스트 데이터 정리 ──')
  for (const r of inserted) {
    await supabase('DELETE', `/reward_catalog?id=eq.${r.id}`)
  }
  console.log('  ✅ 테스트 리워드 4개 삭제 완료\n')

  console.log('========== 테스트 완료 ==========\n')
}

run().catch(err => {
  console.error('스크립트 오류:', err)
  process.exit(1)
})
