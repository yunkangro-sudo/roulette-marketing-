'use client'

import { useState } from 'react'
import Link from 'next/link'
import '@/components/landing-v5/landing-v5.css'
import { AeoWaitlistModal } from '@/components/landing-v5/PricingModals'
import { PRICING, formatWon } from '@/lib/landing-v5/config'

/**
 * "AEO 홈페이지 제작" 자리표시 페이지 — 헤더 햄버거 메뉴에서 진입.
 * 아직 정식 콘텐츠는 없고, 요금제 섹션에 이미 있는 AEO 카드 문구 + 출시 알림 신청
 * 폼(AeoWaitlistModal, 기존 aeo_waitlist 연동)만 재사용해 최소한의 완결된 화면으로 구성.
 */
export default function AeoPlaceholderPage() {
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const aeo = PRICING.aeo

  return (
    <div className="landing-v5 flex min-h-screen flex-col">
      <header className="border-b border-dg-line px-5 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="font-han text-[20px] text-dg-ink">
            단골<span className="text-dg-green">팅</span>
          </Link>
          <Link href="/" className="text-[13px] font-semibold text-dg-ink-soft transition-colors hover:text-dg-ink">
            ← 홈으로
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-[440px] text-center">
          <span
            className="inline-block bg-dg-cream px-3 py-1 text-[12px] font-bold text-dg-gold-deep"
            style={{ borderRadius: 999 }}
          >
            {aeo.launchNote}
          </span>

          <h1 className="mt-5 font-han text-[32px] text-dg-ink">{aeo.name}</h1>
          <p className="mt-3 text-[16px] font-bold text-dg-ink-soft">{aeo.subheadline}</p>
          <p className="mt-3 text-[14px] leading-relaxed text-dg-ink-soft">{aeo.description}</p>

          <p className="mt-6 font-num text-[26px] font-bold text-dg-ink">
            {formatWon(aeo.price)} <span className="text-[14px] font-normal text-dg-ink-soft">(1회) · 출시 예정</span>
          </p>

          <button
            type="button"
            onClick={() => setWaitlistOpen(true)}
            className="mt-8 h-12 w-full bg-dg-ink text-[15px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ borderRadius: 6 }}
          >
            출시 알림 받기
          </button>

          <p className="mt-4 text-[12px] text-dg-ink-soft">
            아직 준비 중인 페이지예요. 자세한 내용은 곧 채워드릴게요.
          </p>
        </div>
      </main>

      {waitlistOpen && <AeoWaitlistModal onClose={() => setWaitlistOpen(false)} />}
    </div>
  )
}
