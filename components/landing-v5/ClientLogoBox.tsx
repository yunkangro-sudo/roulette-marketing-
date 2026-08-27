import Image from 'next/image'
import type { Client } from '@/lib/landing-v5/config'

/**
 * logoUrl이 없으면 통일된 회색 플레이스홀더 박스(업체명 텍스트만),
 * logoUrl이 채워지면 자동으로 실제 로고 이미지로 렌더링된다.
 * size="strip": 마퀴 등 가로 나열용 — 높이만 고정하고 폭은 내용/원본 비율에 맞춰 자동.
 */
export default function ClientLogoBox({
  client,
  size = 'md',
}: {
  client: Client
  size?: 'sm' | 'md' | 'strip'
}) {
  if (size === 'strip') {
    if (client.logoUrl) {
      return (
        <div className="relative h-9 w-[120px] shrink-0">
          <Image src={client.logoUrl} alt={client.name} fill className="object-contain object-left" sizes="120px" />
        </div>
      )
    }
    return (
      <div
        className="flex h-9 min-w-[110px] shrink-0 items-center justify-center whitespace-nowrap px-4"
        style={{ background: 'var(--line)', borderRadius: 999 }}
      >
        <span className="text-[13px] font-semibold text-dg-ink-soft">{client.name}</span>
      </div>
    )
  }

  const dimension = size === 'sm' ? 'h-14 w-14' : 'h-20 w-20'

  if (client.logoUrl) {
    return (
      <div className={`relative ${dimension} shrink-0 overflow-hidden`} style={{ borderRadius: 8 }}>
        <Image src={client.logoUrl} alt={client.name} fill className="object-contain" sizes="80px" />
      </div>
    )
  }

  return (
    <div
      className={`flex ${dimension} shrink-0 items-center justify-center text-center`}
      style={{ background: 'var(--line)', borderRadius: 8 }}
    >
      <span className="px-1 text-[12px] font-semibold text-dg-ink-soft">
        {client.name}
      </span>
    </div>
  )
}
