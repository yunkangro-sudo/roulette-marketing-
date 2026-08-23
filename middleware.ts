import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, getEffectiveAccount, type AdminSessionData } from '@/lib/admin/session'
import { getSubscriptionStatus, SUBSCRIPTION_GATED_PATH_PREFIXES } from '@/lib/admin/subscription'

/**
 * "매장 전용" 경로 접근 제어. 두 가지 규칙을 함께 처리한다.
 *
 * 1) 광고주(advertiser) 이용기간 만료 차단
 *    - 오늘 <= end_date: 정상 이용
 *    - end_date < 오늘 <= end_date + 7일(유예): 정상 이용 (경고 배너는 layout에서 표시)
 *    - 오늘 > end_date + 7일: 지정 경로 전부 차단 → /admin/expired 로 이동
 *    - /staff(계산대)는 절대 차단하지 않는다 — 이미 발급된 쿠폰은 매장 이용기간과
 *      무관하게 계속 사용 처리해야 손님과의 신뢰 문제가 생기지 않는다.
 *    - subscriptions row가 없는 매장(신규 등록 직후 등)은 무제한 체험으로 간주해 막지 않는다.
 *
 * 2) super_admin/agency는 "대리접속(impersonation)" 없이 매장 전용 경로에 들어올 수 없다.
 *    전역 탭이 사라졌으니 URL을 직접 쳐도 /admin/companies로 되돌린다.
 *    대리접속 중(=effective role이 advertiser로 스왑됨)이면 광고주와 완전히 동일하게
 *    취급하되, 이용기간 만료로 인한 차단만은 적용하지 않는다 — 슈퍼관리자가 만료된
 *    업체를 들여다보고 처리해야 하는 상황이 오히려 더 흔하기 때문 (배너로만 안내).
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const pathname = request.nextUrl.pathname
  const isGatedPath = SUBSCRIPTION_GATED_PATH_PREFIXES.some((p) => pathname.startsWith(p))
  if (!isGatedPath) return response

  const session = await getIronSession<AdminSessionData>(request, response, sessionOptions)
  const rawAccount = session.account
  if (!rawAccount) return response

  if ((rawAccount.role === 'super_admin' || rawAccount.role === 'agency') && !rawAccount.impersonation) {
    return NextResponse.redirect(new URL('/admin/companies', request.url))
  }

  const account = getEffectiveAccount(rawAccount)
  if (account.role !== 'advertiser') return response

  if (rawAccount.impersonation) return response // 대리접속 중엔 만료 차단 없음, 배너만

  const status = await getSubscriptionStatus(account.storeId)
  if (status.status === 'expired') {
    return NextResponse.redirect(new URL('/admin/expired', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
