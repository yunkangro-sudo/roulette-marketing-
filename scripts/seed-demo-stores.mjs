/**
 * 영업 시연용 샘플(데모) 매장 10곳 생성 스크립트 — Phase 1 (콘텐츠만, 가상 활동데이터는 Phase 2 별도 스크립트)
 *
 * 사용법: node scripts/seed-demo-stores.mjs
 *   - 이미 존재하는 데모 매장은 관련 데이터를 전부 지우고 다시 만든다 (재실행 안전).
 *   - is_demo=true로 표시되므로 슈퍼관리자 집계/사이트맵/알림톡 발송에서 자동 제외된다
 *     (docs/migrations/053_demo_store_isolation.sql 참고).
 *
 * 만드는 것 (매장 1곳당):
 *   store_contracts(is_demo=true) → subscriptions(1년 이용기간) → store_accounts(로그인 계정)
 *   → store_settings/loyalty_settings(포인트 정책, 1회=100p) → events+prize_tiers(즉시쿠폰 3개+꽝)
 *   → reward_catalog(장기 리워드 2개) → business_entity(홈페이지 콘텐츠) → business_products(대표 상품)
 *
 * 가상 손님/방문/쿠폰 발급 이력(Phase 2)은 별도 스크립트(scripts/seed-demo-activity.mjs, 추후 작성)에서
 * 처리한다 — upsert_customer_loyalty RPC가 now() 고정이라 과거 날짜 시뮬레이션에 쓸 수 없어서,
 * 활동데이터는 date 로직이 훨씬 복잡하므로 콘텐츠 입력과 분리했다.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m || process.env[m[1]]) continue
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}

const DEMO_PASSWORD = 'Demo2026!' // 시연용 공용 비밀번호 — 실제 발신용 아니므로 단순하게

/** @typedef {{label:string, amount:number, probability:number}} Coupon */
/** @typedef {{name:string, pointCost:number}} Reward */
/** @typedef {{name:string, price:number|null, description?:string}} Product */

