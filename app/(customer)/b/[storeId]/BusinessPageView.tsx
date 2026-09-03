import { PRODUCT_SECTION_LABEL, type BusinessType } from '@/lib/business-page/businessTypeLabels'
import LiveStatsToggle from './LiveStatsToggle'

interface PeriodStats {
  participantCount: number
  revisitRate: number
  issuedCount: number
}

interface BusinessPageData {
  storeId: string
  storeName: string
  address: string | null
  phone: string | null
  daangnUrl: string | null
  kakaoChannelUrl: string | null
  homepageEnabled: boolean
  onlinePlayEnabled: boolean
  category: string | null
  description: string | null
  tagline: string | null
  gameCtaLabel: string | null
  businessHours: string | null
  naverReviewUrl: string | null
  googleReviewUrl: string | null
  businessType: BusinessType
  parkingInfo: string | null
  petFriendly: boolean
  pridePoints: string[]
  logoUrl: string | null
  coverUrl: string | null
  storePhotos: string[]
  faq: { question: string; answer: string }[]
  externalLinks: { platform: string; url: string }[]
  eventName: string | null
  tierLabels: string[]
  products: { name: string; image_url: string | null; price: number | null; description: string | null }[]
  activeRewardCount: number
  liveStats: { today: PeriodStats; month: PeriodStats; belowThreshold: boolean } | null
}

const PLATFORM_LABEL: Record<string, string> = {
  instagram: '인스타그램',
  blog: '블로그',
}

