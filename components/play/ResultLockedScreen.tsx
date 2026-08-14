'use client'

interface Props {
  storeId: string
  onMockLogin?: (kakaoUserId: string) => void
  loading?: boolean
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY

export default function ResultLockedScreen({ storeId, onMockLogin, loading }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 px-8 gap-8 text-center">
      <div className="text-6xl">🔒</div>
      <div>
        <h2 className="text-white text-xl font-bold">결과를 확인하려면 로그인하세요</h2>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          게임은 이미 끝났어요.<br />
          카카오 로그인하면 당첨 결과를 보여드릴게요.
        </p>
      </div>

      {KAKAO_KEY ? (
        <>
          <a
            href={`/api/auth/kakao?storeId=${encodeURIComponent(storeId)}&next=claim`}
            className="w-full max-w-sm flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-4 rounded-2xl text-base transition-colors"
          >
            카카오로 결과 확인하기
          </a>
          <p className="text-gray-600 text-xs">
            전화번호 동의는 알림 수신용이며, 동의하지 않아도 결과는 확인할 수 있어요
          </p>
        </>
      ) : (
        <div className="w-full max-w-sm space-y-3">
          <p className="text-gray-500 text-xs">개발용 Mock 로그인</p>
          {['test-user-1', 'test-user-2', 'test-user-3'].map((id) => (
            <button
              key={id}
              onClick={() => onMockLogin?.(id)}
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-3 rounded-xl disabled:opacity-50"
            >
              {id}로 결과 확인
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
