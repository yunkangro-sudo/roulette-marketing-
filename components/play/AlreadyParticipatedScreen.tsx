'use client'

import { motion } from 'framer-motion'

interface Props {
  onSwitchAccount: () => void
}

export default function AlreadyParticipatedScreen({ onSwitchAccount }: Props) {
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
        <h2 className="text-xl font-bold text-[#222222]">오늘은 이미 참여하셨어요!</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#222222]/55">
          매일 1번 참여할 수 있어요.
          <br />
          내일 자정이 지나면 다시 도전해주세요!
        </p>
      </motion.div>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={onSwitchAccount}
        className="rounded-full border border-[#222222]/15 px-5 py-2.5 text-xs text-[#222222]/50 transition-colors hover:border-[#222222]/30"
      >
        다른 계정으로 테스트
      </motion.button>
    </div>
  )
}
