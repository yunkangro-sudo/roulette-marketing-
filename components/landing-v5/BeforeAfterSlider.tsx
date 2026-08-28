'use client'

import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'

const BEFORE_STEPS = ['광고 노출', '클릭', '매장 방문', '끝']
const AFTER_STEPS = ['광고 노출', '게임 참여', '혜택', '단골 인증', '쿠폰 사용', '재방문']

export default function BeforeAfterSlider() {
  const [value, setValue] = useState(50)

  return (
    <div className="mt-12">
      <div
        className="relative overflow-hidden border border-dg-line bg-white"
        style={{ borderRadius: 6, minHeight: 440 }}
      >
        <FlowPanel title="기존 광고" tone="muted" steps={BEFORE_STEPS} />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        >
          <FlowPanel title="단골팅" tone="green" steps={AFTER_STEPS} />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-1 bg-dg-ink"
          style={{ left: `${value}%` }}
        >
          <div
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-dg-green text-dg-ink shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
          >
            <ArrowLeftRight size={22} strokeWidth={2.5} />
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
      <p className="mt-4 text-center text-[15px] font-semibold text-dg-ink">
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
    <div
      className={`flex h-full min-h-[440px] flex-col p-6 md:p-8 ${isGreen ? 'items-start' : 'items-end'}`}
      style={{ backgroundColor: isGreen ? '#00C7A7' : '#F2EFE6' }}
    >
      <span
        className={`inline-flex w-fit items-center px-3 py-1.5 text-[15px] font-extrabold ${
          isGreen ? 'bg-dg-ink text-white' : 'bg-white text-dg-ink'
        }`}
        style={{ borderRadius: 999 }}
      >
        {title}
      </span>
      <div className="mt-8 flex flex-1 flex-wrap items-center gap-2.5">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2.5">
            <span
              className={`border px-3.5 py-2.5 text-[14px] font-bold ${
                isGreen ? 'border-transparent bg-white text-dg-ink' : 'border-dg-line bg-white text-dg-ink-soft'
              }`}
              style={{ borderRadius: 4 }}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <span className={isGreen ? 'text-dg-ink' : 'text-dg-ink-soft'}>→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
