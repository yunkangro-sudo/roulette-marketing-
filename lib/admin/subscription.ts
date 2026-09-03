import { createServerClient } from '@/lib/supabase/server'

/**
 * 매장 "이용기간(구독)" 상태 판정.
 *
 * 진실의 원천은 subscriptions 테이블 — 매장당 여러 row가 쌓이고(갱신 이력),
 * end_date가 가장 최근인 row를 "현재 구독"으로 간주한다.
 *
 * ── 'trial' = 승인대기 (2026-09 가입승인 게이트 도입 이후 의미 변경) ──
 * subscriptions row가 아예 없는 매장은 'trial'로 분류된다. 과거에는 이 상태를
 * "무제한 체험"으로 취급해 관리자 기능을 전부 열어줬지만, 이는 회원가입 완료 즉시
 * 입금 확인 없이 서비스를 무제한 이용할 수 있는 구멍이었다. 지금은 middleware.ts에서
 * 'trial'을 'expired'와 동일한 카테고리로 취급해 차단한다 — 신규 가입(/api/signup)은
 * subscriptions row를 만들지 않으므로 항상 'trial'로 시작하고, 슈퍼관리자가 "새 결제
 * 등록"(POST /api/admin/companies/[id]/subscriptions)으로 최초 구독 row를 넣어주는
 * 순간이 곧 "승인"이 되어 'active'로 전환된다. status 값 자체는 하위호환을 위해
 * 'trial'을 그대로 쓰지만, 화면 라벨은 전부 "승인대기"로 표시한다.
 */
export type SubscriptionStatusKind = 'trial' | 'active' | 'grace' | 'expired'

export interface SubscriptionStatus {
  status: SubscriptionStatusKind
  /** 최신 구독의 시작일 (YYYY-MM-DD), row 없으면 null */
  startDate: string | null
  /** 최신 구독의 종료일 (YYYY-MM-DD), row 없으면 null */
  endDate: string | null
  /** grace 상태일 때만 값이 있음 — 유예기간 중 남은 일수 */
  graceDaysLeft: number | null
}

const GRACE_PERIOD_DAYS = 7

function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * (start_date, end_date)만 있으면 판정 가능한 순수 함수 부분. 매장이 많을 때 매장마다
 * `getSubscriptionStatus`를 호출(N+1 쿼리)하는 대신, 한 번에 bulk 조회한 뒤 이 함수로
 * 각 row를 분류할 수 있도록 분리했다 (전체 대시보드의 매장 상태 집계 등에서 사용).
 */
export function classifySubscription(
  startDate: string | null,
  endDate: string | null
): SubscriptionStatus {
  if (!endDate) {
    return { status: 'trial', startDate: null, endDate: null, graceDaysLeft: null }
  }

  const today = toDateOnly(kstNow())
  const end = toDateOnly(new Date(`${endDate}T00:00:00`))
  const graceDeadline = new Date(end)
  graceDeadline.setDate(graceDeadline.getDate() + GRACE_PERIOD_DAYS)

  if (today.getTime() <= end.getTime()) {
    return { status: 'active', startDate, endDate, graceDaysLeft: null }
  }

  if (today.getTime() <= graceDeadline.getTime()) {
    const daysLeft = Math.ceil((graceDeadline.getTime() - today.getTime()) / 86400000)
    return { status: 'grace', startDate, endDate, graceDaysLeft: daysLeft }
  }

  return { status: 'expired', startDate, endDate, graceDaysLeft: null }
}

export async function getSubscriptionStatus(storeId: string | null | undefined): Promise<SubscriptionStatus> {
  if (!storeId) {
    return { status: 'trial', startDate: null, endDate: null, graceDaysLeft: null }
  }

  const supabase = createServerClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('start_date, end_date')
    .eq('store_id', storeId)
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  return classifySubscription(data?.start_date ?? null, data?.end_date ?? null)
}

/**
 * "매장 전용" 경로 — /staff(계산대)는 절대 포함하지 않는다 (이미 발급된 쿠폰은 이용기간과
 * 무관하게 사용 가능해야 함). 두 가지 목적으로 쓰인다:
 *   1. advertiser 이용기간 만료('expired') + 승인대기('trial') 차단 (middleware.ts)
 *   2. 대리접속(impersonation) 없는 super_admin/agency의 접근 차단 → /admin/companies로 이동
 */
export const SUBSCRIPTION_GATED_PATH_PREFIXES = [
  '/admin/events',
  '/admin/dashboard',
  '/admin/members',
  '/admin/coupons',
  '/admin/loyalty-settings',
  '/admin/reward-catalog',
  '/admin/report',
]
