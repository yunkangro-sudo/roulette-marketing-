'use client'

import { KAKAO_CONSULT_URL, SIGNUP_PATH } from '@/lib/landing-v5/config'

type Props = {
  onDemo: () => void
}

export default function BottomBar({ onDemo }: Props) {
  const kakaoReady = Boolean(KAKAO_CONSULT_URL)

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-dg-line bg-white/95 px-3 pt-2 md:hidden"
      style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="grid grid-cols-2 gap-2">
        <a
          href={kakaoReady ? KAKAO_CONSULT_URL : SIGNUP_PATH}
          className="flex h-12 items-center justify-center text-[14px] font-bold text-dg-ink"
          style={{ background: '#FEE500', borderRadius: 4 }}
        >
          카톡 상담하기
        </a>
        <button
          type="button"
          onClick={onDemo}
          className="flex h-12 items-center justify-center text-[14px] font-bold text-dg-ink"
          style={{ borderRadius: 4, background: '#00C7A7' }}
        >
          체험하기
        </button>
      </div>
    </div>
  )
}
