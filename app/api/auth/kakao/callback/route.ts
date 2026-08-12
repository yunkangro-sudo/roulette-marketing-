/**
 * GET /api/auth/kakao/callback?code=xxx&state=storeId:xxx
 * 카카오 OAuth 콜백 처리
 *
 * 1. code → access_token 교환
 * 2. 사용자 프로필 조회 (전화번호 포함, 비즈앱 심사 후)
 * 3. 전화번호 암호화/해시 후 customer_loyalty에 저장
 * 4. 세션 쿠키 설정 → /play/[storeId]로 리다이렉트
 */

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getKakaoUserProfile } from '@/lib/auth/kakao'
import { getCustomerSession } from '@/lib/auth/session'
import { encryptPhone, hashPhone } from '@/lib/crypto/phoneEncryption'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state') ?? ''
  const error = searchParams.get('error')

  // 카카오에서 에러 반환 (사용자가 동의 거부 등)
  if (error || !code) {
    console.warn('[kakao callback] 카카오 에러 또는 code 없음:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`)
  }

  // state에서 storeId 파싱
  const storeId = state.startsWith('storeId:') ? state.slice('storeId:'.length) : ''

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/auth/kakao/callback`

  try {
    // ── 1. 토큰 교환 ──────────────────────────────────────────
    const accessToken = await exchangeCodeForToken(code, redirectUri)

    // ── 2. 사용자 프로필 조회 ──────────────────────────────────
    const profile = await getKakaoUserProfile(accessToken)

    // ── 3. 전화번호 저장 (암호화) ─────────────────────────────
    // 비즈앱 심사 전 phone_number는 null → 저장 스킵 (로그인은 정상 진행)
    if (profile.phone_number) {
      await savePhoneNumber(profile.id, storeId, profile.phone_number)
    }

    // ── 4. 세션 저장 ──────────────────────────────────────────
    const session = await getCustomerSession()
    session.user = {
      kakao_user_id: profile.id,
      nickname:      profile.nickname,
      storeId,
    }
    await session.save()

    // ── 5. 게임 페이지로 리다이렉트 ───────────────────────────
    const dest = storeId ? `${appUrl}/play/${storeId}` : `${appUrl}/`
    return NextResponse.redirect(dest)

  } catch (err) {
    console.error('[kakao callback] 처리 오류:', err)
    const dest = storeId ? `${appUrl}/play/${storeId}?auth_error=1` : `${appUrl}/`
    return NextResponse.redirect(dest)
  }
}

async function savePhoneNumber(kakaoUserId: string, storeId: string, rawPhone: string) {
  const phoneEncrypted = encryptPhone(rawPhone)
  const phoneHash      = hashPhone(rawPhone)

  // 암호화 키 미설정 시 전화번호 저장 스킵
  if (!phoneEncrypted || !phoneHash) {
    console.warn('[kakao callback] PHONE_ENCRYPTION_KEY/HASH_SALT 미설정 — 전화번호 저장 생략')
    return
  }

  const supabase = createServerClient()

  // customer_loyalty가 이미 있으면 phone 업데이트, 없으면 무시 (게임 플레이 시 생성됨)
  const { error } = await supabase
    .from('customer_loyalty')
    .update({ phone_encrypted: phoneEncrypted, phone_hash: phoneHash })
    .eq('kakao_user_id', kakaoUserId)
    .eq('store_id', storeId)
    .is('phone_hash', null)  // 이미 저장된 경우 덮어쓰지 않음

  if (error) {
    // 업데이트 실패해도 로그인은 중단하지 않음
    console.warn('[kakao callback] 전화번호 업데이트 실패 (무시):', error.message)
  }
}
