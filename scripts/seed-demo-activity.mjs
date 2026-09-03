/**
 * 영업 시연용 샘플(데모) 매장 10곳 — Phase 2: 가상 활동데이터 생성
 *
 * 사용법: node scripts/seed-demo-activity.mjs
 *   - 반드시 scripts/seed-demo-stores.mjs(Phase 1)를 먼저 실행해서 매장 콘텐츠가
 *     있어야 한다 (이 스크립트는 각 매장의 기존 이벤트/경품티어/리워드를 그대로 재사용).
 *   - 재실행 안전(멱등): 이 스크립트가 만든 활동데이터(손님/방문/쿠폰/포인트/과거이벤트)만
 *     지우고 다시 만든다. Phase 1 콘텐츠(매장 정보/이벤트 설정/리워드 정의)는 건드리지 않는다.
 *
 * upsert_customer_loyalty RPC가 now() 고정이라 과거 날짜 시뮬레이션에 못 쓰기 때문에,
 * 이 스크립트는 그 RPC가 하는 일(방문횟수/최근방문일 갱신, 포인트 적립, 세그먼트 계산)을
 * 과거 타임스탬프 기준으로 직접 계산해서 테이블에 꽂아넣는다.
 *
 * ── daily_participation_log의 함정 ────────────────────────────────────────
 * 이 테이블은 (store_id, kakao_user_id, event_id) UNIQUE + upsert라서 "이력"이 아니라
 * "이벤트별 마지막 참여일"만 남는다. 성과리포트의 "전월 대비 증감률"/"재방문율"은 이 테이블의
 * date 컬럼으로 월별 집계를 하므로, 한 이벤트만 계속 재사용하면 지난달 참여자가 이번달 걸로
 * 덮어써져서 전월 데이터가 통째로 사라져 버린다. 그래서 활동 기간에 걸친 "지난 달" 각각에
 * status='ended'인 과거용 이벤트를 복제 생성해서 그 달의 참여는 그 달 전용 이벤트로 기록한다
 * (실제 서비스에서 매달 이벤트를 갈아치우는 것과 같은 모양). 현재 활성 이벤트(status='active')는
 * 절대 건드리지 않는다 — /api/events/active 등이 .maybeSingle()로 조회해서 2개 이상이면 깨진다.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID, createCipheriv, createHmac, randomBytes } from 'node:crypto'
import pg from 'pg'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m || process.env[m[1]]) continue
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}

const NOW = new Date()
const DAY_MS = 86400000
const MIN_PARTICIPANTS_TO_SHOW = 10 // lib/business-page/trustMetrics.ts와 동일

// ── 전화번호 암호화 (lib/crypto/phoneEncryption.ts와 동일 알고리즘 재구현) ──
function getPhoneKey() {
  const raw = process.env.PHONE_ENCRYPTION_KEY
  if (!raw || raw.length < 32) return null
  return Buffer.from(raw.slice(0, 64), 'hex').slice(0, 32)
}
function encryptPhone(phone) {
  const key = getPhoneKey()
  if (!key) return null
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}
function hashPhone(phone) {
  const salt = process.env.PHONE_HASH_SALT
  if (!salt) return null
  const normalized = phone.replace(/\D/g, '').replace(/^82/, '0')
  return createHmac('sha256', salt).update(normalized).digest('hex')
}

// ── 매장별 활동 규모 설정 (업종별 방문빈도/트래픽 차등) ──
// weeksBack: 3~8주 범위. customers: 가짜 손님 총원(80~300). hourRange: 방문 시각대.
// fallbackInterval: loyalty_settings.default_revisit_interval_days로 반영(세그먼트 판정 기준).
// weeksBack은 세그먼트 판정 임계값(interval*1.5, interval*3)이 기간 안에서 실제로
// 발생 가능하도록 fallbackInterval과 맞춰 정했다 — 예: interval=21이면 AT_RISK 구간이
// (31.5일, 63일)이라 기간이 5주(35일) 이하면 이 구간에 아예 도달할 손님을 못 만든다.
const ACTIVITY_CONFIG = {
  'demo-bbq':        { weeksBack: 6, customers: 260, hourRange: [16, 23], fallbackInterval: 7 },
  'demo-cafe-cream': { weeksBack: 7, customers: 280, hourRange: [10, 21], fallbackInterval: 7 },
  'demo-hair-salon': { weeksBack: 7, customers: 95,  hourRange: [10, 19], fallbackInterval: 21 },
  'demo-nail':       { weeksBack: 7, customers: 110, hourRange: [11, 19], fallbackInterval: 21 },
  'demo-gym':        { weeksBack: 7, customers: 130, hourRange: [6, 22],  fallbackInterval: 12 },
  'demo-esthetic':   { weeksBack: 7, customers: 90,  hourRange: [10, 20], fallbackInterval: 21 },
  'demo-bakery':     { weeksBack: 8, customers: 300, hourRange: [8, 20],  fallbackInterval: 7 },
  'demo-carwash':    { weeksBack: 7, customers: 120, hourRange: [9, 19],  fallbackInterval: 14 },
  'demo-kidscafe':   { weeksBack: 7, customers: 220, hourRange: [10, 19], fallbackInterval: 14 },
  'demo-petsalon':   { weeksBack: 7, customers: 85,  hourRange: [10, 18], fallbackInterval: 21 },
}

// ── 유틸 ──
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randFloat(min, max) { return Math.random() * (max - min) + min }
function pick(arr) { return arr[randInt(0, arr.length - 1)] }
function sample(weights) {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}
function kstYearMonth(d) {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`
}
/** UTC 인스턴트를 KST 기준 "YYYY-MM-DD"로 변환 (서버가 어느 타임존에서 돌든 무관하게
 *  동작해야 한다 — lib/game/persistPlayResult.ts의 kstToday()와 동일한 방식). */
