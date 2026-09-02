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
  businessHours: string | null
  naverReviewUrl: string | null
  googleReviewUrl: string | null
  logoUrl: string | null
  coverUrl: string | null
  storePhotos: string[]
  faq: { question: string; answer: string }[]
  externalLinks: { platform: string; url: string }[]
  eventName: string | null
  tierLabels: string[]
  trustMetrics: { participantCount: number; revisitRate: number } | null
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
          <p className="mt-3 text-sm text-[#222222]/50">홈페이지 준비중입니다</p>
        </div>
      </main>
    )
  }

  const hasReview = data.naverReviewUrl || data.googleReviewUrl
  const hasStoreInfo = data.address || data.businessHours || data.phone || data.externalLinks.length > 0
  const hasFaq = data.faq.length > 0

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

      {/* 히어로 */}
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
          {data.description && <p className="mt-3 text-sm leading-relaxed text-white/80">{data.description}</p>}

          <div className="mt-7">
            {data.onlinePlayEnabled ? (
              <a
                href={`/play/${encodeURIComponent(data.storeId)}?source=online`}
                className="inline-block w-full rounded-full bg-[#00C7A7] px-10 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-[#00b296]"
              >
                게임하고 쿠폰받기 🎮
              </a>
            ) : (
              <p className="rounded-full border border-white/25 px-6 py-4 text-sm font-semibold text-white/70">
                매장 방문 시 QR로 참여해보세요
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-lg space-y-6 px-5 pt-6">
        {/* 신뢰지표 */}
        {data.trustMetrics && (
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <p className="text-2xl font-black text-[#00C7A7]">{data.trustMetrics.participantCount.toLocaleString()}명</p>
              <p className="mt-1 text-xs font-semibold text-[#222222]/50">이번 달 참여자</p>
            </div>
            <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <p className="text-2xl font-black text-[#00C7A7]">{data.trustMetrics.revisitRate}%</p>
              <p className="mt-1 text-xs font-semibold text-[#222222]/50">재방문율</p>
            </div>
          </section>
        )}

        {/* 진행중인 이벤트/리워드 미리보기 */}
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

        {/* 매장 사진 */}
        {data.storePhotos.length > 0 && (
          <section className="grid grid-cols-3 gap-2">
            {data.storePhotos.map((url) => (
              <img key={url} src={url} alt="" className="aspect-square w-full rounded-xl object-cover" />
            ))}
          </section>
        )}

        {/* 리뷰 남기기 — 게임/포인트와 무관한 순수 외부링크 */}
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

        {/* 매장 정보 */}
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

        {/* FAQ */}
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
