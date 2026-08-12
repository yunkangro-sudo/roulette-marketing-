'use client'

import { useState, useCallback, useEffect } from 'react'
import { login as mockLogin, logout as mockLogout, type MockUser } from '@/lib/auth/mockLogin'
import { checkAlreadyParticipated, recordParticipation } from '@/lib/game/participation'
import LoginScreen from '@/components/play/LoginScreen'
import AlreadyParticipatedScreen from '@/components/play/AlreadyParticipatedScreen'
import GameContainer from '@/components/game/claw_machine/GameContainer'
import type { PrizeResult } from '@/components/game/types'

type Step = 'loading' | 'landing' | 'login' | 'checking' | 'already_participated' | 'playing'

interface Event {
  id: string
  name: string
  status: string
}

interface Props {
  storeId: string
  event: Event | null
}

const IS_KAKAO = !!process.env.NEXT_PUBLIC_KAKAO_JS_KEY

export default function PlayFlow({ storeId, event }: Props) {
  const [step, setStep] = useState<Step>('loading')
  const [user, setUser] = useState<MockUser | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  // ── 마운트 시 기존 세션 확인 ──────────────────────────────────
  useEffect(() => {
    if (!event) { setStep('landing'); return }

    async function checkSession() {
      // 1. 카카오 실제 세션 확인 (서버 쿠키)
      if (IS_KAKAO) {
        try {
          const res = await fetch('/api/auth/me')
          const data = await res.json()
          if (data.user && data.user.storeId === storeId) {
            const sessionUser: MockUser = {
              kakao_user_id: data.user.kakao_user_id,
              nickname:      data.user.nickname,
            }
            setUser(sessionUser)
            setStep('checking')
            const already = await checkAlreadyParticipated(storeId, sessionUser.kakao_user_id)
            setStep(already ? 'already_participated' : 'playing')
            return
          }
        } catch {
          // 세션 체크 실패 시 로그인 화면으로
        }
        setStep('landing')
        return
      }

      // 2. Mock 세션 확인 (localStorage)
      try {
        const { getCurrentUser } = await import('@/lib/auth/mockLogin')
        const stored = getCurrentUser()
        if (stored) {
          setUser(stored)
          setStep('checking')
          const already = await checkAlreadyParticipated(storeId, stored.kakao_user_id)
          setStep(already ? 'already_participated' : 'playing')
          return
        }
      } catch {
        // 무시
      }
      setStep('landing')
    }

    checkSession()
  }, [storeId, event])

  // ── 이벤트 없음 ───────────────────────────────────────────────
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

  // ── Mock 로그인 핸들러 ────────────────────────────────────────
  const handleMockLogin = useCallback(async (kakaoUserId: string) => {
    if (!kakaoUserId.trim()) return
    setLoginLoading(true)

    try {
      const loggedInUser = mockLogin(kakaoUserId)
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
  }, [storeId, user])

  const handleSwitchAccount = useCallback(async () => {
    // 카카오 세션 삭제
    if (IS_KAKAO) {
      try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    } else {
      mockLogout()
    }
    setUser(null)
    setStep('login')
  }, [])

  // ── 초기 로딩 ────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🥕</div>
          <p className="text-gray-400 text-sm">로딩 중...</p>
        </div>
      </div>
    )
  }

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
    return (
      <LoginScreen
        storeId={storeId}
        onMockLogin={handleMockLogin}
        loading={loginLoading}
      />
    )
  }

  // ── 이미 참여 화면
  if (step === 'already_participated') {
    return <AlreadyParticipatedScreen onSwitchAccount={handleSwitchAccount} />
  }

  // ── 게임 플레이
  if (step === 'playing') {
    return (
      <GameContainer
        eventId={event.id}
        kakaoUserId={user?.kakao_user_id}
        onGameResult={handleGameResult}
        onReplay={() => {
          handleSwitchAccount()
        }}
      />
    )
  }

  return null
}
