import Image from 'next/image'

/**
 * 단골팅 워드마크 — 검정 "단골" + 민트 클로버 "팅"
 */
const SIZE = {
  sm: 'h-7 w-auto',
  md: 'h-8 w-auto',
  lg: 'h-9 w-auto',
  xl: 'h-12 w-auto',
} as const

export default function BrandLogo({
  size = 'md',
  priority = false,
}: {
  size?: keyof typeof SIZE
  priority?: boolean
}) {
  return (
    <Image
      src="/logo.png"
      alt="단골팅"
      width={911}
      height={398}
      priority={priority}
      className={SIZE[size]}
    />
  )
}
