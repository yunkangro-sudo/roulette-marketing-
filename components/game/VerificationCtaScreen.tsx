'use client'

import { motion } from 'framer-motion'
import type { PrizeResult } from './types'

interface Props {
  result: PrizeResult
  onDone: () => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 고액(인증 필요) 당첨 후 노출되는 안내 화면.
 * 당근 실제 연동은 다음 단계 — 지금은 화면과 쿠폰 코드 표시만 한다.
 */
export default function VerificationCtaScreen({ result, onDone }: Props) {
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
          고액 경품은 당근 단골 추가 인증 후에
          <br />
          매장에서 사용하실 수 있어요
        </p>
      </div>

      {result.coupon && (
        <div className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-800/60 p-5 text-left">
          <p className="text-gray-500 text-xs">쿠폰 코드</p>
          <p className="text-white font-mono text-sm break-all mt-1">{result.coupon.id}</p>
          <p className="text-gray-500 text-xs mt-3">
            사용기간: {formatDate(result.coupon.issuedAt)} ~ {formatDate(result.coupon.validUntil)}
          </p>
        </div>
      )}

      <button
        onClick={onDone}
        className="w-full max-w-sm bg-orange-500 hover:bg-orange-400 text-white px-10 py-4 rounded-full text-base font-bold transition-colors"
      >
        당근에서 단골 추가하기
      </button>

      <button onClick={onDone} className="text-gray-500 text-xs">
        나중에 하기
      </button>
    </div>
  )
}