function dateOnly(d) {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
function pickTier(tiers) {
  const total = tiers.reduce((s, t) => s + Number(t.computed_probability), 0)
  let r = Math.random() * total
  for (const t of tiers) {
    r -= Number(t.computed_probability)
    if (r <= 0) return t
  }
  return tiers[tiers.length - 1]
}

async function batchInsert(client, table, columns, rows) {
  if (rows.length === 0) return
  const CHUNK = 400
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const values = []
    const placeholders = chunk.map((row, ri) => {
      const base = ri * columns.length
      const ph = columns.map((_, ci) => `$${base + ci + 1}`)
      values.push(...row)
      return `(${ph.join(',')})`
    })
    await client.query(
      `insert into ${table} (${columns.join(',')}) values ${placeholders.join(',')}`,
      values,
    )
  }
}

// ── 매장 활동 데이터 초기화 (Phase 2가 만든 것만 지운다) ──
async function wipeActivity(client, storeId) {
  await client.query('delete from point_ledger where store_id = $1', [storeId])
  await client.query('delete from coupons where store_id = $1', [storeId])
  await client.query('delete from activity_log where store_id = $1', [storeId])
  await client.query('delete from customer_loyalty where store_id = $1', [storeId])
  await client.query('delete from daily_participation_log where store_id = $1', [storeId])
  // 과거 백데이터용으로 복제했던 이벤트만 삭제 (status='ended') — prize_tiers는 CASCADE로 함께 삭제됨.
  await client.query(`delete from events where store_id = $1 and status = 'ended'`, [storeId])
}

