'use client'

import '@/components/landing-v5/landing-v5.css'
import Navbar from '@/components/landing-v5/Navbar'
import BottomBar from '@/components/landing-v5/BottomBar'
import { Footer, PricingSection } from '@/components/landing-v5/Sections'

/** 햄버거 「요금제 계산」에서 열리는 전용 페이지.
 *  랜딩에서 분리한 PricingSection을 그대로 옮겼고, 계산기 팝업은
 *  페이지 안 「요금제 계산 안내」 버튼에서 연다. */
export default function PricingPageClient() {
  return (
    <div className="landing-v5 min-h-screen">
      <Navbar />
      <main className="pt-16">
        <PricingSection />
      </main>
      <Footer />
      <BottomBar />
    </div>
  )
}
