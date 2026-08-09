'use client'

export default function NoEventScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 px-8 gap-6 text-center">
      <div className="text-6xl">🥕</div>
      <div>
        <h2 className="text-white text-xl font-bold">현재 진행중인 이벤트가 없어요</h2>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          매장에서 새로운 이벤트를 준비 중이에요.<br />
          조금만 기다려 주세요!
        </p>
      </div>
    </div>
  )
}
