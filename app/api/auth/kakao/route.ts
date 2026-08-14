/**
 * GET /api/auth/kakao?storeId=xxx
 * 카카오 OAuth 인증 페이지로 리다이렉트
 *
 * state 파라미터에 storeId를 인코딩해서 콜백 후 복원
 */

import { NextRequest, NextResponse } from 'next/server'
import { getKakaoAuthUrl } from '@/lib/auth/kakao'

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('storeId') ?? ''
  const next    = req.nextUrl.searchParams.get('next') ?? ''

  // 카카오 키 미설정 시 → 개발 환경 폴백 안내
  if (!process.env.NEXT_PUBLIC_KAKAO_JS_KEY) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았습니다. Mock 로그인을 사용해주세요.' },
      { status: 503 },
    )
  }

  // .trim()으로 Vercel 환경변수 복사 시 들어올 수 있는 공백/개행 제거
  const appUrl      = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').trim()
  const redirectUri = `${appUrl}/api/auth/kakao/callback`

  // state: "storeId:[매장ID]" 또는 "storeId:[매장ID]|next:checkout"
  const state = next ? `storeId:${storeId}|next:${next}` : `storeId:${storeId}`

  try {
    const authUrl = getKakaoAuthUrl({
      redirectUri,
      state,
      requestPhone:   true,  // 비즈앱 심사 전에는 null (무시 처리)
      requestTalkMsg: true,  // MESSAGE API 심사용 — 미승인 시 동의항목 누락으로 내려옴
      requestFriends: true,  // FRIEND API 심사용 — 미승인 시 동의항목 누락으로 내려옴
    })
    return NextResponse.redirect(authUrl)
  } catch (err) {
    console.error('[kakao auth] URL 생성 오류:', err)
    return NextResponse.json({ error: '카카오 로그인을 시작할 수 없습니다' }, { status: 500 })
  }
}
