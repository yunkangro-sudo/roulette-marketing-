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
  HomepageServiceSection,
  PricingSection,
  FinalCta,
  Footer,
} from './Sections'
import ClientsSection from './ClientsSection'
import FaqSection from './FaqSection'
import BottomBar from './BottomBar'
import DemoModal from './DemoModal'
import AdminPreviewModal from './AdminPreviewModal'
import { BasicApplyModal } from './PricingModals'
import { SHOW_CLIENT_SHOWCASE } from '@/lib/landing-v5/config'

export default function LandingV5() {
  const [demoOpen, setDemoOpen] = useState(false)
  const [adminPreviewOpen, setAdminPreviewOpen] = useState(false)
  const [finalApplyOpen, setFinalApplyOpen] = useState(false)
  const openDemo = () => setDemoOpen(true)

  function goToPricing() {
    setAdminPreviewOpen(false)
    // 모달이 실제로 닫혀 body 스크롤 잠금이 풀린 뒤에 스크롤해야 정상 동작한다.
    window.setTimeout(() => {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

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
        <HomepageServiceSection />
        <PricingSection />
        <FaqSection />
        <FinalCta onCta={() => setFinalApplyOpen(true)} onPreview={() => setAdminPreviewOpen(true)} />
      </main>
      <Footer />
      <BottomBar onDemo={openDemo} />
      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
      {adminPreviewOpen && (
        <AdminPreviewModal onClose={() => setAdminPreviewOpen(false)} onApply={goToPricing} />
      )}
      {finalApplyOpen && <BasicApplyModal onClose={() => setFinalApplyOpen(false)} />}
    </div>
  )
}
