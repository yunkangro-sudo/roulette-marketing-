'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FAQ_ITEMS } from '@/lib/landing-v5/config'

const VISIBLE_COUNT = 5

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)
  const [expanded, setExpanded] = useState(false)

  const items = expanded ? FAQ_ITEMS : FAQ_ITEMS.slice(0, VISIBLE_COUNT)
  const hiddenCount = FAQ_ITEMS.length - VISIBLE_COUNT

  return (
    <section id="faq" className="scroll-mt-20 bg-white py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">궁금한 점</p>
        <h2 className="mt-3 text-[32px] text-dg-ink md:text-[44px]">자주 묻는 질문</h2>

        <div className="mt-10 divide-y divide-dg-line border-y border-dg-line">
          {items.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-[16px] font-semibold text-dg-ink md:text-[18px]">{item.q}</span>
                  <span className="font-num text-dg-ink-soft">{isOpen ? '−' : '+'}</span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <p className="overflow-hidden text-[14px] leading-relaxed text-dg-ink-soft">
                    <span className="block pb-5">{item.a}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {!expanded && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mx-auto mt-8 flex items-center gap-1.5 border border-dg-line px-6 py-3 text-[14px] font-semibold text-dg-ink transition-colors hover:border-dg-ink"
            style={{ borderRadius: 6 }}
          >
            질문 {hiddenCount}개 더보기
            <ChevronDown size={16} />
          </button>
        )}
      </div>
    </section>
  )
}
