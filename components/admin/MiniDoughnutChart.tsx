'use client'

interface Slice {
  label: string
  value: number
  color: string
}

interface Props {
  data: Slice[]
  size?: number
}

/** 의존성 없는 가벼운 SVG 도넛차트 — 경품 티어별 당첨 분포 등에 사용 */
export default function MiniDoughnutChart({ data, size = 140 }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-400" style={{ width: size, height: size }}>
        데이터 없음
      </div>
    )
  }

  const radius = 40
  const circumference = 2 * Math.PI * radius
  let offsetAcc = 0

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#F3F4F6" strokeWidth={16} />
        {data.map((slice, i) => {
          const pct = slice.value / total
          const dash = pct * circumference
          const gap = circumference - dash
          const el = (
            <circle
              key={i}
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={16}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offsetAcc}
            />
          )
          offsetAcc += dash
          return el
        })}
      </svg>
      <div className="space-y-1.5 min-w-0">
        {data.map((slice, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
            <span className="text-gray-600 truncate max-w-[100px]">{slice.label}</span>
            <span className="text-gray-400 shrink-0">{Math.round((slice.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
