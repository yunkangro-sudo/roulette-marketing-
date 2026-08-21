'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Tier {
  label: string
}

interface Props {
  storeId: string
  onClose: () => void
}

/**
 * 순수 정보 제공용 바텀시트 — 게임 진행 조건과 무관하다.
 * 열람 여부를 서버에 기록하지 않는다. 확률/재고는 절대 표시하지 않는다.
 */
export default function PrizeListSheet({ storeId, onClose }: Props) {
  const [tiers, setTiers] = useState<Tier[] | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`/api/events/active?store_id=${encodeURIComponent(storeId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return
        if (data.tiers) setTiers(data.tiers)
        else setErrorMsg(data.error ?? '경품 정보를 불러오지 못했습니다')
      })
      .catch(() => {
        if (alive) setErrorMsg('경품 정보를 불러오지 못했습니다')
      })
    return () => { alive = false }
  }, [storeId])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-end justify-center bg-black/40"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="w-full max-w-sm touch-none rounded-t-3xl bg-[#EFE6D6] px-6 pb-8 pt-5"
          onClick={(e) => e.stopPropagation()}
          drag="y"
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, info) => {
            // 아래로 충분히 빠르게/멀리 스와이프하면 닫는다(위로는 잠기게 해 실수로 안 열리게)
            if (info.offset.y > 90 || info.velocity.y > 500) onClose()
          }}
        >
          {/* 드래그 핸들 — 스와이프 시작점을 시각적으로 알려준다 */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#222222]/15" />

          <h2 className="text-center text-lg font-extrabold text-[#222222]">
            🎁 이런 선물이 준비되어 있어요!
          </h2>

          <div className="mt-5 space-y-2.5">
            {tiers === null && !errorMsg && (
              <p className="py-6 text-center text-sm text-[#222222]/40">불러오는 중...</p>
            )}
            {errorMsg && (
              <p className="py-6 text-center text-sm text-[#222222]/40">{errorMsg}</p>
            )}
            {tiers?.map((tier, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/70 px-5 py-4 text-center shadow-sm backdrop-blur-sm"
              >
                <p className="text-base font-bold text-[#222222]">{tier.label}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full border border-[#222222]/15 bg-white/60 py-3.5 text-sm font-bold text-[#222222]/70 transition-colors hover:bg-white/80"
          >
            닫기
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