export default function BusinessPageView({ data }: { data: BusinessPageData }) {
  if (!data.homepageEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F5F0] px-6 text-center">
        <div>
          <p className="text-2xl font-black text-[#222222]">{data.storeName}</p>
          <p className="mt-3 text-sm text-[#222222]/50">준비중인 페이지예요</p>
        </div>
      </main>
    )
  }

  const hasReview = data.naverReviewUrl || data.googleReviewUrl
  const hasStoreInfo = data.address || data.businessHours || data.phone || data.parkingInfo || data.petFriendly || data.externalLinks.length > 0
  const hasFaq = data.faq.length > 0
  const showLiveStats = data.liveStats && !data.liveStats.belowThreshold
  const playUrl = `/play/${encodeURIComponent(data.storeId)}?source=online`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.storeName,
    ...(data.description ? { description: data.description } : {}),
    ...(data.address ? { address: { '@type': 'PostalAddress', streetAddress: data.address } } : {}),
    ...(data.phone ? { telephone: data.phone } : {}),
    ...(data.logoUrl ? { image: data.logoUrl } : data.coverUrl ? { image: data.coverUrl } : {}),
    url: `https://www.dgting.co.kr/b/${data.storeId}`,
  }

  return (
    <main className="min-h-screen bg-[#F7F5F0] pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ① 브랜드 히어로 */}
      <section className="relative overflow-hidden bg-[#222222]">
        {data.coverUrl && (
          <img src={data.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        )}
        <div className="relative mx-auto max-w-lg px-6 py-14 text-center">
          {data.logoUrl && (
            <img src={data.logoUrl} alt={data.storeName} className="mx-auto mb-4 h-16 w-16 rounded-full border-2 border-white/80 object-cover shadow-lg" />
          )}
          <h1 className="text-[26px] font-black leading-tight text-white">{data.storeName}</h1>
          {data.category && <p className="mt-1 text-sm font-semibold text-white/70">{data.category}</p>}
          {data.tagline && (
            <p className="mt-4 whitespace-pre-line text-lg font-bold leading-snug text-white">{data.tagline}</p>
          )}
          {data.description && <p className="mt-3 text-sm leading-relaxed text-white/80">{data.description}</p>}

          <div className="mt-7">
            <PlayCta enabled={data.onlinePlayEnabled} href={playUrl} label={data.gameCtaLabel} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-lg space-y-6 px-5 pt-6">
        {/* ② 오늘·이번달, 우리 매장 */}
        {showLiveStats && data.liveStats && (
          <div className="space-y-3">
            <LiveStatsToggle today={data.liveStats.today} month={data.liveStats.month} />
            <MiniCta enabled={data.onlinePlayEnabled} href={playUrl} />
          </div>
        )}

        {/* ③ 지금 받을 수 있는 혜택 */}
        <div className="space-y-3">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-[#222222]">지금 받을 수 있는 혜택</h2>
            <div className="grid grid-cols-3 gap-2">
              <BenefitCard icon="🎮" title="게임" desc="랜덤 경품 도전" />
              <BenefitCard icon="🎫" title="쿠폰" desc="당첨 즉시 저장" />
              <BenefitCard icon="⭐" title="리워드" desc={data.activeRewardCount > 0 ? `${data.activeRewardCount}종 준비됨` : '포인트로 교환'} />
            </div>
          </section>
          <MiniCta enabled={data.onlinePlayEnabled} href={playUrl} />
        </div>

        {/* ④ 진행중인 이벤트 */}
        {data.eventName && data.tierLabels.length > 0 && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-[#222222]">지금 진행중인 이벤트</h2>
            <p className="mb-3 text-sm font-semibold text-[#222222]/70">{data.eventName}</p>
            <div className="flex flex-wrap gap-2">
              {data.tierLabels.map((label) => (
                <span key={label} className="rounded-full bg-[#00C7A7]/10 px-3 py-1.5 text-xs font-bold text-[#00C7A7]">
                  {label}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ⑤ 대표 상품/메뉴/서비스 */}
        {data.products.length > 0 && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-[#222222]">{PRODUCT_SECTION_LABEL[data.businessType]}</h2>
            <div className="grid grid-cols-2 gap-3">
              {data.products.map((p, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-[#222222]/5">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="aspect-square w-full bg-[#F7F5F0]" />
                  )}
                  <div className="p-2.5">
                    <p className="truncate text-sm font-bold text-[#222222]">{p.name}</p>
                    {p.price != null && <p className="mt-0.5 text-xs font-semibold text-[#00C7A7]">{p.price.toLocaleString()}원</p>}
                    {p.description && <p className="mt-0.5 truncate text-xs text-[#222222]/50">{p.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 매장 사진 */}
        {data.storePhotos.length > 0 && (
          <section className="grid grid-cols-3 gap-2">
            {data.storePhotos.map((url) => (
              <img key={url} src={url} alt="" className="aspect-square w-full rounded-xl object-cover" />
            ))}
          </section>
        )}

        {/* ⑦ 리뷰 남기기 — 게임/포인트와 무관한 순수 외부링크 */}
        {hasReview && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-[#222222]">리뷰 남기기</h2>
            <div className="flex flex-col gap-2">
              {data.naverReviewUrl && (
                <a href={data.naverReviewUrl} target="_blank" rel="noopener noreferrer"
                  className="rounded-full border border-[#222222]/15 px-4 py-3 text-center text-sm font-bold text-[#222222] transition-colors hover:bg-[#222222]/5">
                  네이버 리뷰 남기기
                </a>
              )}
              {data.googleReviewUrl && (
                <a href={data.googleReviewUrl} target="_blank" rel="noopener noreferrer"
                  className="rounded-full border border-[#222222]/15 px-4 py-3 text-center text-sm font-bold text-[#222222] transition-colors hover:bg-[#222222]/5">
                  구글 리뷰 남기기
                </a>
              )}
            </div>
          </section>
        )}

        {/* ⑧ 매장 정보 */}
        {hasStoreInfo && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-[#222222]">매장 정보</h2>
            <dl className="space-y-2 text-sm">
              {data.address && (
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-[#222222]/40">위치</dt>
                  <dd className="text-[#222222]/80">{data.address}</dd>
                </div>
              )}
              {data.businessHours && (
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-[#222222]/40">영업시간</dt>
                  <dd className="text-[#222222]/80">{data.businessHours}</dd>
                </div>
              )}
              {data.phone && (
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-[#222222]/40">연락처</dt>
                  <dd className="text-[#222222]/80">{data.phone}</dd>
                </div>
              )}
              {data.parkingInfo && (
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-[#222222]/40">주차</dt>
                  <dd className="text-[#222222]/80">{data.parkingInfo}</dd>
                </div>
              )}
              {data.petFriendly && (
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-[#222222]/40">반려동물</dt>
                  <dd className="text-[#222222]/80">동반 가능해요 🐾</dd>
                </div>
              )}
            </dl>

            {(data.daangnUrl || data.kakaoChannelUrl || data.externalLinks.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[#222222]/5 pt-4">
                {data.daangnUrl && (
                  <a href={data.daangnUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-orange-500 hover:text-orange-600">
                    당근 단골추가 →
                  </a>
                )}
                {data.kakaoChannelUrl && (
                  <a href={data.kakaoChannelUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#3C1E1E] hover:opacity-70">
                    카카오채널 →
                  </a>
                )}
                {data.externalLinks.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#00C7A7] hover:text-[#00b296]">
                    {PLATFORM_LABEL[l.platform.toLowerCase()] ?? l.platform} →
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ⑨ 우리 매장의 자랑 */}
        {data.pridePoints.length > 0 && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-[#222222]">우리 매장의 자랑</h2>
            <div className="grid grid-cols-2 gap-2">
              {data.pridePoints.map((point, i) => (
                <div key={i} className="rounded-xl bg-[#F7F5F0] px-3 py-3 text-center text-xs font-bold text-[#222222]/80">
                  {point}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ⑩ FAQ */}
        {hasFaq && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-[#222222]">자주 묻는 질문</h2>
            <div className="divide-y divide-[#222222]/5">
              {data.faq.map((f, i) => (
                <details key={i} className="group py-3 first:pt-0 last:pb-0">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-[#222222] marker:content-none">
                    {f.question}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-[#222222]/60">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function PlayCta({ enabled, href, label }: { enabled: boolean; href: string; label?: string | null }) {
  if (!enabled) {
    return (
      <p className="rounded-full border border-white/25 px-6 py-4 text-sm font-semibold text-white/70">
        매장 방문 시 QR로 참여해보세요
      </p>
    )
  }
  return (
    <a
      href={href}
      className="inline-block w-full rounded-full bg-[#00C7A7] px-10 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-[#00b296]"
    >
      {label?.trim() || '게임하고 쿠폰받기 🎮'}
    </a>
  )
}

function MiniCta({ enabled, href }: { enabled: boolean; href: string }) {
  if (!enabled) return null
  return (
    <a
      href={href}
      className="block w-full rounded-full bg-[#222222] px-6 py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-[#222222]/85"
    >
      게임 참여하기 →
    </a>
  )
}

function BenefitCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-[#F7F5F0] px-2 py-4 text-center">
      <p className="text-xl">{icon}</p>
      <p className="mt-1.5 text-xs font-black text-[#222222]">{title}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-[#222222]/45">{desc}</p>
    </div>
  )
}
