import { getIronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type AdminRole = 'advertiser' | 'staff' | 'agency' | 'super_admin'

/** super_admin/agency가 "이 업체로 관리 진입"했을 때 세션에 보존되는 대리접속 메타데이터 */
export interface ImpersonationContext {
  storeId: string
  storeName: string
  /** 대리접속 중인 원본(진짜) 슈퍼관리자/에이전시 계정 정보 — 배너·감사로그용 */
  originalAccountId: string
  originalEmail: string
  /** impersonation_log row id — 나가기/로그아웃 시 ended_at을 채울 때 사용 */
  logId: string
  startedAt: string
}

export interface AdminAccount {
  id: string
  storeId: string | null   // null = super_admin / agency
  email: string
  role: AdminRole
  impersonation?: ImpersonationContext
}

export interface AdminSessionData {
  account?: AdminAccount
}

export const sessionOptions: SessionOptions = {
  password: process.env.AUTH_SECRET!,
  cookieName: 'dang_admin_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7일
  },
}

/** 세션 객체 반환 (raw — 로그인 체크 없음) */
export async function getAdminSession() {
  return getIronSession<AdminSessionData>(await cookies(), sessionOptions)
}

/**
 * 대리접속 중이면 super_admin/agency 계정을 "advertiser처럼" 보이도록 스왑한다.
 *
 * 목적: 이미 만들어둔 광고주 전용 화면·API(대시보드/회원관리/쿠폰관리 등)가
 * `account.role === 'advertiser'` / `account.storeId` 검사 하나로 동작하고 있으므로,
 * 대리접속 시에도 이 두 값만 바꿔주면 기존 코드를 전혀 건드리지 않고 그대로 재사용할 수 있다.
 * 원본(진짜) 계정 정보는 `impersonation` 필드에 그대로 보존되어 배너·"나가기"·감사로그에 쓰인다.
 */
export function getEffectiveAccount(account: AdminAccount): AdminAccount {
  if ((account.role === 'super_admin' || account.role === 'agency') && account.impersonation) {
    return {
      id: account.id,
      storeId: account.impersonation.storeId,
      email: account.email,
      role: 'advertiser',
      impersonation: account.impersonation,
    }
  }
  return account
}

/** 로그인한 "유효 계정"(대리접속 중이면 advertiser로 스왑됨) 반환. 없으면 /admin/login으로 리디렉트 (서버 컴포넌트 전용) */
export async function requireAdminAuth() {
  const session = await getAdminSession()
  if (!session.account) redirect('/admin/login')
  return getEffectiveAccount(session.account)
}

/** advertiser는 자기 store_id만 접근 가능. 아니면 null 반환 (전체 허용) */
export function getAllowedStoreId(account: AdminSessionData['account']): string | null {
  if (!account) return null
  if (account.role === 'advertiser') return account.storeId
  return null // super_admin, agency, staff → 전체 허용
}
