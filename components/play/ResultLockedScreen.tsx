'use client'

import { motion } from 'framer-motion'

interface Props {
  storeId: string
  onMockLogin?: (kakaoUserId: string) => void
  loading?: boolean
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
// TEMP: 카카오 심사 대기용 임시 우회 - 심사 승인 후 제거
const KAKAO_REVIEW_PENDING = process.env.NEXT_PUBLIC_KAKAO_REVIEW_PENDING === 'true'

export default function ResultLockedScreen({ storeId, onMockLogin, loading }: Props) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#EFE6D6]">
      <img
        src="/characters/bg_result_spotlight.webp"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-8 pb-[12%]">
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 14 }}
          className="text-6xl"
        >
          🔒
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="mt-5 text-center"
        >
          <h2 className="text-xl font-bold leading-snug text-[#222222]">
            결과를 확인하려면
            <br />
            로그인하세요
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#222222]/55">
            게임은 이미 끝났어요.
            <br />
            카카오 로그인하면 당첨 결과를 보여드릴게요.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="mt-10 w-full max-w-sm"
        >
          {KAKAO_KEY ? (
            <>
              {KAKAO_REVIEW_PENDING ? (
                // TEMP: 카카오 심사 대기용 임시 우회 - 심사 승인 후 제거
                <button
                  type="button"
                  onClick={() => onMockLogin?.('test-user-1')}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FEE500] px-10 py-4 text-base font-bold text-[#222222] shadow-sm transition-colors hover:bg-[#FADA00] disabled:opacity-50"
                >
                  카카오로 결과 확인하기
                </button>
              ) : (
                <a
                  href={`/api/auth/kakao?storeId=${encodeURIComponent(storeId)}&next=claim`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FEE500] px-10 py-4 text-base font-bold text-[#222222] shadow-sm transition-colors hover:bg-[#FADA00]"
                >
                  카카오로 결과 확인하기
                </a>
              )}
              <p className="mt-3 text-center text-xs text-[#222222]/40">
                전화번호 동의는 알림 수신용이며, 동의하지 않아도 결과는 확인할 수 있어요
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-xs text-[#222222]/45">개발용 Mock 로그인</p>
              {['test-user-1', 'test-user-2', 'test-user-3'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onMockLogin?.(id)}
                  disabled={loading}
                  className="w-full rounded-full bg-[#FEE500] py-3.5 text-sm font-bold text-[#222222] shadow-sm transition-colors hover:bg-[#FADA00] disabled:opacity-50"
                >
                  {id}로 결과 확인
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
