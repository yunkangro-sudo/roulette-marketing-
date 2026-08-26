# SEO / AEO / GEO 기본 세팅 지시서 v1.0 (Next.js App Router 버전)

> 원본: Claude가 정리한 v1.0 체크리스트를 이 프로젝트(Next.js 15 App Router) 구조에 맞게 각색.
> **범위**: 기술적 세팅만. 블로그/후기 등 콘텐츠 전략은 별도 작업.

---

## 0. 시작 전 확정해야 할 것 (아래 작업 전부의 전제조건)

- [ ] **실제 서비스 도메인** — 지금은 `roulette-marketing.vercel.app`(임시)을 쓰고 있음. canonical/og:url/sitemap에 들어갈 최종 도메인을 먼저 확정할 것.
- [ ] **브랜드명 통일** — `app/layout.tsx`의 현재 메타 타이틀은 "단골마케팅"인데, `docs/dangolting_landing_v5_cursor_spec.md` 등 다른 모든 문서는 "단골팅"으로 통일되어 있음. 이 세팅 작업을 시작하기 전에 "단골팅"으로 먼저 맞출 것.
- [ ] **최종 확정 랜딩페이지 카피** — title/description/FAQ는 확정된 랜딩페이지 문구 기준으로 작성 (`단골팅_랜딩페이지_문구_수정본.md` 참고, 아직 없다면 랜딩 작업과 함께 확정)
- [ ] **대표 이미지(OG 이미지) 파일** — 카카오톡/SNS 공유 미리보기에 쓸 이미지 (권장 1200×630px)
- [ ] **사업자 전화번호/주소** — LocalBusiness 스키마용. 미확정이면 이 스키마는 스킵하고 나중에 추가(§2-2 참고)

---

## 1. 기본 SEO 메타 태그 — `export const metadata` / `generateMetadata()` 사용

⚠️ raw HTML `<head>` 태그를 직접 쓰지 않는다. Next.js App Router는 각 `page.tsx`(또는 `layout.tsx`)에서 `metadata` export로 처리한다.

```typescript
// app/(mockup)/landing/page.tsx (또는 실제 랜딩 라우트) 예시
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '단골팅 | 게임 리텐션 마케팅 - 재방문 만드는 소상공인 마케팅',
  description: '당근 노출 최적화, 영상 제작, 게임 리텐션 마케팅으로 손님을 단골로 만드는 통합 마케팅 서비스. 노출로 끝나지 않는 재방문 시스템.',
  alternates: {
    canonical: '[실제 도메인 URL]',
  },
  openGraph: {
    title: '단골팅 | 게임 리텐션 마케팅',
    description: '[위와 동일 또는 축약]',
    url: '[실제 도메인 URL]',
    images: ['[대표 이미지 URL]'],
    type: 'website',
  },
}
```

- 페이지별로 title/description이 겹치지 않게 각각 작성 (랜딩 / staff / me 등 손님·직원 화면은 검색 노출 대상이 아니므로 `robots: { index: false }`로 명시하는 것도 검토)
- `keywords` 메타 태그는 구글이 완전히 무시하므로 생략 가능 (넣어도 무해하지만 우선순위 낮음)
- `app/layout.tsx`의 루트 metadata도 이번 기회에 "단골마케팅" → "단골팅"으로 수정

---

## 2. 구조화 데이터 (JSON-LD) — GEO/AEO 핵심

Next.js에서는 페이지 컴포넌트 안에 `<script type="application/ld+json">`으로 직접 렌더링한다.

```tsx
function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

### 2-1. Organization 스키마 (바로 적용 가능)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "단골팅",
  "url": "[실제 도메인 URL]",
  "description": "당근 노출 최적화, 영상 제작, 게임 리텐션 마케팅을 결합한 소상공인 재방문 마케팅 서비스",
  "areaServed": "KR"
}
```

### 2-2. LocalBusiness 스키마 — ⚠️ 사업자 정보(전화번호/주소) 확정 전에는 넣지 않는다

placeholder나 부정확한 정보를 넣으면 검색엔진이 "신뢰할 수 없는 정보"로 판단해 감점 요인이 될 수 있다. 실제 값이 확정된 뒤 추가.

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "단골팅",
  "telephone": "[전화번호]",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "KR"
  }
}
```

### 2-3. FAQPage 스키마 — 화면에 실제로 보이는 FAQ 텍스트와 반드시 1:1 일치

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "게임을 꼭 해야 하나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "아닙니다. 게임은 목적이 아니라, 고객이 자연스럽게 참여하도록 만드는 장치입니다."
      }
    }
  ]
}
```

