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
  if (!process.env.KAKAO_REST_API_KEY) {
    return NextResponse.json(
      { error: 'KAKAO_REST_API_KEY가 설정되지 않았습니다. Mock 로그인을 사용해주세요.' },
      { status: 503 },
    )
  }

  // NEXT_PUBLIC_APP_URL(고정 환경변수) 대신 실제 접속한 요청의 origin을 그대로 쓴다.
  // 커스텀 도메인을 새로 연결해도(예: roulette-marketing.vercel.app → dgting.co.kr)
  // 환경변수를 갱신하지 않으면 로그인 후 옛 도메인으로 강제로 돌아가는 문제가 있었다.
  // 요청 origin 기준으로 만들면 손님이 어느 도메인으로 들어왔든 그 도메인에 그대로 머문다.
  // ⚠️ 이 URL(정확히는 {origin}/api/auth/kakao/callback)이 카카오 디벨로퍼스 콘솔의
  // "Redirect URI" 목록에 등록되어 있어야 한다 — 새 도메인을 쓰려면 그쪽에도 추가 필요.
  const appUrl      = req.nextUrl.origin
  const redirectUri = `${appUrl}/api/auth/kakao/callback`

  // state: "storeId:[매장ID]" 또는 "storeId:[매장ID]|next:checkout"
  const state = next ? `storeId:${storeId}|next:${next}` : `storeId:${storeId}`

  try {
    const authUrl = getKakaoAuthUrl({
      redirectUri,
      state,
      requestPhone:   true,  // 비즈앱 심사 전에는 null (무시 처리)
      requestTalkMsg: true,  // 나에게 보내기 — 별도 심사 불필요
      requestFriends: false, // FRIEND API 심사 반려. 미승인 scope 요청 시 KOE205 위험
    })
    return NextResponse.redirect(authUrl)
  } catch (err) {
    console.error('[kakao auth] URL 생성 오류:', err)
    return NextResponse.json({ error: '카카오 로그인을 시작할 수 없습니다' }, { status: 500 })
  }
}
