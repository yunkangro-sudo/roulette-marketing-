'use client'

import { useState } from 'react'

const BEFORE_STEPS = ['광고 노출', '클릭', '매장 방문', '끝']
const AFTER_STEPS = ['광고 노출', '게임 참여', '혜택', '단골 인증', '쿠폰 사용', '재방문']

export default function BeforeAfterSlider() {
  const [value, setValue] = useState(52)

  return (
    <div className="mt-12">
      <div className="relative overflow-hidden border border-dg-line bg-white" style={{ borderRadius: 6, minHeight: 280 }}>
        <FlowPanel
          title="기존 광고"
          tone="muted"
          steps={BEFORE_STEPS}
        />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        >
          <FlowPanel
            title="단골팅"
            tone="green"
            steps={AFTER_STEPS}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-dg-ink"
          style={{ left: `${value}%` }}
        >
          <div
            className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-dg-ink bg-white text-dg-ink"
            style={{ borderRadius: 4 }}
          >
            <span className="text-[13px] font-bold">↔</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="absolute inset-0 z-20 cursor-ew-resize opacity-0"
          aria-label="기존 광고와 단골팅 흐름 비교"
        />
      </div>
      <p className="mt-3 text-center text-[13px] text-dg-ink-soft">
        ← 드래그해서 두 흐름을 비교해보세요 →
      </p>
    </div>
  )
}

function FlowPanel({
  title,
  tone,
  steps,
}: {
  title: string
  tone: 'muted' | 'green'
  steps: string[]
}) {
  const isGreen = tone === 'green'
  return (
    <div className={`flex h-full min-h-[280px] flex-col p-6 md:p-8 ${isGreen ? 'bg-dg-green-tint' : 'bg-[#F4F1EA]'}`}>
      <p className={`text-[13px] font-semibold ${isGreen ? 'text-dg-green-deep' : 'text-dg-ink-soft'}`}>
        {title}
      </p>
      <div className="mt-6 flex flex-1 flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <span
              className={`border px-3 py-2 text-[13px] font-semibold ${
                isGreen
                  ? 'border-dg-green/40 bg-white text-dg-ink'
                  : 'border-dg-line bg-white text-dg-ink-soft'
              }`}
              style={{ borderRadius: 4 }}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <span className={isGreen ? 'text-dg-green-deep' : 'text-dg-ink-soft'}>→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
