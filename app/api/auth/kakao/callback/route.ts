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
import { logActivity } from '@/lib/activity/log'

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

  // state에서 storeId / next 파싱
  let storeId = ''
  let nextPage = ''
  if (state.startsWith('storeId:')) {
    const rest = state.slice('storeId:'.length)
    const idx = rest.indexOf('|next:')
    if (idx >= 0) {
      storeId = rest.slice(0, idx)
      nextPage = rest.slice(idx + '|next:'.length)
    } else {
      storeId = rest
    }
  }

  const appUrl      = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').trim()
  const redirectUri = `${appUrl}/api/auth/kakao/callback`

  try {
    // ── 1. 토큰 교환 ──────────────────────────────────────────
    const { access_token: accessToken, scope } = await exchangeCodeForToken(code, redirectUri)

    // 동의된 scope 파싱 (예: "profile_nickname talk_message friends phone_number")
    const grantedScopes = scope?.split(' ') ?? []
    const hasTalkMsg = grantedScopes.includes('talk_message')
    const hasFriends = grantedScopes.includes('friends')

    // ── 2. 사용자 프로필 조회 ──────────────────────────────────
    const profile = await getKakaoUserProfile(accessToken)

    // ── 3. 전화번호 저장 (암호화) ─────────────────────────────
    if (profile.phone_number) {
      await savePhoneNumber(profile.id, storeId, profile.phone_number)
    }

    // ── 3-1. 로그인 이력 기록 (회원 관리 화면의 "카카오 로그인" 집계용) ──
    if (storeId) {
      trackKakaoLogin(profile.id, storeId).catch(() => {})
    }

    // ── 4. 세션 저장 ──────────────────────────────────────────
    const session = await getCustomerSession()
    session.user = {
      kakao_user_id: profile.id,
      nickname:      profile.nickname,
      storeId,
      accessToken,         // 나에게 보내기/friends API용 (단기 보관)
      hasTalkMsg,
      hasFriends,
    }
    await session.save()

    // ── 5. 게임 페이지로 리다이렉트 ───────────────────────────
    const dest = storeId
      ? (nextPage === 'checkout'
        ? `${appUrl}/checkout/${storeId}`
        : nextPage === 'points'
          ? `${appUrl}/me/points?store_id=${encodeURIComponent(storeId)}`
          : nextPage === 'claim'
            ? `${appUrl}/play/${storeId}?claim=1`
            : `${appUrl}/play/${storeId}`)
      : `${appUrl}/`
    return NextResponse.redirect(dest)

  } catch (err) {
    console.error('[kakao callback] 처리 오류:', err)
    const dest = storeId ? `${appUrl}/play/${storeId}?auth_error=1` : `${appUrl}/`
    return NextResponse.redirect(dest)
  }
}

/**
 * 카카오 로그인 성공 시마다 activity_log에 kakao_login 기록을 남기고,
 * customer_loyalty.kakao_first_login_at을 "최초 로그인 시점에만" 채운다.
 * 아직 한 번도 게임을 플레이하지 않은 손님(row 없음)이어도, 로그인 자체는
 * "가입" 이벤트이므로 빈 row를 미리 만들어 first_seen_at/kakao_first_login_at을 기록한다
 * (이후 실제 플레이 시 upsert_customer_loyalty가 visit_count만 이어서 증가시킴).
 */
async function trackKakaoLogin(kakaoUserId: string, storeId: string) {
  const supabase = createServerClient()
  const now = new Date().toISOString()

  logActivity({ storeId, kakaoUserId, eventType: 'kakao_login' }).catch(() => {})

  const { data: existing } = await supabase
    .from('customer_loyalty')
    .select('kakao_first_login_at')
    .eq('store_id', storeId)
    .eq('kakao_user_id', kakaoUserId)
    .maybeSingle()

  if (!existing) {
    await supabase.from('customer_loyalty').insert({
      store_id: storeId,
      kakao_user_id: kakaoUserId,
      first_seen_at: now,
      kakao_first_login_at: now,
    })
  } else if (!existing.kakao_first_login_at) {
    await supabase
      .from('customer_loyalty')
      .update({ kakao_first_login_at: now })
      .eq('store_id', storeId)
      .eq('kakao_user_id', kakaoUserId)
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
