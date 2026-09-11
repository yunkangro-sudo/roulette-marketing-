'use client'

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
  PricingSection,
  FinalCta,
  Footer,
} from './Sections'
import ClientsSection from './ClientsSection'
import FaqSection from './FaqSection'
import BottomBar from './BottomBar'
import { SHOW_CLIENT_SHOWCASE } from '@/lib/landing-v5/config'

export default function LandingV5() {
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
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
      <BottomBar />
    </div>
  )
}
