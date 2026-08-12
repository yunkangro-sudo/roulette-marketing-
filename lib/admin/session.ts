import { getIronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type AdminRole = 'advertiser' | 'staff' | 'agency' | 'super_admin'

export interface AdminSessionData {
  account?: {
    id: string
    storeId: string | null   // null = super_admin / agency
    email: string
    role: AdminRole
  }
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

/** 로그인한 계정 반환. 없으면 /admin/login으로 리디렉트 (서버 컴포넌트 전용) */
export async function requireAdminAuth() {
  const session = await getAdminSession()
  if (!session.account) redirect('/admin/login')
  return session.account
}

/** advertiser는 자기 store_id만 접근 가능. 아니면 null 반환 (전체 허용) */
export function getAllowedStoreId(account: AdminSessionData['account']): string | null {
  if (!account) return null
  if (account.role === 'advertiser') return account.storeId
  return null // super_admin, agency, staff → 전체 허용
}
