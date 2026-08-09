'use client'

import { useState, useCallback } from 'react'
import { login, logout, type MockUser } from '@/lib/auth/mockLogin'
import { checkAlreadyParticipated, recordParticipation } from '@/lib/game/participation'
import MockLoginScreen from '@/components/play/MockLoginScreen'
import AlreadyParticipatedScreen from '@/components/play/AlreadyParticipatedScreen'
import GameContainer from '@/components/game/GameContainer'
import type { PrizeResult } from '@/components/game/types'

type Step = 'landing' | 'login' | 'checking' | 'already_participated' | 'playing'

interface Event {
  id: string
  name: string
  status: string
}

interface Props {
  storeId: string
  event: Event | null
}

export default function PlayFlow({ storeId, event }: Props) {
  const [step, setStep] = useState<Step>('landing')
  const [user, setUser] = useState<MockUser | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  // 이벤트 없음 → 안내 화면 (서버에서 판단되어 내려옴)
  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 px-8 gap-6 text-center">
        <div className="text-6xl">🥕</div>
        <div>
          <h2 className="text-white text-xl font-bold">현재 진행중인 이벤트가 없어요</h2>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            매장에서 새로운 이벤트를 준비 중이에요.<br />
            조금만 기다려 주세요!
          </p>
        </div>
        <p className="text-gray-600 text-xs">store: {storeId}</p>
      </div>
    )
  }

  const handleLogin = useCallback(async (kakaoUserId: string) => {
    if (!kakaoUserId.trim()) return
    setLoginLoading(true)

    try {
      const loggedInUser = login(kakaoUserId)
      setUser(loggedInUser)
      setStep('checking')

      const alreadyParticipated = await checkAlreadyParticipated(storeId, loggedInUser.kakao_user_id)

      if (alreadyParticipated) {
        setStep('already_participated')
      } else {
        setStep('playing')
      }
    } catch (err) {
      console.error('로그인/참여 확인 오류:', err)
      alert('오류가 발생했습니다. 다시 시도해주세요.')
      setStep('login')
    } finally {
      setLoginLoading(false)
    }
  }, [storeId])

  const handleGameResult = useCallback(async (result: PrizeResult) => {
    if (!user) return
    try {
      await recordParticipation(storeId, user.kakao_user_id)
    } catch (err) {
      console.error('참여 기록 저장 오류:', err)
    }
    // 결과는 GameContainer 내부에서 표시됨
  }, [storeId, user])

  const handleSwitchAccount = useCallback(() => {
    logout()
    setUser(null)
    setStep('login')
  }, [])

  // ── 랜딩 화면
  if (step === 'landing') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 px-8 gap-8">
        <div className="w-full max-w-sm aspect-video bg-gray-800 rounded-2xl border border-gray-700 flex flex-col items-center justify-center gap-2">
          <span className="text-5xl">🥕</span>
          <span className="text-gray-400 text-sm">이벤트 썸네일</span>
        </div>
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold">{event.name}</h1>
          <p className="text-gray-400 text-sm mt-2">지금 도전하고 쿠폰 받아가세요!</p>
        </div>
        <button
          onClick={() => setStep('login')}
          className="w-full max-w-sm bg-orange-500 hover:bg-orange-400 text-white px-10 py-4 rounded-full text-lg font-bold transition-colors"
        >
          시작하기
        </button>
      </div>
    )
  }

  // ── 로딩 (참여 확인 중)
  if (step === 'checking') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🥕</div>
          <p className="text-gray-400 text-sm">참여 정보 확인 중...</p>
        </div>
      </div>
    )
  }

  // ── 로그인 화면
  if (step === 'login') {
    return <MockLoginScreen onLogin={handleLogin} loading={loginLoading} />
  }

  // ── 이미 참여 화면
  if (step === 'already_participated') {
    return <AlreadyParticipatedScreen onSwitchAccount={handleSwitchAccount} />
  }

  // ── 게임 플레이 (1단계 컴포넌트 재사용)
  if (step === 'playing') {
    return <GameContainer onGameResult={handleGameResult} />
  }

  return null
}
