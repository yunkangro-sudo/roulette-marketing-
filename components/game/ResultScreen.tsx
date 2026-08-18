'use client'

import { motion } from 'framer-motion'
import type { PrizeResult } from './types'

interface Props {
  result: PrizeResult
  onReplay: () => void
  /** 고액(인증 필요) 당첨일 때만 전달됨. 있으면 "처음부터 다시 보기" 대신 이 버튼을 우선 노출 */
  onVerificationCta?: () => void
  /** 결과 다음 화면(채널 CTA 등)으로 진행 */
  onContinue?: () => void
  continueLabel?: string
}

const RESULT_CHAR = {
  big: '/characters/char_result_jackpot.png',
  small: '/characters/char_result_small.png',
  miss: '/characters/char_result_miss.png',
} as const

const TINT = {
  big: 'bg-[#00C7A7]/20',
  small: 'bg-[#00C7A7]/10',
  miss: 'bg-black/10',
} as const

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function ResultScreen({ result, onReplay, onVerificationCta, onContinue, continueLabel }: Props) {
  const isMiss = result.tier === 'miss'
  const tint = TINT[result.tier]
  const charSrc = RESULT_CHAR[result.tier]

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#EFE6D6]">
      <img
        src="/characters/bg_result_spotlight.png"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className={`pointer-events-none absolute inset-0 ${tint}`} />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center px-8 pb-8 pt-[4%]">
        <motion.img
          src={charSrc}
          alt=""
          initial={{ scale: 0, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 16 }}
          className="mt-[22vh] h-auto w-[42%] max-w-[200px] select-none"
        />

        <motion.div
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.35 }}
          className="mt-4 w-full max-w-sm text-center"
        >
          <p className="text-3xl font-extrabold text-[#222222]">{result.label}</p>

          {isMiss && (
            <p className="mt-2 text-base text-[#222222]/50">다음엔 꼭 당첨되실 거예요!</p>
          )}

          {(result.pointsAwarded ?? 0) > 0 && (
            <p className="mt-2 text-base font-semibold text-[#222222]/70">
              +{result.pointsAwarded!.toLocaleString()}P 적립
            </p>
          )}

          {result.coupon && (
            <div className="mt-4 rounded-2xl bg-white/70 px-4 py-5 text-center shadow-sm backdrop-blur-sm">
              <p className="mb-1.5 text-sm text-[#222222]/45">직원에게 보여주세요</p>
              <p className="mb-2 font-mono text-5xl font-black tracking-[0.15em] text-[#222222]">
                {result.coupon.shortCode ?? result.coupon.id.slice(0, 6).toUpperCase()}
              </p>
              <p className="text-sm text-[#222222]/40">
                사용기간 ~{formatDate(result.coupon.validUntil)}
              </p>
              <div className="mt-3 border-t border-[#222222]/10 pt-3">
                <p className="rounded-xl bg-orange-500 px-4 py-2.5 text-base font-bold leading-snug text-white shadow-sm">
                  🥕 당근마켓 단골 확인 후 매장에서 사용 가능
                </p>
              </div>
            </div>
          )}

          {result.coupon && (
            <p className="mt-3 text-base text-[#222222]/55">
              매장에서 직원에게 화면을 보여주세요
            </p>
          )}
        </motion.div>

        <div className="mt-auto w-full max-w-sm pt-6">
          {onContinue || onVerificationCta ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={onContinue ?? onVerificationCta}
              className="w-full rounded-full bg-orange-500 px-10 py-4 text-base font-bold text-white transition-colors hover:bg-orange-400"
            >
              {continueLabel ?? '다음'}
            </motion.button>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={onReplay}
              className="w-full rounded-full border border-[#222222]/15 px-8 py-3 text-sm text-[#222222]/50"
            >
              처음부터 다시 보기
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
