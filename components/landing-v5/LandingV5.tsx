'use client'

import { useState } from 'react'
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
  ChannelTrust,
  PricingSection,
  FinalCta,
  Footer,
} from './Sections'
import ClientsSection from './ClientsSection'
import FaqSection from './FaqSection'
import BottomBar from './BottomBar'
import DemoModal from './DemoModal'
import { SHOW_CLIENT_SHOWCASE } from '@/lib/landing-v5/config'

export default function LandingV5() {
  const [demoOpen, setDemoOpen] = useState(false)
  const openDemo = () => setDemoOpen(true)

  return (
    <div className="landing-v5 min-h-screen">
      <Navbar />
      <main>
        <Hero onCta={openDemo} />
        <ClientLogoStrip />
        <ProductShowcase />
        <ProblemSection />
        <PositioningSection />
        <HowItWorks onCta={openDemo} />
        <GrowthEngineSection />
        <DifferenceSection />
        <ProofSection />
        <CarrotChannelSection />
        <ChannelTrust />
        {SHOW_CLIENT_SHOWCASE && <ClientsSection />}
        <PricingSection />
        <FaqSection />
        <FinalCta onCta={openDemo} />
      </main>
      <Footer />
      <BottomBar onDemo={openDemo} />
      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
    </div>
  )
}
