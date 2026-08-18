'use client'

import { useState } from 'react'
import { FAQ_ITEMS } from '@/lib/landing-v5/config'

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">궁금한 점</p>
        <h2 className="mt-3 text-[32px] text-dg-ink md:text-[44px]">자주 묻는 질문</h2>

        <div className="mt-10 divide-y divide-dg-line border-y border-dg-line">
          {FAQ_ITEMS.map((item, i) => {
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
      </div>
    </section>
  )
}
