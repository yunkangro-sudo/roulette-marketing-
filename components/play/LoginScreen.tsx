'use client'

/**
 * 손님 로그인 화면
 *
 * NEXT_PUBLIC_KAKAO_JS_KEY 설정 여부에 따라 자동 전환:
 * - 설정 O: 카카오 로그인 버튼 (실제 OAuth 리다이렉트)
 * - 설정 X: Mock 로그인 화면 (개발/테스트 전용)
 */

import { useState } from 'react'

interface Props {
  storeId: string
  onMockLogin?: (kakaoUserId: string) => void
  loading?: boolean
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY

export default function LoginScreen({ storeId, onMockLogin, loading }: Props) {
  const [customId, setCustomId] = useState('test-user-1')

  // ── 실제 카카오 로그인 (키 설정 시) ──────────────────────────
  if (KAKAO_KEY) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 px-8 gap-8">
        <div className="text-center">
          <div className="text-5xl mb-4">🥕</div>
          <h2 className="text-white text-xl font-bold">카카오로 시작하기</h2>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            쿠폰 발급을 위해 카카오 계정이 필요해요
          </p>
        </div>

        <a
          href={`/api/auth/kakao?storeId=${encodeURIComponent(storeId)}`}
          className="w-full max-w-sm flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-4 rounded-2xl text-base transition-colors"
        >
          <KakaoIcon />
          카카오로 시작하기
        </a>

        <p className="text-gray-600 text-xs text-center">
          전화번호 동의 시 쿠폰 발급 알림을 받을 수 있어요<br />
          동의하지 않아도 게임은 정상 참여 가능합니다
        </p>
      </div>
    )
  }

  // ── Mock 로그인 (Kakao 키 미설정 — 개발/테스트 전용) ─────────
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 px-8 gap-8">
      <div className="text-center">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-white text-xl font-bold">로그인이 필요해요</h2>
        <p className="text-gray-400 text-sm mt-2">게임 참여를 위해 로그인해 주세요</p>
      </div>

      <button
        onClick={() => onMockLogin?.(customId)}
        disabled={loading || !customId.trim()}
        className="w-full max-w-sm bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-bold px-6 py-4 rounded-2xl text-base transition-colors"
      >
        {loading ? '확인 중...' : '테스트 계정으로 로그인'}
      </button>

      <div className="w-full max-w-sm">
        <div className="border border-gray-700 rounded-2xl p-4 bg-gray-800/50">
          <p className="text-gray-500 text-xs mb-2">
            🔧 개발/테스트용 — 카카오 앱키 설정 전까지만 표시됨
          </p>
          <label className="text-gray-400 text-xs block mb-1">테스트 계정 ID</label>
          <input
            type="text"
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            placeholder="예: test-user-1, test-user-2"
            className="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
          />
          <div className="flex gap-2 mt-2">
            {['test-user-1', 'test-user-2', 'test-user-3'].map((id) => (
              <button
                key={id}
                onClick={() => setCustomId(id)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  customId === id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.48 3 2 6.92 2 11.8c0 3.07 1.76 5.77 4.41 7.44l-1.1 4.06a.28.28 0 0 0 .43.3l4.67-3.08A11.6 11.6 0 0 0 12 20.6C17.52 20.6 22 16.68 22 11.8S17.52 3 12 3z" />
    </svg>
  )
}
