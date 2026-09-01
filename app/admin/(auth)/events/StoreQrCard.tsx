'use client'

import { useMemo, useState } from 'react'

interface Props {
  storeId: string
}

/**
 * 매장 고정 QR코드 카드. storeId 하나로 결정되는 값이라 DB 저장 없이
 * /api/admin/store-qr에서 매번 즉석 생성한다 — 이벤트를 몇 번 바꿔도
 * 이 QR/URL은 절대 바뀌지 않는다("현재 활성 이벤트"를 /play/[storeId]가 대신 조회).
 */
export default function StoreQrCard({ storeId }: Props) {
  const [copied, setCopied] = useState(false)

  const pngSrc = `/api/admin/store-qr?format=png&store_id=${encodeURIComponent(storeId)}`
  const pngDownloadHref = `${pngSrc}&download=1`
  const svgDownloadHref = `/api/admin/store-qr?format=svg&download=1&store_id=${encodeURIComponent(storeId)}`

  const playUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.dgting.co.kr'
    return `${origin}/play/${storeId}`
  }, [storeId])

  function handleCopy() {
    navigator.clipboard.writeText(playUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
      <div className="flex flex-col sm:flex-row gap-5">
        <img
          src={pngSrc}
          alt="매장 고정 QR코드"
          className="w-32 h-32 rounded-lg border border-gray-100 shrink-0 self-center sm:self-start"
        />

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 mb-1">매장 고정 QR코드</h2>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            이벤트를 새로 만들거나 바꿔도 이 QR/URL은 그대로예요. 손님이 스캔하면 항상
            "지금 진행중인 이벤트"로 자동 연결돼요.
          </p>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              readOnly
              value={playUrl}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 bg-gray-50 truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {copied ? '복사됨!' : '복사'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={pngDownloadHref}
              className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              PNG 다운로드
            </a>
            <a
              href={svgDownloadHref}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              SVG 다운로드 (인쇄용)
            </a>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            QR 밑에는 이 주소를 같이 인쇄하세요 — 스캔이 안 될 때 손님이 직접 입력할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  )
}
