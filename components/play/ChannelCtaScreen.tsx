'use client'

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
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 px-8 gap-6 text-center">
      <div className="text-5xl">💬</div>
      <div>
        <h2 className="text-white text-xl font-bold">매장 소식을 받아보시겠어요?</h2>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          카카오 채널 추가는 선택이에요.<br />
          건너뛰어도 쿠폰과 결과는 그대로 유지됩니다.
        </p>
      </div>
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
          className="w-full max-w-sm bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-4 rounded-2xl"
        >
          카카오 채널 추가하기
        </a>
      ) : null}
      <button
        onClick={onContinue}
        className={`w-full max-w-sm font-bold py-4 rounded-2xl ${
          kakaoChannelUrl
            ? 'bg-transparent border border-gray-600 text-gray-300 hover:border-gray-400'
            : 'bg-orange-500 hover:bg-orange-400 text-white'
        }`}
      >
        건너뛰기
      </button>
    </div>
  )
}
