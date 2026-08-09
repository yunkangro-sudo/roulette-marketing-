'use client'

interface Props {
  onStart: () => void
}

export default function StartScreen({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-8 bg-gray-900">
      {/* 이벤트 썸네일 플레이스홀더 */}
      <div className="w-full max-w-sm aspect-video bg-gray-800 rounded-2xl border border-gray-700 flex flex-col items-center justify-center gap-2">
        <span className="text-5xl">🥕</span>
        <span className="text-gray-400 text-sm">이벤트 썸네일</span>
      </div>

      <div className="text-center">
        <h1 className="text-white text-2xl font-bold tracking-tight">당근 인형뽑기</h1>
        <p className="text-gray-400 text-sm mt-2">지금 도전하고 쿠폰 받아가세요!</p>
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