async function seedStoreActivity(client, storeId, config) {
  const { rows: [contract] } = await client.query(
    'select store_id, is_demo from store_contracts where store_id = $1',
    [storeId],
  )
  if (!contract || contract.is_demo !== true) {
    console.log(`⏭  ${storeId}: is_demo 매장이 아니라 건너뜀 (안전장치)`)
    return
  }

  const { rows: [activeEvent] } = await client.query(
    `select id, name, status, display_start_date, display_end_date, expected_daily_participants,
            coupon_validity_type, coupon_validity_value, game_type, challenge_frequency, prize_tier_mode
     from events where store_id = $1 and status = 'active' limit 1`,
    [storeId],
  )
  if (!activeEvent) {
    console.log(`⚠️  ${storeId}: 활성 이벤트가 없어 건너뜀 (Phase 1을 먼저 실행했는지 확인)`)
    return
  }

  const { rows: activeTiers } = await client.query(
    'select id, label, amount, computed_probability from prize_tiers where event_id = $1',
    [activeEvent.id],
  )
  const { rows: rewards } = await client.query(
    'select id, name, point_cost, requires_verification from reward_catalog where store_id = $1 order by point_cost asc',
    [storeId],
  )
  const { rows: [loyalty] } = await client.query(
    'select point_per_visit from loyalty_settings where store_id = $1',
    [storeId],
  )
  const pointPerVisit = loyalty?.point_per_visit ?? 100
  const validityDays = activeEvent.coupon_validity_type === 'relative_days'
    ? parseInt(activeEvent.coupon_validity_value, 10) || 14
    : 14

  await wipeActivity(client, storeId)

  await client.query(
    'update loyalty_settings set default_revisit_interval_days = $2 where store_id = $1',
    [storeId, config.fallbackInterval],
  )

  // ── 기간(일) 배열 구성 ──
  const totalDays = config.weeksBack * 7
  const days = []
  for (let i = totalDays - 1; i >= 0; i--) {
    days.push(new Date(NOW.getTime() - i * DAY_MS))
  }
  const todayKey = dateOnly(NOW)
  const yesterdayKey = dateOnly(new Date(NOW.getTime() - DAY_MS))

  // ── 월별 이벤트 버킷: 현재 달=기존 활성 이벤트, 이전 달=복제 생성 ──
  const monthKeys = [...new Set(days.map((d) => kstYearMonth(d)))].sort()
  const currentMonthKey = kstYearMonth(NOW)
  const monthEventMap = new Map() // monthKey -> { eventId, tiers }
  monthEventMap.set(currentMonthKey, { eventId: activeEvent.id, tiers: activeTiers })

  for (const mk of monthKeys) {
    if (mk === currentMonthKey) continue
    const { rows: [clonedEvent] } = await client.query(
      `insert into events
         (store_id, name, status, display_start_date, display_end_date,
          expected_daily_participants, coupon_validity_type, coupon_validity_value,
          game_type, challenge_frequency, prize_tier_mode)
       values ($1,$2,'ended',$3,$4,$5,$6,$7,$8,$9,$10)
       returning id`,
      [
        storeId, `${activeEvent.name} (백데이터 ${mk})`,
        `${mk}-01`, `${mk}-28`, activeEvent.expected_daily_participants,
        activeEvent.coupon_validity_type, activeEvent.coupon_validity_value,
        activeEvent.game_type, activeEvent.challenge_frequency, activeEvent.prize_tier_mode,
      ],
    )
    const clonedTiers = []
    for (const t of activeTiers) {
      const { rows: [ct] } = await client.query(
        `insert into prize_tiers (event_id, label, amount, total_quantity, remaining_quantity, computed_probability, requires_verification)
         values ($1,$2,$3,999999999,999999999,$4,true) returning id, label, amount, computed_probability`,
        [clonedEvent.id, t.label, t.amount, t.computed_probability],
      )
      clonedTiers.push(ct)
    }
    monthEventMap.set(mk, { eventId: clonedEvent.id, tiers: clonedTiers })
  }

  // ── 날짜별 가중치(우상향 + 주말 강세 + 최근 2일 부스트) ──
  const weights = days.map((d, idx) => {
    const trend = 0.6 + 0.8 * (idx / Math.max(1, days.length - 1))
    const dow = d.getDay()
    const weekend = dow === 0 || dow === 6 ? 1.5 : 1.0
    const isRecent = dateOnly(d) === todayKey || dateOnly(d) === yesterdayKey
    const recency = isRecent ? 2.4 : 1.0
    return trend * weekend * recency
  })

  // ── 손님 풀 구성 ──
  // recalculate_customer_segment(021_customer_segments.sql)와 동일한 판정 규칙:
  //   daysSinceLast<=30 → ACTIVE, >interval*3 → DORMANT, >interval*1.5 → AT_RISK, 그 외 ACTIVE
  // 이 규칙상 AT_RISK/DORMANT 구간은 daysSinceLast>30일 때만 열리므로, interval*3<=30인
  // 업종(음식점/카페/베이커리처럼 방문주기가 짧은 곳)은 AT_RISK가 구조적으로 나올 수 없다
  // (실제 서비스 로직 자체의 특성 — 방문주기가 짧으면 활성→휴면으로 바로 넘어가는 게 자연스럽다).
  // 그래서 랜덤 샘플링 대신 "이 손님의 마지막 방문 후 경과일이 정확히 어느 구간에 들어가야
  // 하는지"를 먼저 정하고 거꾸로 날짜를 배정한다 — 그래야 매장마다 5단계가 실제로 갈라진다.
  const interval = config.fallbackInterval
  const atRiskBand = [Math.max(31, Math.ceil(interval * 1.5) + 1), Math.min(interval * 3 - 1, totalDays - 3)]
  const dormantBand = [Math.max(31, interval * 3 + 1), totalDays - 1]
  const hasAtRiskBand = atRiskBand[0] <= atRiskBand[1]
  const hasDormantBand = dormantBand[0] <= dormantBand[1]

  const N = config.customers
  const returningCount = Math.round(N * 0.25)
  const oneTimeCount = N - returningCount
  const forcedReturnedCount = Math.max(2, Math.round(returningCount * 0.1))
  const atRiskCount = hasAtRiskBand ? Math.max(2, Math.round(returningCount * 0.15)) : 0
  const dormantCount = hasDormantBand ? Math.max(2, Math.round(returningCount * 0.12)) : 0
  const guaranteedRecentCount = Math.min(oneTimeCount, 16)

  const customers = []
  for (let i = 0; i < N; i++) {
    const kakaoUserId = `demo-${storeId}-c${i}`
    const phone = `010-0000-${String(i).padStart(4, '0')}`
    let role = 'normal'
    if (i < forcedReturnedCount) role = 'forcedReturned'
    else if (i < forcedReturnedCount + atRiskCount) role = 'atRisk'
    else if (i < forcedReturnedCount + atRiskCount + dormantCount) role = 'dormant'
    customers.push({
      kakaoUserId,
      phone,
      isReturning: i < returningCount,
      role,
      isGuaranteedRecent: i >= returningCount && (i - returningCount) < guaranteedRecentCount,
      visitDays: [],
    })
  }

  // daysSinceLast(경과일) 목표값을 실제 day 인덱스로 변환 (오늘=totalDays-1)
  const daysSinceToIndex = (d) => Math.max(0, Math.min(totalDays - 1, totalDays - 1 - d))

  for (const c of customers) {
    if (c.isReturning) {
      if (c.role === 'forcedReturned') {
        // 초반 2회 방문 → 긴 공백 → 최근 1회 복귀
        const earlyPoolEnd = Math.max(2, Math.floor(days.length * 0.25))
        const idxA = randInt(0, earlyPoolEnd - 1)
        const idxB = randInt(0, earlyPoolEnd - 1)
        const idxC = randInt(Math.max(0, days.length - 8), days.length - 1)
        c.visitDays = [...new Set([idxA, idxB, idxC])]
      } else if (c.role === 'atRisk' || c.role === 'dormant') {
        // 방문 2회 고정(3회 이상이면 개인 평균 간격이 fallback을 덮어써서 목표 구간이 어긋난다) +
        // 마지막 방문의 경과일을 목표 구간(AT_RISK 또는 DORMANT) 안으로 직접 배정.
        const band = c.role === 'atRisk' ? atRiskBand : dormantBand
        const targetDaysSince = randInt(band[0], band[1])
        const lastIdx = daysSinceToIndex(targetDaysSince)
        const firstIdx = randInt(Math.max(0, lastIdx - 20), Math.max(0, lastIdx - 3))
        c.visitDays = [...new Set([firstIdx, lastIdx])]
      } else {
        const visitCount = sample([45, 25, 20, 10]) + 2 // 2~5회, 최근일수록 가중치 높은 분포 샘플
        const set = new Set()
        for (let tries = 0; tries < visitCount * 5 && set.size < visitCount; tries++) {
          set.add(sample(weights))
        }
        c.visitDays = [...set]
      }
    } else if (c.isGuaranteedRecent) {
      c.visitDays = [Math.random() < 0.5 ? days.length - 1 : days.length - 2]
    } else {
      c.visitDays = [sample(weights)]
    }
    c.visitDays.sort((a, b) => a - b)
  }

  // ── 방문 타임스탬프 생성 + 참여/쿠폰/포인트 데이터 조립 ──
  const dailyParticipationMap = new Map() // key: kakaoUserId|eventId -> {date, last_played_at}
  const activityLogRows = []
  const couponRows = []
  const pointLedgerRows = []

  for (const c of customers) {
    const timestamps = c.visitDays.map((dayIdx) => {
      const base = days[dayIdx]
      const hour = randInt(config.hourRange[0], config.hourRange[1])
      const ts = new Date(base)
      ts.setHours(hour, randInt(0, 59), randInt(0, 59), 0)
      if (ts.getTime() > NOW.getTime()) ts.setTime(NOW.getTime() - randInt(60, 3600) * 1000)
      return ts
    }).sort((a, b) => a - b)

    c.timestamps = timestamps
    c.firstVisitAt = timestamps[0]
    c.lastVisitAt = timestamps[timestamps.length - 1]
    c.visitCount = timestamps.length
    c.pointBalance = 0
    c.gapDays = []

    for (let vi = 0; vi < timestamps.length; vi++) {
      const ts = timestamps[vi]
      if (vi > 0) c.gapDays.push((ts - timestamps[vi - 1]) / DAY_MS)

      const mk = kstYearMonth(ts)
      const bucket = monthEventMap.get(mk) ?? monthEventMap.get(currentMonthKey)
      const eventId = bucket.eventId
      const tiers = bucket.tiers

      const dpKey = `${c.kakaoUserId}|${eventId}`
      const existing = dailyParticipationMap.get(dpKey)
      if (!existing || ts > existing.last_played_at) {
        dailyParticipationMap.set(dpKey, { storeId, kakaoUserId: c.kakaoUserId, eventId, date: dateOnly(ts), last_played_at: ts })
      }

      activityLogRows.push([randomUUID(), storeId, c.kakaoUserId, 'game_start', eventId, 'game', ts.toISOString(), 'qr_instore'])

      const tier = pickTier(tiers)
      const won = tier.label !== '꽝'

      if (won) {
        const couponId = randomUUID()
        const validUntil = new Date(ts.getTime() + validityDays * DAY_MS)
        const willUse = Math.random() < randFloat(0.4, 0.7)
        let status = 'pending_verify'
        let usedAt = null
        if (willUse) {
          const candidateUsedAt = new Date(ts.getTime() + randInt(1, 72) * 3600 * 1000)
          usedAt = candidateUsedAt.getTime() > NOW.getTime() ? NOW : candidateUsedAt
          if (usedAt.getTime() <= validUntil.getTime()) status = 'used'
          else { status = 'expired'; usedAt = null }
        } else if (validUntil.getTime() < NOW.getTime()) {
          status = 'expired'
        }
        couponRows.push([
          couponId, eventId, c.kakaoUserId, storeId, tier.amount, tier.label, 'game_win',
          true, status, ts.toISOString(), validUntil.toISOString(), usedAt ? usedAt.toISOString() : null,
          null, null,
        ])
        activityLogRows.push([randomUUID(), storeId, c.kakaoUserId, 'game_complete', couponId, 'coupon', ts.toISOString(), 'qr_instore'])
        if (status === 'used') {
          activityLogRows.push([randomUUID(), storeId, c.kakaoUserId, 'coupon_used', couponId, 'coupon', usedAt.toISOString(), 'qr_instore'])
        }
      } else {
        activityLogRows.push([randomUUID(), storeId, c.kakaoUserId, 'game_complete', eventId, 'game', ts.toISOString(), 'qr_instore'])
      }

      if (pointPerVisit > 0) {
        const ledgerId = randomUUID()
        pointLedgerRows.push([ledgerId, storeId, c.kakaoUserId, 'earn', pointPerVisit, null, null, ts.toISOString()])
        activityLogRows.push([randomUUID(), storeId, c.kakaoUserId, 'point_earned', ledgerId, 'point_ledger', ts.toISOString(), 'qr_instore'])
        c.pointBalance += pointPerVisit
      }
    }

    // 카카오 로그인 (최초 방문 시점)
    activityLogRows.push([randomUUID(), storeId, c.kakaoUserId, 'kakao_login', null, null, c.firstVisitAt.toISOString(), 'qr_instore'])

    // 당근 클릭 (참여자의 약 30%)
    if (Math.random() < 0.3) {
      let clickAt = new Date(c.firstVisitAt.getTime() + randInt(10, 4 * 24 * 60) * 60 * 1000)
      if (clickAt.getTime() > NOW.getTime()) clickAt = NOW
      activityLogRows.push([randomUUID(), storeId, c.kakaoUserId, 'daangn_click', null, null, clickAt.toISOString(), 'qr_instore'])
    }
  }

  // ── 장기 리워드 교환 시뮬레이션 (누적 포인트 충분한 재방문 손님 일부) ──
  if (rewards.length > 0) {
    for (const c of customers) {
      if (!c.isReturning || c.visitCount < 3) continue
      if (Math.random() >= 0.35) continue
      const affordable = rewards.filter((r) => c.pointBalance >= r.point_cost).sort((a, b) => b.point_cost - a.point_cost)
      if (affordable.length === 0) continue
      const reward = affordable[0]
      let redeemAt = new Date(c.lastVisitAt.getTime() + randInt(1, 6) * 3600 * 1000)
      if (redeemAt.getTime() > NOW.getTime()) redeemAt = NOW
      const couponId = randomUUID()
      const validUntil = new Date(redeemAt.getTime() + 14 * DAY_MS)
      couponRows.push([
        couponId, null, c.kakaoUserId, storeId, 0, reward.name, 'reward_redemption',
        reward.requires_verification, 'used', redeemAt.toISOString(), validUntil.toISOString(),
        redeemAt.toISOString(), reward.id, reward.point_cost,
      ])
      pointLedgerRows.push([randomUUID(), storeId, c.kakaoUserId, 'redeem', reward.point_cost, couponId, null, redeemAt.toISOString()])
      activityLogRows.push([randomUUID(), storeId, c.kakaoUserId, 'reward_redeemed', couponId, 'reward', redeemAt.toISOString(), 'qr_instore'])
      c.pointBalance = Math.max(0, c.pointBalance - reward.point_cost)
    }
  }

  // ── customer_loyalty 최종 상태 계산 ──
  const loyaltyRows = []
  for (const c of customers) {
    let segment = 'NEW'
    let avgInterval = null
    if (c.visitCount > 1) {
      let effectiveInterval = config.fallbackInterval
      if (c.visitCount >= 3 && c.gapDays.length > 0) {
        avgInterval = c.gapDays.reduce((a, b) => a + b, 0) / c.gapDays.length
        effectiveInterval = avgInterval
      }
      const daysSinceLast = (NOW - c.lastVisitAt) / DAY_MS
      if (c.role === 'forcedReturned') segment = 'RETURNED'
      else if (daysSinceLast <= 30) segment = 'ACTIVE'
      else if (daysSinceLast > effectiveInterval * 3) segment = 'DORMANT'
      else if (daysSinceLast > effectiveInterval * 1.5) segment = 'AT_RISK'
      else segment = 'ACTIVE'
    }

    loyaltyRows.push([
      storeId, c.kakaoUserId, c.pointBalance, c.visitCount, c.lastVisitAt.toISOString(),
      encryptPhone(c.phone), hashPhone(c.phone), c.firstVisitAt.toISOString(), c.firstVisitAt.toISOString(),
      segment, c.visitCount >= 3 ? avgInterval : null,
    ])
  }

  await batchInsert(
    client,
    'customer_loyalty',
    ['store_id', 'kakao_user_id', 'point_balance', 'visit_count', 'last_visit_at', 'phone_encrypted', 'phone_hash', 'first_seen_at', 'kakao_first_login_at', 'segment', 'average_visit_interval'],
    loyaltyRows,
  )
  await batchInsert(
    client,
    'daily_participation_log',
    ['store_id', 'kakao_user_id', 'event_id', 'date', 'last_played_at'],
    [...dailyParticipationMap.values()].map((r) => [r.storeId, r.kakaoUserId, r.eventId, r.date, r.last_played_at.toISOString()]),
  )
  await batchInsert(
    client,
    'coupons',
    ['id', 'event_id', 'kakao_user_id', 'store_id', 'amount', 'label', 'source_type', 'requires_verification', 'status', 'issued_at', 'valid_until', 'used_at', 'reward_catalog_id', 'point_cost'],
    couponRows,
  )
  await batchInsert(
    client,
    'point_ledger',
    ['id', 'store_id', 'kakao_user_id', 'type', 'amount', 'related_coupon_id', 'related_reward_id', 'created_at'],
    pointLedgerRows,
  )
  await batchInsert(
    client,
    'activity_log',
    ['id', 'store_id', 'kakao_user_id', 'event_type', 'ref_id', 'ref_type', 'occurred_at', 'entry_source'],
    activityLogRows,
  )

  const monthToDate = [...dailyParticipationMap.values()].filter((r) => dateOnly(r.last_played_at) >= todayKey.slice(0, 7) + '-01').length
  const segCounts = loyaltyRows.reduce((acc, r) => { acc[r[9]] = (acc[r[9]] ?? 0) + 1; return acc }, {})
  console.log(
    `✅ ${storeId}: 손님 ${N}명, 방문 ${customers.reduce((s, c) => s + c.visitCount, 0)}건, ` +
    `쿠폰 ${couponRows.length}장, 이번달참여추정 ${monthToDate}명(임계값 ${MIN_PARTICIPANTS_TO_SHOW}), 세그먼트 ${JSON.stringify(segCounts)}`,
  )
}

