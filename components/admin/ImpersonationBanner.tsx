'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  storeName: string
  originalEmail: string
}

/** 대리접속 중일 때 모든 관리자 화면 최상단에 표시되는 고정 배너 */
export default function ImpersonationBanner({ storeName, originalEmail }: Props) {
  const router = useRouter()
  const [exiting, setExiting] = useState(false)

  async function handleExit() {
    setExiting(true)
    try {
      await fetch('/api/admin/impersonation/exit', { method: 'POST' })
    } finally {
      router.push('/admin/companies')
      router.refresh()
    }
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-semibold text-center">
      <span>🔑 {storeName} 대신 관리 중</span>
      <span className="opacity-80 font-normal">· 슈퍼관리자: {originalEmail}</span>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="ml-1 underline underline-offset-2 hover:opacity-80 disabled:opacity-50 font-bold"
      >
        {exiting ? '나가는 중...' : '나가기'}
      </button>
    </div>
  )
}
