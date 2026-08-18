import { SCREENSHOTS, type ScreenshotId } from '@/lib/landing-v5/config'

type Props = {
  shotId: ScreenshotId
  caption?: string
  className?: string
  tone?: 'light' | 'dark'
}

export default function ScreenshotSlot({ shotId, caption, className = '', tone = 'light' }: Props) {
  const shot = SCREENSHOTS[shotId]
  const showCaption = caption ?? shot.caption

  return (
    <figure className={`w-full ${className}`}>
      <div className="relative mx-auto w-full max-w-[280px] overflow-hidden border border-dg-line bg-[#1A1A1A] shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
        style={{ aspectRatio: '9 / 19.5', borderRadius: 6 }}
      >
        {shot.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shot.src}
            alt={shot.label}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
            <span className="font-num text-[11px] tracking-widest text-dg-green">
              {shot.id}
            </span>
            <p className="font-han text-[22px] leading-snug text-white">
              {shot.label}
            </p>
            <p className="text-[12px] leading-relaxed text-white/45">
              실제 게임 화면으로 교체 예정
            </p>
          </div>
        )}
      </div>
      {showCaption && (
        <figcaption className={`mt-3 text-center text-[13px] ${tone === 'dark' ? 'text-white/55' : 'text-dg-ink-soft'}`}>
          {showCaption}
        </figcaption>
      )}
    </figure>
  )
}
