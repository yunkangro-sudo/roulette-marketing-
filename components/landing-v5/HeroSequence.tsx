'use client'

import { HERO_SLIDES, NAV_HEIGHT_PX, type HeroSlide } from '@/lib/landing-v5/config'

type Props = {
  onCta: () => void
}

export default function HeroSequence({ onCta }: Props) {
  return (
    <div id="top">
      {HERO_SLIDES.map((slide) => (
        <HeroSlideFrame key={slide.id} slide={slide} onCta={onCta} />
      ))}
    </div>
  )
}

function HeroSlideFrame({ slide, onCta }: { slide: HeroSlide; onCta: () => void }) {
  const visibleRatio = 1 - slide.cropTopRatio
  const visibleHeight = slide.height * visibleRatio
  const shift = slide.cropTopRatio === 0 ? 0 : -(slide.cropTopRatio / visibleRatio) * 100

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden px-0"
      style={{
        minHeight: '100dvh',
        paddingTop: NAV_HEIGHT_PX,
        background: slide.bg,
      }}
    >
      <div
        className="relative max-h-full w-full"
        style={{
          maxHeight: `calc(100dvh - ${NAV_HEIGHT_PX}px)`,
          aspectRatio: `${slide.width} / ${visibleHeight}`,
          width: `min(100%, calc((100dvh - ${NAV_HEIGHT_PX}px) * ${slide.width} / ${visibleHeight}))`,
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.src}
            alt={slide.alt}
            className="absolute left-0 w-full max-w-none select-none"
            style={{
              top: `${shift}%`,
              height: `${100 / visibleRatio}%`,
              objectFit: 'fill',
            }}
            draggable={false}
          />
        </div>

        <button
          type="button"
          onClick={onCta}
          aria-label={slide.cta.label}
          className="absolute z-10 cursor-pointer bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dg-green"
          style={{
            left: slide.cta.left,
            top: slide.cta.top,
            width: slide.cta.width,
            height: slide.cta.height,
            borderRadius: 999,
          }}
        />
      </div>
    </section>
  )
}
