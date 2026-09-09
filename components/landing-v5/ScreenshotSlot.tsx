import { SCREENSHOTS, type ScreenshotId } from '@/lib/landing-v5/config'

type Props = {
  shotId: ScreenshotId
  caption?: string
  className?: string
  tone?: 'light' | 'dark'
  /** 원본 이미지 비율이 폰 프레임(9:19.5)과 크게 다를 때 'contain'을 쓴다 —
   *  'cover'는 실제 스크린샷이 아닌 이미지(예: 앱 화면 일부만 캡처된 것)에 쓰면 텍스트가 잘려나간다. */
  fit?: 'cover' | 'contain'
  /** 폰 프레임 최대 너비(px). 좁은 카드(모바일 캐러셀 등)에서 이미지가 카드 높이를
   *  과도하게 차지하지 않도록 기본값(280)보다 작게 줄일 수 있다. */
  maxWidth?: number
}

export default function ScreenshotSlot({ shotId, caption, className = '', tone = 'light', fit = 'cover', maxWidth = 280 }: Props) {
  const shot = SCREENSHOTS[shotId]
  const showCaption = caption ?? shot.caption
  // aspectRatio가 지정된 이미지(실제 디자인 포스터 등)는 프레임을 원본 비율에 정확히 맞춰
  // object-contain을 써도 상하좌우 여백(레터박스)이 생기지 않는다. 지정이 없으면 기존
  // 폰 스크린샷용 기본 비율(9:19.5)로 폴백한다.
  const frameAspectRatio = shot.aspectRatio ?? '9 / 19.5'
  const hasCustomRatio = Boolean(shot.aspectRatio)

  return (
    <figure className={`w-full ${className}`}>
      <div className="relative mx-auto w-full overflow-hidden border border-dg-line bg-[#1A1A1A] shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
        style={{ aspectRatio: frameAspectRatio, borderRadius: 6, maxWidth }}
      >
        {shot.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shot.src}
            alt={shot.label}
            className={`h-full w-full ${hasCustomRatio || fit === 'contain' ? 'object-contain object-center' : 'object-cover object-top'}`}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
            <span className="font-num text-[11px] tracking-widest text-dg-green">
              {shot.id}
            </span>
            <p className="text-[22px] font-extrabold leading-snug tracking-tight text-white">
              {shot.label}
            </p>
            <p className="text-[12px] leading-relaxed text-white/45">
              실제 게임 화면으로 교체 예정
            </p>
          </div>
        )}
      </div>
      {showCaption && (
        <figcaption className={`mt-1.5 text-center text-[13px] ${tone === 'dark' ? 'text-white/55' : 'text-dg-ink-soft'}`}>
          {showCaption}
        </figcaption>
      )}
    </figure>
  )
}
