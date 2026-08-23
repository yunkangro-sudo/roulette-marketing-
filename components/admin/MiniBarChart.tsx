'use client'

interface Bar {
  label: string
  value: number
}

interface Props {
  data: Bar[]
  color?: string
  height?: number
}

/** 의존성 없는 가벼운 SVG 가로 바차트 — 매장별 참여자 Top 10 등 순위형 지표에 사용 */
export default function MiniBarChart({ data, color = '#f97316', height = 28 }: Props) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center text-xs text-gray-400 py-8">데이터가 없습니다</div>
  }

  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="space-y-2.5">
      {data.map((bar, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-24 sm:w-28 truncate shrink-0">{bar.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full overflow-hidden" style={{ height }}>
            <div
              className="h-full rounded-full flex items-center justify-end px-2 transition-all"
              style={{ width: `${Math.max(4, (bar.value / max) * 100)}%`, backgroundColor: color }}
            >
              <span className="text-[11px] font-bold text-white">{bar.value.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