/**
 * Phase 2 가상 활동데이터 시드 실행 — CLI(`node scripts/seed-demo-activity.mjs`)와
 * 슈퍼관리자 "샘플 레퍼런스" 재생성 API 양쪽에서 재사용하기 위해 pg.Client를 주입받는다.
 * 반드시 runDemoStoresSeed(Phase 1)가 먼저 실행되어 있어야 한다(활성 이벤트/리워드 재사용).
 */
export async function runDemoActivitySeed(client, storeIds) {
  const { rows: allDemoStores } = await client.query(
    `select store_id from store_contracts where is_demo = true order by store_id`,
  )
  const demoStores = storeIds && storeIds.length > 0
    ? allDemoStores.filter((s) => storeIds.includes(s.store_id))
    : allDemoStores
  if (demoStores.length === 0) {
    console.log('⚠️  is_demo=true 매장이 없습니다. scripts/seed-demo-stores.mjs를 먼저 실행하세요.')
    return { count: 0 }
  }
  for (const { store_id: storeId } of demoStores) {
    const config = ACTIVITY_CONFIG[storeId] ?? { weeksBack: 5, customers: 120, hourRange: [10, 20], fallbackInterval: 14 }
    await seedStoreActivity(client, storeId, config)
  }
  return { count: demoStores.length }
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('seed-demo-activity.mjs')) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  const { count } = await runDemoActivitySeed(client)
  if (count > 0) console.log(`\n총 ${count}개 샘플 매장 가상 활동데이터 생성 완료.`)
  await client.end()
}
