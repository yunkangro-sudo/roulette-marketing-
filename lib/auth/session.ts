/**
 * 고객(손님) 세션 — admin 세션과 완전 분리
 * 쿠키명: dang_customer_session
 */

import { getIronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface PendingPlay {
  eventId:    string
  storeId:    string
  drawnAt:    string
  label:      string
  amount:     number
  tierId:     string
}

export interface RevealedPlay {
  storeId:        string
  label:          string
  amount:         number
  pointsAwarded:  number
  coupon?: {
    id: string
    shortCode?: string
    status: string
    issuedAt: string
    validUntil: string
  }
}

export interface CustomerSessionData {
  user?: {
    kakao_user_id: string
    nickname:      string
    storeId:       string
    accessToken?:  string
    hasTalkMsg?:   boolean
    hasFriends?:   boolean
  }
  /** 로그인 전 서버가 산출한 결과. 화면에는 절대 내려주지 않는다. */
  pendingPlay?: PendingPlay
  /** 로그인·하루1회 통과 후 공개용 */
  revealedPlay?: RevealedPlay
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
