'use client'

import { useState } from 'react'
import type { GamePhase, PrizeResult } from './types'
import StartScreen from './StartScreen'
import OnboardingOverlay from './OnboardingOverlay'
import PlayScreen from './PlayScreen'
import ResultScreen from './ResultScreen'

const ONBOARDING_KEY = 'game_onboarding_seen'

interface Props {
  /** 게임 결과 발생 시 외부에서 처리 (DB 저장 등). 없으면 독립 실행. */
  onGameResult?: (result: PrizeResult) => void
}

export default function GameContainer({ onGameResult }: Props = {}) {
  const [phase, setPhase] = useState<GamePhase>('start')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [result, setResult] = useState<PrizeResult | null>(null)

  const handleStart = () => {
    const seen = sessionStorage.getItem(ONBOARDING_KEY)
    setShowOnboarding(!seen)
    setPhase('play')
  }

  const handleSkipOnboarding = () => {
    sessionStorage.setItem(ONBOARDING_KEY, '1')
    setShowOnboarding(false)
  }

  const handleResult = (r: PrizeResult) => {
    setResult(r)
    setPhase('result')
    onGameResult?.(r)
  }

  const handleReplay = () => {
    setResult(null)
    setPhase('play')
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {phase === 'start' && <StartScreen onStart={handleStart} />}

      {phase === 'play' && (
        <div className="relative w-full h-full">
          <PlayScreen onResult={handleResult} />
          {showOnboarding && (
            <OnboardingOverlay onSkip={handleSkipOnboarding} />
          )}
        </div>
      )}

      {phase === 'result' && result && (
        <ResultScreen result={result} onReplay={handleReplay} />
      )}
    </div>
  )
}
