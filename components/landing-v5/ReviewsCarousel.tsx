'use client'

import { useState } from 'react'
import { REVIEW_PLACEHOLDERS } from '@/lib/landing-v5/config'

export default function ReviewsCarousel() {
  const [index, setIndex] = useState(0)
  const total = REVIEW_PLACEHOLDERS.length

  function go(next: number) {
    setIndex((next + total) % total)
  }

  return (
    <section id="stories" className="scroll-mt-20 bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">도입 매장</p>
        <h2 className="mt-3 text-[32px] text-dg-ink md:text-[44px]">다시 온 손님의 이야기</h2>

        <div className="relative mt-10 overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {REVIEW_PLACEHOLDERS.map((item) => (
              <article key={item.id} className="w-full shrink-0 px-0 md:px-8">
                <div className="mx-auto max-w-2xl border border-dg-line bg-dg-bg px-6 py-10 text-center md:px-12" style={{ borderRadius: 6 }}>
                  <p className="text-dg-gold">★★★★★</p>
                  <p className="mt-5 text-[18px] leading-relaxed text-dg-ink md:text-[20px]">
                    {item.quote}
                  </p>
                  <p className="mt-6 text-[14px] font-semibold text-dg-ink-soft">{item.store}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="h-10 w-10 border border-dg-line bg-white text-dg-ink transition-colors hover:border-dg-ink"
            style={{ borderRadius: 4 }}
            aria-label="이전 후기"
          >
            ‹
          </button>
          <div className="flex gap-2">
            {REVIEW_PLACEHOLDERS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2.5 w-2.5 ${i === index ? 'bg-dg-green' : 'bg-dg-line'}`}
                style={{ borderRadius: 999 }}
                aria-label={`${i + 1}번째 후기`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="h-10 w-10 border border-dg-line bg-white text-dg-ink transition-colors hover:border-dg-ink"
            style={{ borderRadius: 4 }}
            aria-label="다음 후기"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  )
}
