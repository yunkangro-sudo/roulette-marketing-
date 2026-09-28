/**
 * 이미지 자리 — src가 비어 있으면 비율이 고정된 빈 박스를 보여준다.
 * 나중에 public/landing02/ 아래에 실제 이미지를 넣고 src만 채우면 교체된다.
 */
export default function ImageSlot({
  src,
  alt,
  ratio,
  label,
  dark = false,
}: {
  src: string
  alt: string
  /** CSS aspect-ratio 값. 예: '16 / 10', '9 / 16' */
  ratio: string
  /** 빈 박스에 표시할 안내 문구 */
  label: string
  dark?: boolean
}) {
  if (!src) {
    return (
      <div
        className={`flex w-full items-center justify-center border border-dashed px-6 text-center ${
          dark ? 'border-white/25 bg-white/5' : 'border-[#222222]/15 bg-[#FAF7F0]'
        }`}
        style={{ aspectRatio: ratio, borderRadius: 16 }}
      >
        <p className={`text-[15px] font-semibold leading-relaxed ${dark ? 'text-white/55' : 'text-[#222222]/45'}`}>
          {label}
          <br />
          <span className="text-[13px] font-medium">이미지 준비 중</span>
        </p>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full object-cover"
      style={{ aspectRatio: ratio, borderRadius: 16 }}
    />
  )
}
