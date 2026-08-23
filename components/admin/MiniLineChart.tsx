'use client'

interface Point {
  label: string
  value: number
}

interface Props {
  data: Point[]
  color?: string
  height?: number
}

/** 의존성 없는 가벼운 SVG 라인차트 — 일별 참여자/신규가입 추이 등에 사용 */
export default function MiniLineChart({ data, color = '#f97316', height = 160 }: Props) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center text-xs text-gray-400" style={{ height }}>데이터가 없습니다</div>
  }

  const width = 100 // viewBox 기준 (반응형 %로 스케일)
  const max = Math.max(1, ...data.map((d) => d.value))
  const padTop = 10
  const padBottom = 18
  const chartH = 100 - padTop - padBottom

  const stepX = data.length > 1 ? width / (data.length - 1) : 0
  const points = data.map((d, i) => {
    const x = data.length > 1 ? i * stepX : width / 2
    const y = padTop + chartH - (d.value / max) * chartH
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`

  const showEveryNth = Math.max(1, Math.ceil(data.length / 6))

  return (
    <div style={{ height }} className="w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <path d={areaPath} fill={color} opacity={0.08} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1.4} fill={color} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-0.5">
        {points.map((p, i) => (
          <span key={i} className={`text-[10px] text-gray-400 ${i % showEveryNth === 0 ? '' : 'invisible'}`}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}
