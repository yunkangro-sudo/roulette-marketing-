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
    // 실제 로고가 준비되면: 그레이스케일 기본 적용 → 호버 시에만 원색으로 전환.
    if (client.logoUrl) {
      return (
        <div className="group relative h-9 w-[120px] shrink-0">
          <Image
            src={client.logoUrl}
            alt={client.name}
            fill
            className="object-contain object-left grayscale transition-all duration-200 group-hover:grayscale-0"
            sizes="120px"
          />
        </div>
      )
    }
    // 배지(pill) 없이 순수 텍스트 나열 — 담담하게 보여주는 톤, 호버 시에만 브랜드 그린으로 진해짐
    return (
      <span className="client-name shrink-0 whitespace-nowrap text-[17px] font-semibold">
        {client.name}
      </span>
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
