/**
 * /me/invite — 카카오 친구 목록 화면 (FRIEND API 심사용)
 *
 * ⚠️  이 페이지는 현재 카카오 FRIEND API 심사 통과를 위한 최소 구현입니다.
 *     실제 친구초대 기능(보상 지급, 초대 링크 생성 등)은 별도 설계 후 구현 예정입니다.
 *     -- Phase 2: 친구초대 이벤트 설계 후 이 페이지에 초대 로직 추가 예정 --
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface Friend {
  id: number
  uuid: string
  profile_nickname: string
  profile_thumbnail_image?: string
  favorite: boolean
  app_friend: boolean
}

function InviteContent() {
  const searchParams = useSearchParams()
  const storeId = searchParams.get('store_id') ?? ''

  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needConsent, setNeedConsent] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/me/friends')
        const data = await res.json()
        if (!res.ok) {
          if (data.needConsent) setNeedConsent(true)
          setError(data.error ?? '불러오기 실패')
        } else {
          setFriends(data.friends ?? [])
        }
      } catch {
        setError('네트워크 오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">친구 목록 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (needConsent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-gray-200">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">친구 목록 동의 필요</h1>
          <p className="text-sm text-gray-500 mb-6">
            카카오 FRIEND API 심사 완료 후 친구초대 기능을 이용하실 수 있습니다.
          </p>
          {storeId && (
            <a href={`/play/${storeId}`}
              className="block w-full bg-orange-500 text-white rounded-lg py-3 font-bold text-sm hover:bg-orange-400 transition-colors">
              게임 하러 가기
            </a>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 text-sm font-medium">{error}</p>
          <button onClick={() => window.location.reload()}
            className="mt-4 text-sm text-orange-500 underline">다시 시도</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">친구 초대</h1>
          <p className="text-sm text-gray-500 mt-1">
            카카오 친구에게 매장 게임을 소개해보세요!
          </p>
          {/* TODO (Phase 2): 친구초대 보상 설계 완료 후 초대 링크 생성 및 보상 지급 로직 추가 예정 */}
        </div>

        {/* 배너 */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl p-5 text-white mb-6">
          <p className="font-bold text-lg mb-1">🎮 친구와 함께 게임해요</p>
          <p className="text-orange-100 text-sm">
            친구를 초대하고 함께 당근 인형뽑기를 즐겨보세요.
            <br />
            <span className="text-white font-semibold">친구초대 보상 기능은 준비 중이에요!</span>
          </p>
        </div>

        {/* 친구 목록 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">카카오 친구 목록</h2>
            <span className="text-xs text-gray-400">{friends.length}명</span>
          </div>

          {friends.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-10 text-center text-gray-400 text-sm">
              카카오 친구가 없거나 이 앱을 사용 중인 친구가 없어요
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {friends.map((friend) => (
                <div key={friend.uuid} className="flex items-center gap-3 px-4 py-3">
                  {friend.profile_thumbnail_image ? (
                    <img src={friend.profile_thumbnail_image} alt={friend.profile_nickname}
                      className="w-10 h-10 rounded-full object-cover bg-gray-100 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl shrink-0">
                      😊
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{friend.profile_nickname}</p>
                    {friend.favorite && (
                      <p className="text-xs text-yellow-500">⭐ 즐겨찾기</p>
                    )}
                  </div>
                  {/* TODO (Phase 2): 초대 버튼 — 보상 설계 완료 후 활성화 */}
                  <button disabled
                    className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg cursor-not-allowed">
                    초대 준비중
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {storeId && (
          <div className="mt-6">
            <a href={`/play/${storeId}`}
              className="block w-full bg-gray-900 text-white rounded-xl py-3 font-bold text-sm text-center hover:bg-gray-800 transition-colors">
              게임 하러 가기
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    }>
      <InviteContent />
    </Suspense>
  )
}
