'use client'

import { motion } from 'framer-motion'

interface Props {
  /** 다음 도전 가능 시각(ISO). 없으면 "매일 자정" 기본 문구 표시 */
  nextAvailableAt?: string | null
}

function formatNextAvailable(iso: string): string {
  const d = new Date(iso)
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`
}

export default function AlreadyParticipatedScreen({ nextAvailableAt }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-[#EFE6D6] px-8 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 14 }}
        className="text-6xl"
      >
        🌙
      </motion.div>
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <h2 className="text-xl font-bold text-[#222222]">이미 참여하셨어요!</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#222222]/55">
          {nextAvailableAt
            ? (<>다음 도전은 <span className="font-bold text-[#222222]/80">{formatNextAvailable(nextAvailableAt)}</span>부터 가능해요.</>)
            : (<>매일 1번 참여할 수 있어요.<br />내일 자정이 지나면 다시 도전해주세요!</>)}
        </p>
      </motion.div>
    </div>
  )
}
