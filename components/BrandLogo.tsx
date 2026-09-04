import Image from 'next/image'

/**
 * 단골팅 시그니처 마크(민트 클로버 + "팅").
 * 배경이 투명한 PNG라 밝은 헤더/푸터에 그대로 올려도 된다.
 */
export default function BrandLogo({
  className = 'h-8 w-auto',
  priority = false,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src="/logo.png"
      alt="단골팅"
      width={400}
      height={397}
      priority={priority}
      className={className}
    />
  )
}
