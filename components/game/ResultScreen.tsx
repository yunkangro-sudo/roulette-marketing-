'use client'

import { motion } from 'framer-motion'
import type { PrizeResult } from './types'

interface Props {
  result: PrizeResult
  onReplay: () => void
  /** 고액(인증 필요) 당첨일 때만 전달됨. 있으면 "처음부터 다시 보기" 대신 이 버튼을 우선 노출 */
  onVerificationCta?: () => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function ResultScreen({ result, onReplay, onVerificationCta }: Props) {
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

        {result.coupon && (
          <div className="mt-4 bg-black/20 rounded-xl p-4 text-center">
            {/* 6자리 인증 코드 — 직원에게 보여줄 코드 */}
            <p className="text-white/60 text-xs mb-1">직원에게 보여주세요</p>
            <p className="text-white font-mono font-black text-4xl tracking-[0.2em] mb-3">
              {result.coupon.shortCode ?? result.coupon.id.slice(0, 6).toUpperCase()}
            </p>
            <p className="text-white/50 text-xs">
              사용기간 ~{formatDate(result.coupon.validUntil)}
            </p>
            {isBig && (
              <p className="text-white/90 text-sm font-semibold mt-2 pt-2 border-t border-white/10">
                당근마켓 단골 추가 인증 후 사용 가능
              </p>
            )}
          </div>
        )}

        {isSmall && (
          <p className="text-white/80 text-sm mt-3">
            매장에서 직원에게 화면을 보여주세요
          </p>
        )}
      </motion.div>

      {/* 고액(인증 필요) 당첨: 단골추가 CTA 우선 노출, 다시 하기는 보조 링크로 */}
      {isBig && onVerificationCta ? (
        <>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={onVerificationCta}
            className="w-full max-w-sm bg-orange-500 hover:bg-orange-400 text-white px-10 py-4 rounded-full text-base font-bold transition-colors"
          >
            당근 단골 추가하러 가기
          </motion.button>
          <button onClick={onReplay} className="text-gray-500 text-xs">
            처음부터 다시 보기
          </button>
        </>
      ) : (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onReplay}
          className="text-gray-400 text-sm border border-gray-700 hover:border-gray-500 px-8 py-3 rounded-full transition-colors"
        >
          처음부터 다시 보기
        </motion.button>
      )}
    </div>
  )
}
