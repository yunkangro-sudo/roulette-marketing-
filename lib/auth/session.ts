/**
 * 고객(손님) 세션 — admin 세션과 완전 분리
 * 쿠키명: dang_customer_session
 */

import { getIronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface CustomerSessionData {
  user?: {
    kakao_user_id: string
    nickname: string
    storeId: string   // 어느 매장 QR로 접근했는지 (게임 컨텍스트)
  }
}

export const customerSessionOptions: SessionOptions = {
  password: process.env.AUTH_SECRET!,
  cookieName: 'dang_customer_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30일 (손님은 자주 재방문)
  },
}

export async function getCustomerSession() {
  return getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)
}
