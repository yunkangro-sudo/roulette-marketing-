/**
 * 광고주 대시보드/회원관리 등에서 공통으로 쓰는 기간 토글(오늘/이번주/이번달/직접설정)
 * → Supabase timestamptz 컬럼 쿼리용 UTC 경계값 변환.
 *
 * KST(UTC+9) 기준 "오늘/이번주(월요일부터)/이번달(1일부터)"을 계산한 뒤,
 * DB에는 UTC로 저장되므로 시작/끝 모두 UTC ISO 문자열로 변환해 반환한다.
 */
export type DashboardRange = 'today' | 'week' | 'month' | 'custom'

export interface ResolvedRange {
  /** 조회 시작 (포함), UTC ISO */
  startUtc: string
  /** 조회 종료 (미포함/exclusive), UTC ISO */
  endUtcExclusive: string
  /** 화면 표시용 KST 날짜 문자열 (YYYY-MM-DD) */
  startDateLabel: string
  endDateLabel: string
}

function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

/** KST 날짜(YYYY-MM-DD 로 취급되는 Date, 시각 무시)를 실제 UTC 인스턴트로 변환 (해당 KST 날짜의 00:00) */
function kstDateToUtc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d, 0, 0, 0) - 9 * 60 * 60 * 1000)
}

function fmt(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function resolveDashboardRange(range: DashboardRange, from?: string | null, to?: string | null): ResolvedRange {
  const now = kstNow()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const d = now.getUTCDate()

  const todayStart = kstDateToUtc(y, m, d)
  const tomorrowStart = kstDateToUtc(y, m, d + 1)

  if (range === 'today') {
    return {
      startUtc: todayStart.toISOString(),
      endUtcExclusive: tomorrowStart.toISOString(),
      startDateLabel: fmt(y, m, d),
      endDateLabel: fmt(y, m, d),
    }
  }

  if (range === 'week') {
    // KST 기준 이번주 월요일부터 오늘까지 (일요일=0 → 월요일 기준 보정)
    const dow = now.getUTCDay() // 0=일,1=월,...
    const diffToMonday = dow === 0 ? 6 : dow - 1
    const mondayDate = new Date(todayStart.getTime() - diffToMonday * 86400000)
    return {
      startUtc: mondayDate.toISOString(),
      endUtcExclusive: tomorrowStart.toISOString(),
      startDateLabel: mondayDate.toISOString().slice(0, 10),
      endDateLabel: fmt(y, m, d),
    }
  }

  if (range === 'month') {
    const firstOfMonth = kstDateToUtc(y, m, 1)
    return {
      startUtc: firstOfMonth.toISOString(),
      endUtcExclusive: tomorrowStart.toISOString(),
      startDateLabel: fmt(y, m, 1),
      endDateLabel: fmt(y, m, d),
    }
  }

  // custom
  const fromStr = from || fmt(y, m, d)
  const toStr = to || fmt(y, m, d)
  const [fy, fm, fd] = fromStr.split('-').map(Number)
  const [ty, tm, td] = toStr.split('-').map(Number)
  const startUtc = kstDateToUtc(fy, fm - 1, fd)
  const endUtcExclusive = kstDateToUtc(ty, tm - 1, td + 1)
  return { startUtc: startUtc.toISOString(), endUtcExclusive: endUtcExclusive.toISOString(), startDateLabel: fromStr, endDateLabel: toStr }
}

/** 조회 구간을 KST 기준 날짜 문자열 배열로 나눈다 (일별 라인차트 X축 생성용) */
export function enumerateKstDates(startDateLabel: string, endDateLabel: string): string[] {
  const [sy, sm, sd] = startDateLabel.split('-').map(Number)
  const [ey, em, ed] = endDateLabel.split('-').map(Number)
  const start = Date.UTC(sy, sm - 1, sd)
  const end = Date.UTC(ey, em - 1, ed)
  const dates: string[] = []
  for (let t = start; t <= end; t += 86400000) {
    const dt = new Date(t)
    dates.push(fmt(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()))
  }
  return dates
}

/** timestamptz 값을 KST 기준 YYYY-MM-DD로 변환 (일별 집계 그룹핑용) */
export function toKstDateLabel(isoString: string): string {
  const d = new Date(new Date(isoString).getTime() + 9 * 60 * 60 * 1000)
  return fmt(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}
