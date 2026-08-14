/**
 * POST /api/games/claim
 * 로그인된 kakao_user_id 앞으로 pendingPlay를 확정한다.
 * 하루 1회 제한은 이 시점에만 검사한다. 이미 참여면 결과를 공개하지 않는다.
 */
import { NextResponse } from 'next/server'
import { getCustomerSession } from '@/lib/auth/session'
import { AlreadyParticipatedError, hasPlayedToday, persistPendingPlay } from '@/lib/game/persistPlayResult'

export async function POST() {
  const session = await getCustomerSession()
  const kakaoUserId = session.user?.kakao_user_id
  const pending = session.pendingPlay

  if (!kakaoUserId) {
    return NextResponse.json({ error: '로그인이 필요합니다', needLogin: true }, { status: 401 })
  }

  if (!pending) {
    if (session.revealedPlay) {
      return NextResponse.json({ alreadyRevealed: true, result: session.revealedPlay })
    }
    return NextResponse.json({ error: '확인할 게임 결과가 없습니다' }, { status: 404 })
  }

  const already = await hasPlayedToday(pending.storeId, kakaoUserId)
  if (already) {
    session.pendingPlay = undefined
    session.revealedPlay = undefined
    await session.save()
    return NextResponse.json({ alreadyParticipated: true })
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
      return NextResponse.json({ alreadyParticipated: true })
    }
    console.error('[api/games/claim] 확정 실패:', err)
    return NextResponse.json({ error: '결과 확정에 실패했습니다' }, { status: 500 })
  }
}
