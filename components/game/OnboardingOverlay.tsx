'use client'

import { motion } from 'framer-motion'

interface Props {
  onSkip: () => void
}

export default function OnboardingOverlay({ onSkip }: Props) {
  return (
    <div className="absolute inset-0 bg-black/85 z-50 flex flex-col">
      {/* 건너뛰기 버튼 */}
      <div className="flex justify-end p-5">
        <button
          onClick={onSkip}
          className="text-white/60 text-sm px-3 py-1 rounded-full border border-white/20"
        >
          건너뛰기
        </button>
      </div>

      {/* 안내 내용 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 px-8">
        <p className="text-white text-xl font-bold text-center leading-relaxed">
          당근 인형을 손가락으로<br />움직이다 놓으면 뽑혀요!
        </p>

        {/* 스와이프 애니메이션 */}
        <div className="relative w-48 h-16 flex items-center justify-center">
          {/* 트랙 */}
          <div className="absolute w-full h-0.5 bg-white/20 rounded" />
          {/* 좌우 방향 힌트 */}
          <span className="absolute left-0 text-white/40 text-lg">◀</span>
          <span className="absolute right-0 text-white/40 text-lg">▶</span>
          {/* 움직이는 손가락 */}
          <motion.div
            className="text-4xl relative z-10"
            animate={{ x: [-50, 50, -50] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            👆
          </motion.div>
        </div>

        <p className="text-gray-400 text-sm text-center">손을 떼는 순간 자동으로 뽑혀요</p>
      </div>
    </div>
  )
}