**중요**: 텍스트가 화면 표시와 어긋나면 스팸 신호로 판단될 수 있음. **랜딩페이지 FAQ 문구가 바뀌면 이 스키마도 반드시 같이 수정.**

---

## 3. AI 크롤러 허용 — `app/robots.ts` (static `robots.txt` 대신)

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Yeti', allow: '/' }, // 네이버 크롤러
    ],
    sitemap: '[실제 도메인 URL]/sitemap.xml',
  }
}
```

- `/admin`, `/staff`, `/me`, `/api` 등 검색 노출이 필요 없는 경로는 `disallow`로 명시하는 것을 검토 (손님/직원 전용 화면이 검색 결과에 노출되는 건 바람직하지 않음)

---

## 4. `llms.txt` 파일 — `public/llms.txt`

```markdown
# 단골팅

> 소상공인을 위한 게임 리텐션 마케팅 서비스. 당근 노출 최적화, 숏폼 영상 제작, QR 기반 게임 마케팅을 결합해 손님의 재방문과 단골화를 설계합니다.

## 핵심 서비스
- 당근마켓 노출 최적화
- 숏폼 영상 제작
- QR 게임 리텐션 마케팅 (단골팅)

## 대상
카페, 음식점, 미용실 등 오프라인 소상공인 매장

## 특징
- 로그인 없이 QR 스캔만으로 게임 참여 가능
- 게임 결과에 따라 쿠폰/포인트 지급, 당근마켓 단골 연동
- 노출부터 재방문까지 하나의 흐름으로 관리
```

---

## 5. `sitemap.xml` — `app/sitemap.ts` (Next.js 기본 기능, 별도 패키지 불필요)

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = '[실제 도메인 URL]'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    // 공개 페이지만 추가 (랜딩, 이용약관, 개인정보처리방침 등)
    // /admin, /staff, /me, /play/[storeId] 등 로그인·매장별 동적 페이지는 제외
  ]
}
```

---

## 6. 온페이지 SEO 체크리스트

- [ ] 모든 이미지에 `alt` 속성 (내용 설명, 키워드 남용 금지)
- [ ] `h1`은 페이지당 1개, 핵심 문구 포함
- [ ] `h2`/`h3` 계층이 실제 섹션 흐름(문제제기 → 해결 → 비교 → CTA)과 일치
- [ ] 이미지 WebP 변환 + lazy loading (이 프로젝트는 이미 `sharp`로 서버 리사이즈 처리하는 관례가 있음 — 랜딩 이미지도 동일 기준 적용)
- [ ] 모바일 반응형 확인

---

## 7. 네이버 서치어드바이저 (Cursor 작업 범위 아님)

- [searchadvisor.naver.com](https://searchadvisor.naver.com) 사이트 등록 + 사이트맵 제출은 **요님이 직접** 진행
- `Yeti` 크롤러 허용은 §3의 `app/robots.ts`에 이미 포함됨

---

## 8. 작업 순서

1. §0 전제조건 확정 (도메인, 브랜드명, 카피, OG 이미지)
2. `app/layout.tsx` 메타 타이틀 "단골마케팅" → "단골팅" 수정
3. 랜딩페이지에 metadata + Organization/FAQPage JSON-LD 적용 (§1, §2)
4. `app/robots.ts`, `public/llms.txt`, `app/sitemap.ts` 생성 (§3~5)
5. 온페이지 체크리스트 점검 (§6)
6. 네이버 서치어드바이저 등록 (§7, 사람이 직접)
7. 완료 후 Google Rich Results Test로 JSON-LD 검증, 적용 파일 경로 보고

---

## 9. 주의사항

- LocalBusiness/FAQ 스키마는 실제 값 확정 전에는 넣지 않는다 (틀린 정보 > 없는 정보)
- FAQ 문구 변경 시 스키마도 항상 같이 수정 (동기화 깨지면 스팸 신호)
- 이번 작업은 기술 세팅까지. 블로그 콘텐츠·후기 확보는 별도 전략