const STORES = [
  {
    slug: 'demo-bbq',
    name: '성성숯불집',
    businessType: 'restaurant',
    category: '숙성 고기 전문점',
    description: '제대로 숙성한 고기를 숯불에 굽는 성성동 숙성 고기 전문점',
    tagline: '오늘 먹고 끝내지 말고,\n다음에도 생각나는 고깃집.',
    gameCtaLabel: '🎮 오늘의 고기 뽑기',
    address: '충청남도 천안시 서북구 성성8로 12',
    businessHours: '매일 16:00 ~ 24:00',
    phone: '041-555-2388',
    parkingInfo: '건물 지하주차장 2시간 무료',
    coupons: [
      { label: '음료 1병 무료', amount: 3000, probability: 25 },
      { label: '3,000원 할인 쿠폰', amount: 3000, probability: 18 },
      { label: '다음 방문 시 삼겹살 1인분 제공', amount: 15000, probability: 7 },
    ],
    rewards: [
      { name: '3회 방문 달성 → 육회 한 접시 제공', pointCost: 300 },
      { name: '5회 방문 달성 → 고기 모둠 추가 제공', pointCost: 500 },
    ],
    products: [
      { name: '숙성 삼겹살', price: 15000 },
      { name: '숙성 목살', price: 16000 },
      { name: '한우 육회', price: 22000 },
      { name: '된장찌개', price: 6000 },
    ],
  },
  {
    slug: 'demo-cafe-cream',
    name: '오후의 크림',
    businessType: 'cafe',
    category: '디저트 카페',
    description: '천천히 머물고 싶은 오후를 만드는 디저트 카페',
    tagline: '오늘의 커피가,\n다음 방문의 이유가 됩니다.',
    gameCtaLabel: '🎮 오늘의 럭키 커피',
    address: '충청남도 천안시 서북구 불당23로 47',
    businessHours: '매일 10:00 ~ 22:00',
    phone: '041-567-8124',
    parkingInfo: '카페 건물 지하주차장 1시간 무료',
    coupons: [
      { label: '아메리카노 무료 업그레이드', amount: 1000, probability: 25 },
      { label: '음료 3,000원 할인', amount: 3000, probability: 18 },
      { label: '대표 디저트 1개 제공', amount: 6800, probability: 7 },
    ],
    rewards: [
      { name: '3회 방문 → 시그니처 음료 무료', pointCost: 300 },
      { name: '5회 방문 → 디저트 세트 무료', pointCost: 500 },
    ],
    products: [
      { name: '크림 라떼', price: 6500 },
      { name: '아메리카노', price: 4500 },
      { name: '바스크 치즈케이크', price: 6800 },
      { name: '크림 스콘', price: 4800 },
    ],
  },
  {
    slug: 'demo-hair-salon',
    name: '무드헤어 성성점',
    businessType: 'salon',
    category: '헤어살롱',
    description: '얼굴형과 라이프스타일에 맞는 자연스러운 스타일을 만드는 헤어살롱',
    tagline: '오늘의 스타일이\n다음 방문까지 이어지도록.',
    gameCtaLabel: '🎮 오늘의 스타일 혜택',
    address: '충청남도 천안시 서북구 성성6로 31',
    businessHours: '10:00 ~ 20:00 (매주 화요일 휴무)',
    phone: '041-577-3290',
    parkingInfo: '건물 앞 무료주차 가능',
    coupons: [
      { label: '두피 케어 무료 제공', amount: 5000, probability: 25 },
      { label: '시술 3,000원 할인', amount: 3000, probability: 18 },
      { label: '클리닉 서비스 제공', amount: 15000, probability: 7 },
    ],
    rewards: [
      { name: '3회 방문 → 헤드스파 무료', pointCost: 300 },
      { name: '5회 방문 → 프리미엄 클리닉 50% 할인', pointCost: 500 },
    ],
    products: [
      { name: '남성 디자인펌', price: 65000 },
      { name: '여성 레이어드펌', price: 120000 },
      { name: '남성 커트', price: 25000 },
      { name: '여성 커트', price: 30000 },
    ],
  },
  {
    slug: 'demo-nail',
    name: '누아네일',
    businessType: 'service',
    category: '네일샵',
    description: '작은 디테일까지 나답게 완성하는 프라이빗 네일 스튜디오',
    tagline: '오늘의 손끝이\n다음 예약의 이유가 됩니다.',
    gameCtaLabel: '🎮 럭키 네일 픽',
    address: '충청남도 천안시 서북구 불당25로 18',
    businessHours: '11:00 ~ 20:00 (매주 일요일 휴무)',
    phone: '041-522-6678',
    parkingInfo: null,
    coupons: [
      { label: '파츠 1개 무료', amount: 3000, probability: 25 },
      { label: '3,000원 할인', amount: 3000, probability: 18 },
      { label: '손 케어 서비스 제공', amount: 25000, probability: 7 },
    ],
    rewards: [
      { name: '3회 방문 → 프렌치 디자인 무료 업그레이드', pointCost: 300 },
      { name: '5회 방문 → 젤 네일 10,000원 할인', pointCost: 500 },
    ],
    products: [
      { name: '원컬러 젤', price: 55000 },
      { name: '디자인 네일', price: 79000, description: '79,000원부터' },
      { name: '손 케어', price: 25000 },
      { name: '페디큐어', price: 65000, description: '65,000원부터' },
    ],
  },
  {
    slug: 'demo-gym',
    name: '피크짐 성성',
    businessType: 'gym',
    category: '피트니스',
    description: '꾸준히 운동하는 습관을 함께 만드는 프리미엄 피트니스',
    tagline: '오늘 한 번의 운동이\n내일의 습관이 되도록.',
    gameCtaLabel: '🎮 오늘의 운동 리워드',
    address: '충청남도 천안시 서북구 성성9로 25',
    businessHours: '평일 06:00 ~ 24:00 / 주말 09:00 ~ 21:00',
    phone: '041-561-4421',
    parkingInfo: '3시간 무료',
    coupons: [
      { label: '프로틴 음료 무료', amount: 3000, probability: 25 },
      { label: 'PT 체험 3,000원 할인', amount: 3000, probability: 18 },
      { label: '일일 이용권 제공', amount: 15000, probability: 7 },
    ],
    rewards: [
      { name: '10회 방문 → 운동복 무료 대여 1개월', pointCost: 1000 },
      { name: '20회 방문 → PT 1회 제공', pointCost: 2000 },
    ],
    products: [
      { name: '헬스 월 이용권', price: 59000 },
      { name: '1:1 PT 10회', price: 550000 },
      { name: '체성분 측정', price: 0, description: '무료' },
      { name: '운동복 대여', price: 10000, description: '월 10,000원' },
    ],
  },
  {
    slug: 'demo-esthetic',
    name: '온결 에스테틱',
    businessType: 'service',
    category: '피부관리 에스테틱',
    description: '피부 컨디션에 맞춘 맞춤형 케어를 제공하는 프라이빗 에스테틱',
    tagline: '한 번의 관리보다,\n꾸준히 달라지는 피부를 위해.',
    gameCtaLabel: '🎮 오늘의 뷰티 리워드',
    address: '충청남도 천안시 서북구 불당22로 61',
    businessHours: '10:00 ~ 21:00',
    phone: '041-563-8890',
    parkingInfo: null,
    coupons: [
      { label: '두피 마사지 무료', amount: 5000, probability: 25 },
      { label: '관리 3,000원 할인', amount: 3000, probability: 18 },
      { label: '앰플 업그레이드 제공', amount: 10000, probability: 7 },
    ],
    rewards: [
      { name: '3회 방문 → 수분 집중 케어 제공', pointCost: 300 },
      { name: '5회 방문 → 프리미엄 관리 20% 할인', pointCost: 500 },
    ],
    products: [
      { name: '수분 집중 관리', price: 79000 },
      { name: '윤곽 관리', price: 99000 },
      { name: '문제성 피부 관리', price: 89000 },
      { name: '등 관리', price: 70000 },
    ],
  },
  {
    slug: 'demo-bakery',
    name: '밀의온도',
    businessType: 'cafe',
    category: '베이커리',
    description: '매일 아침 구워내는 따뜻한 빵과 커피가 있는 동네 베이커리',
    tagline: '오늘의 빵 냄새가\n내일도 생각나도록.',
    gameCtaLabel: '🎮 오늘의 빵 선물',
    address: '충청남도 천안시 서북구 성성7로 42',
    businessHours: '08:00 ~ 21:00',
    phone: '041-575-4312',
    parkingInfo: null,
    coupons: [
      { label: '미니 식빵 제공', amount: 3200, probability: 25 },
      { label: '3,000원 할인', amount: 3000, probability: 18 },
      { label: '아메리카노 무료 제공', amount: 4500, probability: 7 },
    ],
    rewards: [
      { name: '5회 방문 → 식빵 1개 무료', pointCost: 500 },
      { name: '10회 방문 → 베이커리 세트 제공', pointCost: 1000 },
    ],
    products: [
      { name: '소금빵', price: 3200 },
      { name: '우유식빵', price: 5800 },
      { name: '바게트', price: 4500 },
      { name: '크루아상', price: 3800 },
    ],
  },
  {
    slug: 'demo-carwash',
    name: '디테일팩토리 천안',
    businessType: 'service',
    category: '세차·디테일링',
    description: '세차부터 디테일링까지 차량 컨디션을 관리하는 프리미엄 카케어',
    tagline: '한 번 깨끗하게,\n꾸준히 관리하세요.',
    gameCtaLabel: '🎮 오늘의 카케어 혜택',
    address: '충청남도 천안시 서북구 백석공단2길 17',
    businessHours: '09:00 ~ 20:00',
    phone: '041-589-2204',
    parkingInfo: null,
    coupons: [
      { label: '실내 탈취 서비스 제공', amount: 5000, probability: 25 },
      { label: '세차 3,000원 할인', amount: 3000, probability: 18 },
      { label: '타이어 광택 서비스 제공', amount: 10000, probability: 7 },
    ],
    rewards: [
      { name: '3회 방문 → 실내 클리닝 무료', pointCost: 300 },
      { name: '5회 방문 → 프리미엄 세차 업그레이드', pointCost: 500 },
    ],
    products: [
      { name: '외부 세차', price: 35000 },
      { name: '실내·외 세차', price: 55000 },
      { name: '프리미엄 디테일링', price: 120000, description: '120,000원부터' },
      { name: '유리막 코팅', price: null, description: '상담 후 안내' },
    ],
  },
  {
    slug: 'demo-kidscafe',
    name: '플레이포레스트',
    businessType: 'service',
    category: '키즈카페',
    description: '아이들이 마음껏 놀고 부모도 편하게 쉴 수 있는 실내 놀이 공간',
    tagline: '오늘의 즐거움이\n다음 주말에도 이어지도록.',
    gameCtaLabel: '🎮 오늘의 플레이 선물',
    address: '충청남도 천안시 서북구 불당34로 27',
    businessHours: '10:00 ~ 20:00',
    phone: '041-554-7732',
    parkingInfo: null,
    coupons: [
      { label: '음료 1잔 제공', amount: 3000, probability: 25 },
      { label: '3,000원 할인', amount: 3000, probability: 18 },
      { label: '놀이 토큰 추가 제공', amount: 5000, probability: 7 },
    ],
    rewards: [
      { name: '3회 방문 → 보호자 음료 무료', pointCost: 300 },
      { name: '5회 방문 → 어린이 입장권 1회 제공', pointCost: 500 },
    ],
    products: [
      { name: '어린이 2시간', price: 18000 },
      { name: '어린이 종일권', price: 25000 },
      { name: '보호자 입장', price: 0, description: '무료' },
      { name: '보호자 음료 세트', price: null, description: '별도 구매' },
    ],
  },
  {
    slug: 'demo-petsalon',
    name: '몽글펫살롱',
    businessType: 'service',
    category: '반려동물 미용',
    description: '반려동물의 건강과 스타일을 함께 생각하는 프리미엄 펫케어 살롱',
    tagline: '우리 아이가 편안했던 기억은\n다음 방문으로 이어집니다.',
    gameCtaLabel: '🎮 오늘의 펫케어 선물',
    address: '충청남도 천안시 서북구 성성4로 19',
    businessHours: '10:00 ~ 19:00 (매주 월요일 휴무)',
    phone: '041-581-9920',
    parkingInfo: null,
    petFriendly: true,
    coupons: [
      { label: '발바닥 케어 무료', amount: 5000, probability: 25 },
      { label: '3,000원 할인', amount: 3000, probability: 18 },
      { label: '프리미엄 샴푸 업그레이드', amount: 5000, probability: 7 },
    ],
    rewards: [
      { name: '3회 방문 → 부분 미용 무료', pointCost: 300 },
      { name: '5회 방문 → 미용 10% 할인', pointCost: 500 },
    ],
    products: [
      { name: '소형견 미용', price: 55000, description: '55,000원부터' },
      { name: '중형견 미용', price: 75000, description: '75,000원부터' },
      { name: '목욕 관리', price: 35000, description: '35,000원부터' },
      { name: '부분 미용', price: 20000, description: '20,000원부터' },
    ],
  },
]

