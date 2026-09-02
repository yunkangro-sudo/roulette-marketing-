'use client'

import { useMemo, useState } from 'react'

interface Props {
  storeId: string
  /** play(기본)=게임 참여 QR, checkin=NFC 방문적립 보완용 QR(태그 고장/NFC 꺼짐 대비) */
  purpose?: 'play' | 'checkin'
}

const COPY: Record<'play' | 'checkin', { title: string; description: string; hint: string }> = {
  play: {
    title: '매장 고정 QR코드',
    description:
      '이벤트를 새로 만들거나 바꿔도 이 QR/URL은 그대로예요. 손님이 스캔하면 항상 "지금 진행중인 이벤트"로 자동 연결돼요.',
    hint: 'QR 밑에는 이 주소를 같이 인쇄하세요 — 스캔이 안 될 때 손님이 직접 입력할 수 있어요.',
  },
  checkin: {
    title: 'NFC 보완용 QR코드',
    description:
      'NFC 태그가 고장났거나 손님 폰의 NFC가 꺼져있을 때, 이 QR코드를 대신 스캔해도 완전히 동일하게 방문 적립이 돼요.',
    hint: 'NFC 태그 옆에 이 QR코드를 같이 인쇄해두면, 태그가 안 될 때 바로 대체 수단으로 안내할 수 있어요.',
  },
}

/**
 * 매장 고정 QR코드 카드. storeId(+purpose) 하나로 결정되는 값이라 DB 저장 없이
 * /api/admin/store-qr에서 매번 즉석 생성한다 — 이벤트를 몇 번 바꿔도(purpose=play)
 * 이 QR/URL은 절대 바뀌지 않는다("현재 활성 이벤트"를 /play/[storeId]가 대신 조회).
 */
export default function StoreQrCard({ storeId, purpose = 'play' }: Props) {
  const [copied, setCopied] = useState(false)
  const copy = COPY[purpose]

  const pngSrc = `/api/admin/store-qr?format=png&purpose=${purpose}&store_id=${encodeURIComponent(storeId)}`
  const pngDownloadHref = `${pngSrc}&download=1`
  const svgDownloadHref = `/api/admin/store-qr?format=svg&purpose=${purpose}&download=1&store_id=${encodeURIComponent(storeId)}`

  const targetUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.dgting.co.kr'
    return `${origin}/${purpose === 'checkin' ? 'checkin' : 'play'}/${storeId}`
  }, [storeId, purpose])

  function handleCopy() {
    navigator.clipboard.writeText(targetUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
      <div className="flex flex-col sm:flex-row gap-5">
        <img
          src={pngSrc}
          alt={copy.title}
          className="w-32 h-32 rounded-lg border border-gray-100 shrink-0 self-center sm:self-start"
        />

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 mb-1">{copy.title}</h2>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">{copy.description}</p>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              readOnly
              value={targetUrl}
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

          <p className="text-xs text-gray-400 mt-3">{copy.hint}</p>
        </div>
      </div>
    </div>
  )
}
