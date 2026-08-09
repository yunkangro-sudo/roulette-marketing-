'use client'

interface Props {
  onSwitchAccount: () => void
}

export default function AlreadyParticipatedScreen({ onSwitchAccount }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 px-8 gap-6 text-center">
      <div className="text-6xl">🌙</div>
      <div>
        <h2 className="text-white text-xl font-bold">오늘은 이미 참여하셨어요!</h2>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          매일 1번 참여할 수 있어요.<br />
          내일 자정이 지나면 다시 도전해주세요!
        </p>
      </div>
      <button
        onClick={onSwitchAccount}
        className="text-gray-500 text-xs border border-gray-700 px-4 py-2 rounded-full hover:border-gray-500 transition-colors"
      >
        다른 계정으로 테스트
      </button>
    </div>
  )
}
