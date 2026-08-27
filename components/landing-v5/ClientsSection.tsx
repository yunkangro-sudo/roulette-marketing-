'use client'

import { useRef, useState } from 'react'
import { CLIENTS, CLIENT_CATEGORIES, type ClientCategory } from '@/lib/landing-v5/config'
import ClientLogoBox from './ClientLogoBox'

type FilterValue = ClientCategory | '전체'

export default function ClientsSection() {
  const [filter, setFilter] = useState<FilterValue>('전체')
  const scrollerRef = useRef<HTMLDivElement>(null)

  const filtered = filter === '전체' ? CLIENTS : CLIENTS.filter((c) => c.category === filter)

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' })
  }

  return (
    <section id="stories" className="scroll-mt-20 bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[13px] font-semibold tracking-wide text-dg-green-deep">도입 매장</p>
        <h2 className="mt-3 text-[32px] text-dg-ink md:text-[44px]">이미 단골팅과 함께하는 매장들</h2>

        {/* 업종 필터 — 가로 스와이프 가능한 태그 목록 */}
        <div className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
          {(['전체', ...CLIENT_CATEGORIES] as FilterValue[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`inline-flex min-h-[40px] shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dg-green ${
                filter === cat
                  ? 'border-dg-ink bg-dg-ink text-white'
                  : 'border-dg-line bg-white text-dg-ink-soft hover:border-dg-ink hover:text-dg-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 가로 스크롤 카드 — 터치 스와이프 네이티브 지원 + 데스크톱 화살표 */}
        <div className="relative mt-8">
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {filtered.map((client) => (
              <div
                key={client.name}
                className="flex w-[200px] shrink-0 snap-start flex-col items-center gap-4 border border-dg-line bg-dg-bg px-5 py-8 text-center"
                style={{ borderRadius: 6 }}
              >
                <ClientLogoBox client={client} />
                <div>
                  <p className="text-[15px] font-semibold text-dg-ink">{client.name}</p>
                  <p className="mt-1 text-[12px] text-dg-ink-soft">{client.category}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 hidden justify-end gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="이전 매장"
              className="flex h-11 w-11 items-center justify-center border border-dg-line bg-white text-dg-ink transition-colors hover:border-dg-ink"
              style={{ borderRadius: 4 }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="다음 매장"
              className="flex h-11 w-11 items-center justify-center border border-dg-line bg-white text-dg-ink transition-colors hover:border-dg-ink"
              style={{ borderRadius: 4 }}
            >
              ›
            </button>
          </div>
        </div>

        <p className="mt-6 text-[12px] text-dg-ink-soft">
          ※ 실제 로고 확보 전까지는 업체명 플레이스홀더로 표기합니다.
        </p>
      </div>
    </section>
  )
}