function todayStr(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

async function wipeExisting(client, storeId) {
  const { rows: eventRows } = await client.query('select id from events where store_id = $1', [storeId])
  for (const e of eventRows) {
    await client.query('delete from prize_tiers where event_id = $1', [e.id])
  }
  await client.query('delete from events where store_id = $1', [storeId])
  await client.query('delete from reward_catalog where store_id = $1', [storeId])
  await client.query('delete from business_products where store_id = $1', [storeId])
  await client.query('delete from business_entity where store_id = $1', [storeId])
  await client.query('delete from business_media where store_id = $1', [storeId])
  await client.query('delete from business_faq where store_id = $1', [storeId])
  await client.query('delete from business_external_links where store_id = $1', [storeId])
  await client.query('delete from loyalty_settings where store_id = $1', [storeId])
  await client.query('delete from store_settings where store_id = $1', [storeId])
  await client.query('delete from store_accounts where store_id = $1', [storeId])
  await client.query('delete from subscriptions where store_id = $1', [storeId])
  await client.query('delete from store_contracts where store_id = $1', [storeId])
}

async function seedStore(client, def) {
  const storeId = def.slug
  const storeName = `(샘플) ${def.name}`

  await wipeExisting(client, storeId)

  const contractStart = todayStr(-14)
  const contractEnd = todayStr(365)

  await client.query(
    `insert into store_contracts
       (store_id, store_name, contract_start_date, contract_end_date, ad_amount,
        contractor_name, manager_name, phone, website, address, remarks,
        daangn_url, kakao_channel_url, business_type, is_demo)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true)`,
    [
      storeId, storeName, contractStart, contractEnd, 39000,
      '샘플 사장님', '샘플 담당자', def.phone, null, def.address,
      '영업 시연용 샘플 매장 (자동 생성, seed-demo-stores.mjs)',
      null, null, def.businessType,
    ],
  )

  await client.query(
    `insert into subscriptions (store_id, plan_name, amount_paid, start_date, end_date, memo)
     values ($1, 'Demo', 0, $2, $3, '샘플(데모) 매장 — 자동 생성')`,
    [storeId, contractStart, contractEnd],
  )

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
  await client.query(
    `insert into store_accounts (store_id, email, password_hash, role)
     values ($1, $2, $3, 'advertiser')`,
    [storeId, `demo-${storeId}@dgting.co.kr`, passwordHash],
  )

  await client.query(
    `insert into store_settings (store_id, store_name, monthly_ad_budget, average_order_value, qr_checkout_enabled, points_enabled)
     values ($1, $2, 0, $3, true, true)`,
    [storeId, storeName, def.coupons[2]?.amount ?? 10000],
  )

  await client.query(
    `insert into loyalty_settings (store_id, point_per_visit, usage_threshold, point_expiry_days)
     values ($1, 100, 100, null)`,
    [storeId],
  )

  // ── 이벤트 + 즉시쿠폰(prize_tiers): percent 모드 + 수량 미지정(무제한)으로
  //    시연 중 재고 소진 걱정 없이 확률만으로 당첨/꽝이 갈리게 한다.
  const tiers = [
    ...def.coupons.map((c) => ({ label: c.label, amount: c.amount, probability: c.probability })),
    { label: '꽝', amount: 0, probability: 100 - def.coupons.reduce((s, c) => s + c.probability, 0) },
  ]

  const { rows: [event] } = await client.query(
    `insert into events
       (store_id, name, status, display_start_date, display_end_date,
        expected_daily_participants, coupon_validity_type, coupon_validity_value,
        game_type, challenge_frequency, prize_tier_mode)
     values ($1,$2,'active',$3,$4,$5,'relative_days','14','claw_machine','daily','percent')
     returning id`,
    [storeId, def.gameCtaLabel.replace(/^🎮\s*/, ''), todayStr(-56), todayStr(365), 20],
  )

  for (const t of tiers) {
    await client.query(
      `insert into prize_tiers (event_id, label, amount, total_quantity, remaining_quantity, computed_probability, requires_verification)
       values ($1,$2,$3,999999999,999999999,$4,true)`,
      [event.id, t.label, t.amount, t.probability],
    )
  }

  for (const r of def.rewards) {
    await client.query(
      `insert into reward_catalog (store_id, name, point_cost, active, stock)
       values ($1,$2,$3,true,null)`,
      [storeId, r.name, r.pointCost],
    )
  }

  await client.query(
    `insert into business_entity
       (store_id, homepage_enabled, online_play_enabled, show_trust_metrics,
        category, description, tagline, game_cta_label, business_hours,
        business_type, parking_info, pet_friendly, store_pride_points)
     values ($1,true,true,true,$2,$3,$4,$5,$6,$7,$8,$9,'{}')`,
    [
      storeId, def.category ?? null, def.description, def.tagline, def.gameCtaLabel, def.businessHours,
      def.businessType, def.parkingInfo, def.petFriendly === true,
    ],
  )

  let sortOrder = 0
  for (const p of def.products) {
    await client.query(
      `insert into business_products (store_id, name, image_url, price, description, sort_order)
       values ($1,$2,null,$3,$4,$5)`,
      [storeId, p.name, p.price, p.description ?? null, sortOrder++],
    )
  }

  console.log(`✅ ${storeName} (${storeId}) 생성 완료`)
}

/**
 * Phase 1 콘텐츠 시드 실행 — CLI(`node scripts/seed-demo-stores.mjs`)와
 * 슈퍼관리자 "샘플 레퍼런스" 재생성 API(app/api/admin/super/demo-stores/regenerate)
 * 양쪽에서 동일 로직을 재사용하기 위해 pg.Client를 주입받는 함수로 분리했다.
 */
export async function runDemoStoresSeed(client, storeIds) {
  const targets = storeIds && storeIds.length > 0 ? STORES.filter((s) => storeIds.includes(s.slug)) : STORES
  for (const def of targets) {
    await seedStore(client, def)
  }
  return { count: targets.length, password: DEMO_PASSWORD }
}

// CLI로 직접 실행했을 때만(= API 라우트에서 import된 게 아니라
// `node scripts/seed-demo-stores.mjs`로 실행했을 때만) 자체적으로 커넥션을 열고 실행한다.
if (process.argv[1]?.replace(/\\/g, '/').endsWith('seed-demo-stores.mjs')) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  const { count, password } = await runDemoStoresSeed(client)
  console.log(`\n총 ${count}개 샘플 매장 생성 완료. 로그인 정보: demo-{slug}@dgting.co.kr / ${password}`)
  await client.end()
}
