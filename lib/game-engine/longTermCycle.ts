/**
 * "장기 운영" 모드 — 캘린더 기준 예산 주기 계산 (순수 함수, DB 접근 없음)
 *
 * 규칙(지시문 3번):
 *  - 리셋 주기는 달력 기준: 주간 = 매주 월요일 시작(~일요일 종료), 월간 = 매월 1일 시작(~말일 종료)
 *  - 이벤트를 주/월 중간에 시작해도 첫 주기는 짧게 처리되고, 그다음부터 정규 주기로 맞춰진다
 *  - 주기 종료일이 이벤트의 display_end_date를 넘으면 display_end_date로 제한(상위 제약)
 *
 * 날짜는 전부 'YYYY-MM-DD' 문자열(시간대 없는 캘린더 날짜)로 다룬다. KST 자정 배치가
 * 이미 "오늘"을 KST 기준 날짜 문자열로 넘겨주므로, 여기서는 UTC Date 객체로 파싱해도
 * 시간대 이슈가 생기지 않는다(달력 계산에만 쓰고 실제 시각으로 변환하지 않음).
 */

export type ResetCycle = 'weekly' | 'monthly'

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`)
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr)
  d.setUTCDate(d.getUTCDate() + days)
  return formatDate(d)
}

/** a - b (일 단위). a가 b보다 미래면 양수 */
export function diffDays(a: string, b: string): number {
  return Math.round((parseDate(a).getTime() - parseDate(b).getTime()) / 86_400_000)
}

/** cycleStart가 속한 캘린더 주(월~일)의 일요일 */
function weekCycleEnd(cycleStart: string): string {
  const dow = parseDate(cycleStart).getUTCDay() // 0=일 1=월 ... 6=토
  const daysUntilSunday = dow === 0 ? 0 : 7 - dow
  return addDays(cycleStart, daysUntilSunday)
}

/** cycleStart가 속한 캘린더 월의 말일 */
function monthCycleEnd(cycleStart: string): string {
  const d = parseDate(cycleStart)
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
  return formatDate(lastDay)
}

function rawCycleEnd(cycleStart: string, resetCycle: ResetCycle): string {
  return resetCycle === 'weekly' ? weekCycleEnd(cycleStart) : monthCycleEnd(cycleStart)
}

/** 주기 종료일 다음날(주간=항상 다음 월요일, 월간=항상 다음달 1일) */
function nextCycleStart(cycleEnd: string): string {
  return addDays(cycleEnd, 1)
}

export interface CycleBounds {
  /** 이번 주기의 시작일 (오늘 기준으로 리셋이 일어났다면 갱신된 값) */
  cycleStart: string
  /** 이번 주기의 종료일 — display_end_date로 상한 적용됨 */
  cycleEnd: string
  /** 오늘 처리 중 주기 경계를 넘어서 리셋이 필요한지 */
  didReset: boolean
}

/**
 * 오늘 날짜 기준으로 현재 예산 주기의 시작/종료일을 계산하고, 주기 경계를
 * 이미 넘었다면(배치가 하루 이상 밀린 경우까지 포함해서) 리셋이 필요함을 알린다.
 */
export function resolveCycle(params: {
  today: string
  currentCycleStart: string
  resetCycle: ResetCycle
  displayEndDate: string
}): CycleBounds {
  const { today, resetCycle, displayEndDate } = params
  let cycleStart = params.currentCycleStart
  let didReset = false

  let end = rawCycleEnd(cycleStart, resetCycle)
  // 오늘이 주기 종료일을 이미 넘었으면, 넘지 않을 때까지 다음 주기로 계속 이동한다
  // (배치가 하루 이상 밀렸거나 처음 실행되는 극단적인 경우까지 안전하게 처리)
  while (today > end) {
    cycleStart = nextCycleStart(end)
    end = rawCycleEnd(cycleStart, resetCycle)
    didReset = true
  }

  const cycleEnd = end > displayEndDate ? displayEndDate : end
  return { cycleStart, cycleEnd, didReset }
}
