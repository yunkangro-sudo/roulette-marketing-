/**
 * POST /api/games/claim
 * body: { store_id?: string }
 * 로그인된 kakao_user_id 앞으로 pendingPlay를 확정한다.
 * 참여 가능 여부(도전횟수 설정에 따른 daily/weekly/monthly/unlimited)는
 * persistPendingPlay 내부에서 검사한다. 이미 참여면 결과를 공개하지 않는다.
 *
 * store_id가 함께 전달되면, 세션에 남아있는 pendingPlay/revealedPlay의 storeId와
 * 일치하는지 검증한다. 세션(쿠키)은 브라우저 단위로 공유되므로, 손님이 A매장 게임을
 * 하고 로그인을 완료하지 않은 채 B매장 게임까지 진행하면 세션의 pendingPlay가
 * B매장 것으로 덮어써진다 — 이 상태에서 A매장 페이지로 돌아와 로그인을 마치면
 * storeId가 달라 여기서 걸러지고, 엉뚱한 매장으로 쿠폰이 발급되는 사고를 막는다.
 */
import { NextResponse } from 'next/server'
import { getCustomerSession } from '@/lib/auth/session'
import { AlreadyParticipatedError, persistPendingPlay } from '@/lib/game/persistPlayResult'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const expectedStoreId = typeof body?.store_id === 'string' ? body.store_id : undefined

  const session = await getCustomerSession()
  const kakaoUserId = session.user?.kakao_user_id
  const pending = session.pendingPlay

  if (!kakaoUserId) {
    return NextResponse.json({ error: '로그인이 필요합니다', needLogin: true }, { status: 401 })
  }

  if (pending && expectedStoreId && pending.storeId !== expectedStoreId) {
    return NextResponse.json({ error: '확인할 게임 결과가 없습니다', storeMismatch: true }, { status: 404 })
  }

  if (!pending) {
    if (session.revealedPlay && (!expectedStoreId || session.revealedPlay.storeId === expectedStoreId)) {
      return NextResponse.json({ alreadyRevealed: true, result: session.revealedPlay })
    }
    return NextResponse.json({ error: '확인할 게임 결과가 없습니다' }, { status: 404 })
  }

  try {
    const revealed = await persistPendingPlay({ pending, kakaoUserId })
    session.pendingPlay = undefined
    session.revealedPlay = revealed
    await session.save()
    return NextResponse.json({ alreadyParticipated: false, result: revealed })
  } catch (err) {
    if (err instanceof AlreadyParticipatedError) {
      session.pendingPlay = undefined
      session.revealedPlay = undefined
      await session.save()
      return NextResponse.json({ alreadyParticipated: true, nextAvailableAt: err.nextAvailableAt })
    }
    console.error('[api/games/claim] 확정 실패:', err)
    return NextResponse.json({ error: '결과 확정에 실패했습니다' }, { status: 500 })
  }
}
