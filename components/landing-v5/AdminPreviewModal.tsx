'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type Props = {
  onClose: () => void
  onApply: () => void
}

const SLIDES = [
  {
    id: '01',
    title: '대시보드',
    caption: '게임 참여, 쿠폰 사용, 재방문 등 핵심 지표 한눈에',
  },
  {
    id: '02',
    title: '회원 관리',
    caption: '참여 고객 리스트, 쿠폰 발급 이력 확인',
  },
  {
    id: '03',
    title: '성과 리포트',
    caption: '기간별 재방문율 추이, 매출 기여 추정치',
  },
] as const

const AUTO_ADVANCE_MS = 3600

export default function AdminPreviewModal({ onClose, onApply }: Props) {
  const [index, setIndex] = useState(0)

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
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [index])

  function goTo(next: number) {
    setIndex((next + SLIDES.length) % SLIDES.length)
  }

  const slide = SLIDES[index]

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="닫기"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-[460px] overflow-hidden border border-dg-line bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-preview-title"
        style={{ borderRadius: 14 }}
      >
        <div className="flex items-center justify-between border-b border-dg-line px-5 py-4">
          <p id="admin-preview-title" className="text-[15px] font-bold text-dg-ink">
            가입하면 이렇게 관리하실 수 있어요
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-dg-ink-soft transition-colors hover:text-dg-ink"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-5">
          <div className="relative overflow-hidden border border-white/10 bg-[#1A1A1A]" style={{ aspectRatio: '16 / 10', borderRadius: 10 }}>
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="font-num text-[11px] tracking-widest text-dg-green">{slide.id}</span>
              <p className="text-[24px] font-extrabold leading-snug tracking-tight text-white">{slide.title}</p>
              <p className="max-w-[280px] text-[13px] leading-relaxed text-white/50">{slide.caption}</p>
              <p className="mt-1 text-[11px] text-white/30">실제 관리자 화면으로 교체 예정</p>
            </div>

            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="이전 화면"
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-black/35 text-white transition-colors hover:bg-black/55"
              style={{ borderRadius: 999 }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="다음 화면"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-black/35 text-white transition-colors hover:bg-black/55"
              style={{ borderRadius: 999 }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${i + 1}번째 화면 보기`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-5 bg-dg-green' : 'w-2 bg-dg-line'}`}
              />
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 pt-6">
          <button
            type="button"
            onClick={onApply}
            className="min-h-[52px] w-full py-3.5 text-[16px] font-bold text-dg-ink transition-opacity hover:opacity-90"
            style={{ borderRadius: 6, background: 'linear-gradient(180deg, #00E0BB 0%, #00C7A7 100%)' }}
          >
            지금 신청하기
          </button>
        </div>
      </div>
    </div>
  )
}
