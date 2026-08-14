/**
 * GET /api/games/pending
 * 잠금 여부만 알려 준다. 당첨 금액은 절대 포함하지 않는다.
 */
import { NextResponse } from 'next/server'
import { getCustomerSession } from '@/lib/auth/session'

export async function GET() {
  const session = await getCustomerSession()
  return NextResponse.json({
    hasPending: !!session.pendingPlay,
    hasRevealed: !!session.revealedPlay,
    revealed: session.revealedPlay ?? null,
    loggedIn: !!session.user,
  })
}
