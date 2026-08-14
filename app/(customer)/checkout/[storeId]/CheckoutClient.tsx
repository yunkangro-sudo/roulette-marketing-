'use client'

import { useEffect, useState } from 'react'

interface Item {
  item_type: 'coupon' | 'reward'
  item_id: string
  label: string
  amount: number
  status: string
  short_code: string | null
  display_code: string
  queue_status: string
}

export default function CheckoutClient({ storeId }: { storeId: string }) {
  const [loading, setLoading] = useState(true)
  const [needLogin, setNeedLogin] = useState(false)
  const [qrEnabled, setQrEnabled] = useState(true)
  const [message, setMessage] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [storeName, setStoreName] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/checkout/${encodeURIComponent(storeId)}/mine`)
        const data = await res.json()
        if (res.status === 401 || data.needLogin) {
          setNeedLogin(true)
          setLoading(false)
          return
        }
        if (!res.ok) {
          setMessage(data.error ?? '조회에 실패했습니다')
          setLoading(false)
          return
        }
        setQrEnabled(data.qrEnabled !== false)
        setStoreName(data.storeName ?? '')
        setItems(data.items ?? [])
        setMessage(data.message ?? '')
      } catch {
        setMessage('네트워크 오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [storeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">확인 중...</p>
      </div>
    )
  }

  if (needLogin) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-8 gap-6 text-center">
        <p className="text-white text-xl font-bold">계산대에서 사용하려면 로그인이 필요해요</p>
        <a
          href={`/api/auth/kakao?storeId=${encodeURIComponent(storeId)}&next=checkout`}
          className="w-full max-w-sm bg-yellow-400 text-gray-900 font-bold py-4 rounded-2xl"
        >
          카카오로 시작하기
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 px-6 py-12">
      <div className="max-w-sm mx-auto text-center">
        <p className="text-gray-400 text-sm mb-2">{storeName || storeId}</p>
        <h1 className="text-white text-2xl font-black mb-8">계산대 대기</h1>

        {!qrEnabled && (
          <p className="text-gray-300 leading-relaxed">{message || '직원에게 쿠폰 코드를 보여주세요.'}</p>
        )}

        {qrEnabled && items.length === 0 && (
          <p className="text-gray-400">사용할 쿠폰이나 리워드가 없어요</p>
        )}

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.item_id} className="bg-gray-800 border border-gray-700 rounded-3xl px-6 py-8">
              <p className="text-orange-400 font-black text-6xl tracking-wide mb-3">{item.display_code}</p>
              <p className="text-white text-xl font-bold">{item.label}</p>
              {item.short_code && (
                <p className="text-gray-500 font-mono mt-2 tracking-widest">{item.short_code}</p>
              )}
              <p className="text-gray-400 text-sm mt-4">이 번호를 직원에게 말씀해주세요</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
