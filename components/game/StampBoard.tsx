/**
 * 스탬프 적립 진행 상황 시각화 — 원형 + 체크마크, 브랜드 민트(#00C7A7).
 * 칸 개수는 goal 값에 맞춰 동적으로 렌더링한다 (매장마다 목표 횟수가 다를 수 있음).
 */
interface Props {
  current: number
  goal: number
  className?: string
}

export default function StampBoard({ current, goal, className = '' }: Props) {
  const safeGoal = Math.max(1, goal)
  const safeCurrent = Math.min(Math.max(0, current), safeGoal)
  const cells = Array.from({ length: safeGoal }, (_, i) => i < safeCurrent)

  return (
    <div className={className}>
      <div className="flex flex-wrap justify-center gap-2.5">
        {cells.map((filled, i) => (
          <div
            key={i}
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-base font-bold transition-colors ${
              filled
                ? 'border-[#00C7A7] bg-[#00C7A7] text-white'
                : 'border-[#222222]/15 bg-white text-[#222222]/20'
            }`}
          >
            {filled ? '✓' : i + 1}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-[#222222]/60">
        스탬프 {safeCurrent} / {safeGoal}
      </p>
    </div>
  )
}
