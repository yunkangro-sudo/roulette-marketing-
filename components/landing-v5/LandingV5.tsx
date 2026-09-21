'use client'

import { useEffect } from 'react'
import './landing-v5.css'
import Navbar from './Navbar'
import Hero from './Hero'
import ClientLogoStrip from './ClientLogoStrip'
import GrowthEngineSection from './GrowthEngineSection'
import {
  ProductShowcase,
  ProblemSection,
  PositioningSection,
  HowItWorks,
  DifferenceSection,
  ProofSection,
  CarrotChannelSection,
  KakaoChannelSection,
  ChannelTrust,
  HomepageServiceSection,
  FinalCta,
  Footer,
} from './Sections'
import ClientsSection from './ClientsSection'
import FaqSection from './FaqSection'
import BottomBar from './BottomBar'
import { SHOW_CLIENT_SHOWCASE } from '@/lib/landing-v5/config'

export default function LandingV5() {
  // 예전 랜딩 앵커(/#pricing)로 들어온 경우 전용 페이지로 보낸다
  useEffect(() => {
    if (window.location.hash === '#pricing') {
      window.location.replace('/pricing')
    }
  }, [])

  return (
    <div className="landing-v5 min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <ClientLogoStrip />
        <ProductShowcase />
        <ProblemSection />
        <PositioningSection />
        <HowItWorks />
        <GrowthEngineSection />
        <DifferenceSection />
        <ProofSection />
        <CarrotChannelSection />
        <KakaoChannelSection />
        <ChannelTrust />
        {SHOW_CLIENT_SHOWCASE && <ClientsSection />}
        <HomepageServiceSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
      <BottomBar />
    </div>
  )
}
