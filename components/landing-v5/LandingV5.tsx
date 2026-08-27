'use client'

import { useState } from 'react'
import './landing-v5.css'
import Navbar from './Navbar'
import Hero from './Hero'
import ClientLogoStrip from './ClientLogoStrip'
import {
  ProductShowcase,
  ProblemSection,
  PositioningSection,
  HowItWorks,
  DifferenceSection,
  ProofSection,
  ChannelTrust,
  PricingSection,
  FinalCta,
  Footer,
} from './Sections'
import RoiCalculator from './RoiCalculator'
import ClientsSection from './ClientsSection'
import FaqSection from './FaqSection'
import BottomBar from './BottomBar'
import DemoModal from './DemoModal'

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
        <DifferenceSection />
        <ProofSection />
        <RoiCalculator />
        <ChannelTrust />
        <ClientsSection />
        <PricingSection onCta={openDemo} />
        <FaqSection />
        <FinalCta onCta={openDemo} />
      </main>
      <Footer />
      <BottomBar onDemo={openDemo} />
      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
    </div>
  )
}
