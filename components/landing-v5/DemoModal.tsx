'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DEMO_PRIZES, SIGNUP_PATH, formatWon } from '@/lib/landing-v5/config'

type Phase = 'entry' | 'loading' | 'result'
type Props = {
  onClose: () => void
}

export default function DemoModal({ onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('entry')
  const [prize, setPrize] = useState<number>(DEMO_PRIZES[0])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  useEffect(() => {
    if (phase !== 'loading') return
    const timer = window.setTimeout(() => setPhase('result'), 1200)
    return () => window.clearTimeout(timer)
  }, [phase])

  function startPlay() {
    const next = DEMO_PRIZES[Math.floor(Math.random() * DEMO_PRIZES.length)]
    setPrize(next)
    setPhase('loading')
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="체험 닫기"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-[380px] overflow-hidden border border-dg-gold/40 bg-[#1B1712] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-title"
        style={{ borderRadius: 8 }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p id="demo-title" className="text-[13px] text-white/70">
            단골팅 체험
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-white/55 transition-colors hover:text-white"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div
            className="relative mx-auto overflow-hidden border-2 border-dg-gold bg-[#F6EEDC]"
            style={{ aspectRatio: '9 / 16', maxHeight: '62dvh', borderRadius: 6 }}
          >
            {phase === 'entry' && (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div
                  className="mb-6 flex h-36 w-28 items-center justify-center border-4 border-dg-gold-deep bg-gradient-to-b from-[#2A241C] to-[#14110D]"
                  style={{ borderRadius: 4 }}
                >
                  <span className="font-han text-[42px] text-dg-gold">뽑기</span>
                </div>
                <p className="font-han text-[26px] text-dg-ink">럭키박스 캐비닛</p>
                <p className="mt-2 text-[13px] text-dg-ink-soft">
                  손님이 매장에서 보게 될 첫 화면입니다
                </p>
                <button
                  type="button"
                  onClick={startPlay}
                  className="mt-6 w-full bg-dg-green py-3.5 text-[15px] font-bold text-dg-ink transition-opacity hover:opacity-90"
                  style={{ borderRadius: 4 }}
                >
                  뽑기 시작
                </button>
              </div>
            )}

            {phase === 'loading' && (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="mb-5 h-12 w-12 animate-spin rounded-full border-2 border-dg-gold/30 border-t-dg-gold" />
                <p className="font-han text-[24px] text-dg-ink">럭키박스를 찾는 중...</p>
              </div>
            )}

            {phase === 'result' && (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <p className="text-[13px] font-semibold text-dg-green-deep">선물 도착</p>
                <p className="mt-3 font-han text-[40px] leading-none text-dg-ink">
                  {formatWon(prize)}
                </p>
                <p className="mt-2 font-han text-[22px] text-dg-ink">쿠폰</p>
                <p className="mt-5 text-[12px] leading-relaxed text-dg-ink-soft">
                  실제 서비스에서는 카카오 로그인 후
                  <br />
                  결과가 공개됩니다
                </p>
                <button
                  type="button"
                  onClick={() => setPhase('entry')}
                  className="mt-6 w-full border border-dg-ink/20 bg-white py-3 text-[14px] font-bold text-dg-ink transition-colors hover:bg-dg-cream"
                  style={{ borderRadius: 4 }}
                >
                  다시 해보기
                </button>
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-white/40">
            이 화면은 랜딩페이지 홍보용 체험입니다. 실제 참여는 매장 QR을 통해서만 이루어집니다.
          </p>

          <Link
            href={SIGNUP_PATH}
            className="mt-4 flex h-12 items-center justify-center bg-dg-green text-[15px] font-bold text-dg-ink transition-opacity hover:opacity-90"
            style={{ borderRadius: 4 }}
          >
            매장 등록하기
          </Link>
        </div>
      </div>
    </div>
  )
}
