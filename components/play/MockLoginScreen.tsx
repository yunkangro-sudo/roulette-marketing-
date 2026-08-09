'use client'

import { useState } from 'react'

interface Props {
  onLogin: (kakaoUserId: string) => void
  loading?: boolean
}

export default function MockLoginScreen({ onLogin, loading }: Props) {
  const [customId, setCustomId] = useState('test-user-1')

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 px-8 gap-8">
      <div className="text-center">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-white text-xl font-bold">로그인이 필요해요</h2>
        <p className="text-gray-400 text-sm mt-2">게임 참여를 위해 로그인해 주세요</p>
      </div>

      {/* 메인 로그인 버튼 */}
      <button
        onClick={() => onLogin(customId)}
        disabled={loading || !customId.trim()}
        className="w-full max-w-sm bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-bold px-6 py-4 rounded-2xl text-base transition-colors"
      >
        {loading ? '확인 중...' : '테스트 계정으로 로그인'}
      </button>

      {/* 계정 ID 입력 (테스트용) */}
      <div className="w-full max-w-sm">
        <div className="border border-gray-700 rounded-2xl p-4 bg-gray-800/50">
          <p className="text-gray-500 text-xs mb-2">
            🔧 테스트용 — 다른 계정으로 바꿔 재참여 제한 테스트 가능
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
