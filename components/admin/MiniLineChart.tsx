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

/**
 * 의존성 없는 가벼운 SVG 라인차트 — 일별 참여자/신규가입 추이 등에 사용.
 *
 * 선 모양만으로는 "몇 명인지" 알 수 없다는 피드백(2026-09-28)으로, 값 숫자를 항상
 * 화면에 같이 보여주도록 재설계했다. SVG는 preserveAspectRatio="none"으로 가로가
 * 늘어나 있어서 <text>를 SVG 좌표에 그리면 글자가 옆으로 퍼져 보인다 — 그래서 숫자
 * 라벨은 SVG가 아니라 그 위에 겹치는 일반 HTML(absolute % 위치)로 그린다.
 */
export default function MiniLineChart({ data, color = '#f97316', height = 160 }: Props) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center text-xs text-gray-400" style={{ height }}>데이터가 없습니다</div>
  }

  // 날짜가 1개뿐(예: "오늘")이면 추이선 자체가 의미가 없다 — 선을 억지로 그리는 대신
  // 큰 숫자로 값을 바로 보여주는 카드 형태로 대체한다.
  if (data.length === 1) {
    return (
      <div style={{ height }} className="flex flex-col items-center justify-center">
        <p className="text-4xl font-black leading-none" style={{ color }}>
          {data[0].value.toLocaleString()}
        </p>
        <p className="mt-2 text-xs text-gray-400">{data[0].label}</p>
      </div>
    )
  }

  const width = 100 // viewBox 기준 (반응형 %로 스케일)
  const max = Math.max(1, ...data.map((d) => d.value))
  const padTop = 22 // 점 위 숫자 라벨이 들어갈 여유 공간
  const padBottom = 18
  const chartH = 100 - padTop - padBottom

  const stepX = width / (data.length - 1)
  const points = data.map((d, i) => ({
    x: i * stepX,
    y: padTop + chartH - (d.value / max) * chartH,
    label: d.label,
    value: d.value,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const baselineY = padTop + chartH
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`

  // 점이 많을 때 숫자·날짜 라벨을 전부 찍으면 겹치므로 일부만 노출한다.
  // 다만 "가장 최근 날짜"와 "최댓값 지점"은 데이터를 파악하는 데 가장 중요해서 항상 보여준다.
  const showEveryNth = Math.max(1, Math.ceil(data.length / 6))
  const maxIndex = points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0)
  const lastIndex = points.length - 1
  const shouldLabel = (i: number) =>
    data.length <= 10 || i % showEveryNth === 0 || i === lastIndex || i === maxIndex

  return (
    <div style={{ height }} className="relative w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <path d={areaPath} fill={color} opacity={0.08} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
      </svg>

      {/* 값 숫자 + 점 마커 — % 절대위치라 SVG의 가로 늘림에 영향받지 않는다 */}
      {points.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <span
            className="block h-1.5 w-1.5 rounded-full ring-2 ring-white"
            style={{ backgroundColor: color }}
          />
          {shouldLabel(i) && (
            <span
              className="absolute left-1/2 bottom-[calc(100%+2px)] -translate-x-1/2 whitespace-nowrap text-[10px] font-bold leading-none"
              style={{ color }}
            >
              {p.value.toLocaleString()}
            </span>
          )}
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 flex justify-between px-0.5">
        {points.map((p, i) => (
          <span key={i} className={`text-[10px] text-gray-400 ${shouldLabel(i) ? '' : 'invisible'}`}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}
