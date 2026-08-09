'use client'

import { motion } from 'framer-motion'
import type { PrizeResult } from './types'

interface Props {
  result: PrizeResult
  onReplay: () => void
}

export default function ResultScreen({ result, onReplay }: Props) {
  const isBig = result.tier === 'big'
  const isSmall = result.tier === 'small'
  const isMiss = result.tier === 'miss'

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 px-8 gap-8">
      {/* 짠! */}
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 14 }}
        className="text-5xl font-black text-white tracking-tight"
      >
        짠! 🎰
      </motion.div>

      {/* 결과 카드 */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className={`w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl ${
          isBig
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
            : isSmall
            ? 'bg-gradient-to-br from-orange-500 to-red-500'
            : 'bg-gray-800 border border-gray-700'
        }`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          className="text-7xl mb-4"
        >
          {isBig ? '🎊' : isSmall ? '🎉' : '💨'}
        </motion.div>

        <p className={`text-2xl font-bold ${isMiss ? 'text-gray-300' : 'text-white'}`}>
          {result.label}
        </p>

        {isMiss && (
          <p className="text-gray-500 text-sm mt-3">다음엔 꼭 당첨되실 거예요!</p>
        )}
        {isSmall && (
          <p className="text-white/80 text-sm mt-3">
            매장에서 직원에게 화면을 보여주세요
          </p>
        )}
        {isBig && (
          <div className="mt-3 bg-black/20 rounded-xl p-3">
            <p className="text-white/90 text-sm font-semibold">
              당근마켓 단골 추가 인증 후 사용 가능
            </p>
            <p className="text-white/60 text-xs mt-1">
              당근에서 단골 추가 → 매장에서 확인
            </p>
          </div>
        )}
      </motion.div>

      {/* 다시 하기 버튼 */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={onReplay}
        className="text-gray-400 text-sm border border-gray-700 hover:border-gray-500 px-8 py-3 rounded-full transition-colors"
      >
        처음부터 다시 보기
      </motion.button>
    </div>
  )
}
