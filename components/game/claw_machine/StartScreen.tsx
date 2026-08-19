'use client'

interface Props {
  onStart: () => void
}

export default function StartScreen({ onStart }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 bg-[#FFF3DE] px-8">
      {/* 이벤트 썸네일 플레이스홀더 */}
      <div className="flex aspect-video w-full max-w-sm flex-col items-center justify-center gap-2 rounded-2xl border border-[#222222]/10 bg-white/60">
        <img
          src="/characters/char_result_jackpot.png"
          alt=""
          className="h-14 w-14 select-none object-contain"
        />
        <span className="text-sm text-[#222222]/40">이벤트 썸네일</span>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#222222]">럭키박스 뽑기</h1>
        <p className="mt-2 text-sm text-[#222222]/50">지금 도전하고 쿠폰 받아가세요!</p>
      </div>

      <button
        onClick={onStart}
        className="w-full max-w-sm bg-orange-500 hover:bg-orange-400 text-white px-10 py-4 rounded-full text-lg font-bold transition-colors"
      >
        시작하기
      </button>
    </div>
  )
}
