'use client'

import { motion } from 'framer-motion'
import type { PrizeResult } from './types'
// VerificationCtaScreen은 공통 컴포넌트 — 특정 game_type에 종속되지 않음

interface Props {
  result: PrizeResult
  onDone: () => void
  daangnUrl?: string | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function VerificationCtaScreen({ result, onDone, daangnUrl }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 px-8 gap-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 14 }}
        className="text-5xl"
      >
        🥕
      </motion.div>

      <div>
        <h2 className="text-white text-xl font-bold leading-relaxed">
          당근마켓 단골 추가하고
          <br />
          쿠폰 사용하세요
        </h2>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          모든 경품은 당근 단골 확인 후에
          <br />
          매장에서 사용하실 수 있어요
        </p>
      </div>

      {result.coupon && (
        <div className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-800/60 p-5 text-center">
          <p className="text-gray-400 text-xs mb-1">직원에게 보여주세요</p>
          <p className="text-white font-mono font-black text-4xl tracking-[0.2em] mb-3">
            {result.coupon.shortCode ?? result.coupon.id.slice(0, 6).toUpperCase()}
          </p>
          <p className="text-gray-500 text-xs">
            사용기한 ~{formatDate(result.coupon.validUntil)}
          </p>
        </div>
      )}

      {daangnUrl ? (
        <a
          href={daangnUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-sm bg-orange-500 hover:bg-orange-400 text-white px-10 py-4 rounded-full text-base font-bold transition-colors text-center"
        >
          당근에서 단골 추가하기
        </a>
      ) : (
        <p className="text-gray-500 text-sm">당근 단골 링크 준비중</p>
      )}
      <button
        onClick={onDone}
        className="text-gray-500 text-xs"
      >
        확인했어요
      </button>
    </div>
  )
}
