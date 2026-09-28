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

  // "오늘"처럼 날짜가 1개뿐이면 SVG path가 점(M x y) 하나만 생겨 선·영역이 안 보인다.
  // 같은 값을 좌·우 2점으로 펼쳐 가로 구간 전체에 수평선+영역이 그려지게 한다.
  const plotData = data.length === 1 ? [data[0], data[0]] : data

  const width = 100 // viewBox 기준 (반응형 %로 스케일)
  const max = Math.max(1, ...plotData.map((d) => d.value))
  const padTop = 10
  const padBottom = 18
  const chartH = 100 - padTop - padBottom
  const baselineY = padTop + chartH

  const stepX = plotData.length > 1 ? width / (plotData.length - 1) : 0
  const points = plotData.map((d, i) => {
    const x = i * stepX
    const y = padTop + chartH - (d.value / max) * chartH
    return { x, y, label: d.label, value: d.value }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`

  const showEveryNth = Math.max(1, Math.ceil(data.length / 6))

  return (
    <div style={{ height }} className="w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <path d={areaPath} fill={color} opacity={0.08} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
        {/* preserveAspectRatio="none"이 원을 가로로 늘려 타원처럼 보이므로 점 마커는 생략 */}
      </svg>
      <div className={`mt-1 px-0.5 ${data.length === 1 ? 'text-center' : 'flex justify-between'}`}>
        {data.length === 1 ? (
          <span className="text-[10px] text-gray-400">{data[0].label}</span>
        ) : (
          data.map((p, i) => (
            <span key={i} className={`text-[10px] text-gray-400 ${i % showEveryNth === 0 ? '' : 'invisible'}`}>
              {p.label}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
