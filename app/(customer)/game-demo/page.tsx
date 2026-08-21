import GameContainer from '@/components/game/claw_machine/GameContainer'

export const metadata = {
  title: '당근 인형뽑기 — 게임 데모',
}

interface Props {
  searchParams: Promise<{ locked?: string }>
}

/**
 * 게임 화면(2)만 독립적으로 확인하는 데모 페이지. DB/로그인 게이트 없이 항상 결과를 바로 보여준다.
 * 화면 3(결과 잠금)까지 이어지는 흐름을 보고 싶으면 `?locked=1`을 붙인다.
 * 실제 손님 여정(화면 3 포함)은 `/play/[storeId]` 참고.
 */
export default async function GameDemoPage({ searchParams }: Props) {
  const { locked } = await searchParams
  return <GameContainer forceLocked={locked === '1'} initialPhase="play" />
}
