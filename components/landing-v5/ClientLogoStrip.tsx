'use client'

import { useRef } from 'react'
import { CLIENTS } from '@/lib/landing-v5/config'
import ClientLogoBox from './ClientLogoBox'

/**
 * 히어로 바로 아래 — 신뢰 신호를 주는 로고 마퀴(무한 가로 스크롤).
 * 트랙에 CLIENTS를 2세트 이어붙이고 0%→-50% translateX 애니메이션으로
 * 끊김 없이 순환시킨다(reduced-motion에서는 정적 스크롤 목록으로 대체).
 */
export default function ClientLogoStrip() {
  const trackRef = useRef<HTMLDivElement>(null)

  const pause = () => {
    if (trackRef.current) trackRef.current.style.animationPlayState = 'paused'
  }
  const resume = () => {
    if (trackRef.current) trackRef.current.style.animationPlayState = 'running'
  }

  return (
    <div className="border-y border-dg-line bg-white/60 pb-[51px] pt-8">
      <div className="mx-auto max-w-6xl px-5">
        {/* 캡션 라벨 — 인용구처럼 격리된, 절제된 톤 */}
        <div className="mb-[19px] flex items-center justify-center gap-4">
          <span aria-hidden className="h-px w-8 bg-dg-line" />
          <p className="whitespace-nowrap text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-dg-green-deep/70">
            이미 단골팅과 함께하고 있어요
          </p>
          <span aria-hidden className="h-px w-8 bg-dg-line" />
        </div>
      </div>

      <div
        className="marquee-mask relative overflow-hidden"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
      >
        <div ref={trackRef} className="marquee-track flex w-max items-center">
          {[0, 1].map((setIdx) => (
            <div
              key={setIdx}
              aria-hidden={setIdx === 1}
              data-dup={setIdx === 1 ? 'true' : undefined}
              className="marquee-set flex items-center gap-20 pr-20"
            >
              {CLIENTS.map((client, i) => (
                <div key={`${setIdx}-${client.name}-${i}`} className="shrink-0">
                  <ClientLogoBox client={client} size="strip" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
