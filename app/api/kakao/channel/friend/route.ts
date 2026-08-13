/**
 * POST /api/kakao/channel/friend
 * 카카오 채널 친구추가 완료 콜백 (stub)
 *
 * 현재 상태: 실제 카카오 채널 API 연동 없이 동의 등록 로직만 구현
 *
 * 실제 연동 시 필요한 것:
 * - 카카오 채널 Webhook에서 이 엔드포인트를 POST 타겟으로 등록
 * - 카카오에서 전달하는 payload 구조에 맞게 파싱 수정
 *   (ref: https://developers.kakao.com/docs/latest/ko/kakaotalk-channel/common)
 * - 카카오 Webhook 서명 검증 추가 (KAKAO_CHANNEL_SECRET)
 *
 * 현재는 테스트/수동 동의 등록용으로 사용
 * body: { store_id, kakao_user_id, event: "friend" | "block" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { grantConsent, revokeConsent } from '@/lib/alimtalk/send'

export async function POST(req: NextRequest) {
  let body: { store_id?: string; kakao_user_id?: string; event?: string } = {}

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON 파싱 오류' }, { status: 400 })
  }

  const { store_id, kakao_user_id, event } = body

  if (!store_id || !kakao_user_id) {
    return NextResponse.json(
      { error: 'store_id와 kakao_user_id가 필요합니다' },
      { status: 400 },
    )
  }

  try {
    if (event === 'block') {
      // 채널 차단 → 동의 철회
      await revokeConsent(store_id, kakao_user_id)
      console.log(`[channel/friend] 동의 철회: ${kakao_user_id}@${store_id}`)
      return NextResponse.json({ ok: true, action: 'revoked' })
    } else {
      // 친구추가 (기본) → 동의 등록
      await grantConsent(store_id, kakao_user_id)
      console.log(`[channel/friend] 동의 등록: ${kakao_user_id}@${store_id}`)
      return NextResponse.json({ ok: true, action: 'granted' })
    }
  } catch (err) {
    console.error('[channel/friend] 처리 오류:', err)
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다' }, { status: 500 })
  }
}
