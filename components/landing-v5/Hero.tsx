'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { HERO_ROTATOR_WORDS } from '@/lib/landing-v5/config'

type Props = {
  onCta: () => void
}

/**
 * 모바일 우선: 헤드라인(로테이터)이 항상 이미지보다 먼저 오도록 DOM 순서를
 * text → image로 고정한다. 데스크톱에서만 그리드로 나란히 배치.
 * 모바일은 92vh로 첫 화면 임팩트를 주고, 데스크톱은 콘텐츠 높이에 맞춰
 * 상하 여백을 줄여 다음 섹션이 살짝 보이게 한다.
 */
export default function Hero({ onCta }: Props) {
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((i) => (i + 1) % HERO_ROTATOR_WORDS.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  return (
    <section
      id="top"
      className="relative flex min-h-[92vh] items-center overflow-hidden bg-dg-bg px-0 pt-16 lg:min-h-0"
    >
      {/* 진열장 조명 — 그린 → 골드 은은한 radial glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '45%',
          right: '8%',
          transform: 'translate(0, -50%)',
          width: 560,
          height: 560,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(0,199,167,0.20) 0%, rgba(217,169,79,0.14) 45%, transparent 72%)',
          filter: 'blur(56px)',
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-5 py-12 lg:grid-cols-2 lg:gap-12 lg:py-24">
        {/* 텍스트 — 항상 이미지보다 먼저, 좌측 정렬 통일 */}
        <div className="text-left">
          <h1
            className="text-[30px] font-extrabold leading-[1.35] tracking-tight text-dg-ink sm:text-[38px] md:text-[50px] lg:text-[56px]"
          >
            게임 한 판으로 완성되는
            <br />
            <RotatingWord index={wordIndex} />
          </h1>

          <p className="mt-6 max-w-[480px] text-[15px] leading-relaxed text-dg-ink-soft md:text-[17px]">
            단골팅은 게임, 보상, 쿠폰, 콘텐츠, 지역 마케팅을 결합해 고객의 재방문과
            단골화를 설계하는 리텐션 마케팅 서비스입니다.
          </p>

          <div className="mt-8 flex justify-start">
            <a
              href="#service"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-dg-ink px-8 py-3 text-[15px] font-semibold text-white transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dg-green active:translate-y-0"
            >
              궁금하면, 단골팅
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* 일러스트 — 빈 여백을 트리밍한 자산으로 꽉 차게, 항상 중앙 정렬 */}
        {/* 데스크톱만 상단 여백 추가(크레인 팔이 섹션 경계에 붙지 않게) — 모바일은 기존 그대로 유지 */}
        <div className="flex justify-center lg:justify-end lg:pt-8">
          <div
            className="animate-crane-settle-v5 relative mx-auto w-[92vw] max-w-[460px] sm:w-[78vw] lg:mx-0 lg:w-full lg:max-w-[560px]"
          >
            <Image
              src="/hero.png"
              alt="크레인 게임 손잡이에 붙잡힌 손님과 기뻐하는 단골팅 선물박스 마스코트"
              width={1672}
              height={941}
              priority
              className="hidden h-auto w-full md:block"
            />
            <Image
              src="/landing-v5/hero-mobile-trim.png"
              alt="크레인 게임 손잡이에 붙잡힌 손님과 기뻐하는 단골팅 선물박스 마스코트"
              width={945}
              height={911}
              priority
              className="mx-auto h-auto w-full md:hidden"
            />
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--bg))' }}
      />
    </section>
  )
}

function RotatingWord({ index }: { index: number }) {
  const word = HERO_ROTATOR_WORDS[index]
  return (
    <span
      className="relative inline-block text-dg-green"
      style={{ minWidth: '4.4em', textAlign: 'left' }}
    >
      <span key={word} className="hero-rotator-word inline-block">
        {word}.
      </span>
    </span>
  )
}
