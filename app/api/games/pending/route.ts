/**
 * GET /api/games/pending?store_id=xxx
 * 잠금 여부만 알려 준다. 당첨 금액은 절대 포함하지 않는다.
 *
 * store_id를 반드시 넘겨서 "지금 보고 있는 매장"과 세션에 남아있는
 * pendingPlay/revealedPlay의 storeId가 일치하는지 확인한다.
 * 세션은 브라우저(쿠키) 단위로 공유되므로, 손님이 여러 매장 링크를 넘나들며
 * 로그인을 완료하지 않은 채 다른 매장 게임을 이어서 진행하면 마지막에 저장된
 * pendingPlay가 이전 매장 것으로 덮어써질 수 있다 — 이때 store_id가 다르면
 * "이 매장에는 대기 중인 결과 없음"으로 처리해 엉뚱한 매장으로 쿠폰이 발급되는 것을 막는다.
 */
import { NextResponse } from 'next/server'
import { getCustomerSession } from '@/lib/auth/session'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('store_id')
  const session = await getCustomerSession()

  const pendingMatches = !!session.pendingPlay && (!storeId || session.pendingPlay.storeId === storeId)
  const revealedMatches = !!session.revealedPlay && (!storeId || session.revealedPlay.storeId === storeId)

  return NextResponse.json({
    hasPending: pendingMatches,
    hasRevealed: revealedMatches,
    revealed: revealedMatches ? session.revealedPlay : null,
    loggedIn: !!session.user,
  })
}
