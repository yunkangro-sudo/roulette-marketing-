'use client'

import { motion } from 'framer-motion'

/**
 * 카카오 채널 추가 안내 — 순수 선택 CTA.
 * 가입 여부를 조회하거나 기록하지 않는다.
 * 채널 추가 / 건너뛰기 모두 동일한 onContinue로 다음 단계에 간다.
 */
interface Props {
  kakaoChannelUrl?: string | null
  onContinue: () => void
}

export default function ChannelCtaScreen({ kakaoChannelUrl, onContinue }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-[#EFE6D6] px-8 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 14 }}
        className="text-5xl"
      >
        💬
      </motion.div>
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <h2 className="text-xl font-bold text-[#222222]">매장 소식을 받아보시겠어요?</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#222222]/55">
          카카오 채널 추가는 선택이에요.
          <br />
          건너뛰어도 쿠폰과 결과는 그대로 유지됩니다.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        className="w-full max-w-sm space-y-3"
      >
        {kakaoChannelUrl ? (
          <a
            href={kakaoChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault()
              window.open(kakaoChannelUrl, '_blank', 'noopener,noreferrer')
              onContinue()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FEE500] px-6 py-4 text-base font-bold text-[#222222] shadow-sm transition-colors hover:bg-[#FADA00]"
          >
            카카오 채널 추가하기
          </a>
        ) : null}
        <button
          type="button"
          onClick={onContinue}
          className={
            kakaoChannelUrl
              ? 'w-full rounded-full border border-[#222222]/15 py-4 text-sm font-semibold text-[#222222]/55 transition-colors hover:border-[#222222]/30'
              : 'w-full rounded-full bg-orange-500 py-4 text-base font-bold text-white transition-colors hover:bg-orange-400'
          }
        >
          건너뛰기
        </button>
      </motion.div>
    </div>
  )
}
