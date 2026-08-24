'use client'

import { motion } from 'framer-motion'
import type { PrizeResult } from './types'
import CouponTicket from './CouponTicket'
// VerificationCtaScreen은 공통 컴포넌트 — 특정 game_type에 종속되지 않음

interface Props {
  result: PrizeResult
  onDone: () => void
  daangnUrl?: string | null
  storeId?: string
  storeName?: string | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function trackDaangnClick() {
  fetch('/api/games/track-daangn-click', { method: 'POST' }).catch(() => {})
}

export default function VerificationCtaScreen({ result, onDone, daangnUrl, storeId, storeName }: Props) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#EFE6D6]">
      <img
        src="/characters/bg_result_spotlight.png"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />

      {storeId ? (
        <a
          href={`/me/points?store_id=${encodeURIComponent(storeId)}`}
          className="absolute right-5 top-5 z-10 text-xl leading-none text-[#222222]/40 transition-colors hover:text-[#222222]"
          aria-label="닫기"
        >
          ✕
        </a>
      ) : null}

      {/* 상단 조명(캐비닛 배경 이미지) 자리를 비켜서 매장명이 조명을 가리지 않도록
          justify-center 대신 명시적인 상단 여백(pt)으로 출력 위치를 고정한다.
          뷰포트 높이 기준(dvh)으로 잡아야 배경 이미지가 화면 전체를 덮는
          상황(모바일 실기기 포함)에서도 항상 조명 아래쪽에 위치한다 */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center gap-6 px-8 pb-[6%] pt-[15dvh] text-center">
        {storeName ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 14 }}
          >
            <p className="text-[22px] font-bold leading-snug tracking-tight text-[#222222]">
              {storeName}
            </p>
          </motion.div>
        ) : (
          <motion.img
            src="/characters/char_result_jackpot.png"
            alt=""
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 14 }}
            className="h-16 w-16 select-none object-contain"
          />
        )}

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <h2 className="text-xl font-bold leading-relaxed text-[#222222]">
            당근마켓 단골 추가하고
            <br />
            쿠폰 사용하세요
          </h2>
        </motion.div>

        {result.coupon && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="w-full max-w-sm"
          >
            <CouponTicket
              amountLabel={result.label}
              code={result.coupon.shortCode ?? result.coupon.id.slice(0, 6).toUpperCase()}
              validUntilLabel={`~${formatDate(result.coupon.validUntil)}`}
            />
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.35 }}
          className="w-full max-w-sm space-y-3"
        >
          {daangnUrl ? (
            <a
              href={daangnUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackDaangnClick}
              className="block w-full rounded-full bg-orange-500 px-10 py-4 text-center text-base font-bold text-white transition-colors hover:bg-orange-400"
            >
              당근에서 단골 추가하기
            </a>
          ) : (
            <p className="text-sm text-[#222222]/40">당근 단골 링크 준비중</p>
          )}
          <button
            type="button"
            onClick={onDone}
            className="text-xs text-[#222222]/45 hover:text-[#222222]/70"
          >
            확인했어요
          </button>

          {storeId && (
            <a
              href={`/me/points?store_id=${encodeURIComponent(storeId)}`}
              className="block w-full rounded-full border border-[#222222]/15 bg-white/60 px-10 py-3.5 text-center text-sm font-bold text-[#222222]/70 backdrop-blur-sm transition-colors hover:bg-white/80"
            >
              내 쿠폰함
            </a>
          )}
        </motion.div>
      </div>
    </div>
  )
}
