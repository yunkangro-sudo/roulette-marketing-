'use client'

import { useState } from 'react'
import type { GamePhase, PrizeResult } from '../types'
import StartScreen from './StartScreen'
import PlayScreen from './PlayScreen'
import ResultScreen from '../ResultScreen'
import VerificationCtaScreen from '../VerificationCtaScreen'
import ResultLockedScreen from '../../play/ResultLockedScreen'

interface Props {
  /** 게임 결과 발생 시 외부에서 처리 (DB 저장 등). 없으면 독립 실행. */
  onGameResult?: (result: PrizeResult) => void
  /** "처음부터 다시 보기" 클릭 시 외부 핸들러. 있으면 내부 리셋 대신 외부로 위임. */
  onReplay?: () => void
  eventId?: string
  /** true면 결과를 컨테이너에서 보여주지 않고 onLocked로 넘긴다 */
  deferReveal?: boolean
  onLocked?: () => void
  /** PlayFlow 랜딩에서 이미 시작한 경우 start 화면을 건너뛴다 */
  initialPhase?: GamePhase
  /** QA용 — 항상 화면 3(결과 잠금)으로 보낸다. onLocked이 없으면 컨테이너 내부에서 잠금 화면을 보여준다 */
  forceLocked?: boolean
  /** 진열장 상단 명판에 표시할 실제 매장명 */
  storeName?: string | null
}

export default function GameContainer({ onGameResult, onReplay, eventId, deferReveal, onLocked, initialPhase, forceLocked, storeName }: Props = {}) {
  const [phase, setPhase] = useState<GamePhase>(initialPhase ?? 'start')
  const [result, setResult] = useState<PrizeResult | null>(null)

  const handleStart = () => {
    setPhase('play')
  }

  const handleResult = (r: PrizeResult) => {
    setResult(r)
    setPhase('result')
    onGameResult?.(r)
  }

  const handleLocked = () => {
    if (onLocked) onLocked()
    else setPhase('result_locked')
  }

  const handleReplay = () => {
    if (onReplay) {
      // PlayFlow 안에서 쓰일 때: 외부로 위임 (로그인/참여 재체크)
      onReplay()
    } else {
      // game-demo 단독 실행 시: 내부에서 리셋
      setResult(null)
      setPhase('play')
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#EFE6D6]">
      {phase === 'start' && <StartScreen onStart={handleStart} />}

      {phase === 'play' && (
        <div className="relative w-full h-full">
          <PlayScreen
            onResult={handleResult}
            onLocked={deferReveal || forceLocked ? handleLocked : undefined}
            eventId={eventId}
            forceLocked={forceLocked}
            storeName={storeName}
          />
        </div>
      )}

      {phase === 'result_locked' && (
        <div className="relative h-full w-full">
          <ResultLockedScreen storeId="demo" />
          <button
            type="button"
            onClick={handleReplay}
            className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full bg-black/30 px-4 py-1.5 text-xs text-white backdrop-blur-sm"
          >
            ← 데모: 다시 플레이
          </button>
        </div>
      )}

      {phase === 'result' && result && (
        <ResultScreen
          result={result}
          onReplay={handleReplay}
          onVerificationCta={
            result.amount > 0 ? () => setPhase('verification_cta') : undefined
          }
        />
      )}

      {phase === 'verification_cta' && result && (
        <VerificationCtaScreen result={result} onDone={handleReplay} />
      )}
    </div>
  )
}
