# 룰렛 게임 마케팅 시스템

로컬 소상공인 재방문 전환용 미니게임(스크래치카드/룰렛) 마케팅 SaaS.
QR로 접속 → 게임 참여 → 카카오 채널·알림톡 등으로 재방문 전환까지 이어지는 흐름을 제공한다.

## 문서 지도 (설계도)

코드를 수정하기 전에 아래 문서를 먼저 확인한다. 특히 02, 03, 04는 코드 구조와 1:1로 대응한다.

| 문서 | 내용 |
|---|---|
| [`docs/01-marketing-strategy.md`](./docs/01-marketing-strategy.md) | 사업/마케팅 전략 (하이브리드 판매 구조, 채널, 예산) |
| [`docs/02-system-architecture.md`](./docs/02-system-architecture.md) | 역할 계층, 데이터 모델 개념도, 권한 매트릭스, 화면군 사이트맵 |
| [`docs/03-game-cta-design.md`](./docs/03-game-cta-design.md) | 소비자 참여-전환 플로우, CTA 채널별 기술 검증, 설계도 전체 로드맵 |
| [`docs/04-data-api-security.md`](./docs/04-data-api-security.md) | ERD 상세, API 명세, 개인정보·보안 원칙 |
| [`DESIGN.md`](./DESIGN.md) | 컬러 토큰, 타이포그래피, 레이아웃 원칙, 시그니처 요소 |

## 기술 스택

- Next.js (App Router) + TypeScript
- Tailwind CSS + Framer Motion
- 배포: Vercel

## 폴더 구조

```
/app
  /(public)        홍보사이트
  /demo             데모페이지
  /play/[storeId]   소비자 게임 참여 플로우
  /admin            광고주 관리자
  /franchise        프랜차이즈 관리자 (기능 플래그)
  /agency           대리점 관리자 (기능 플래그)
  /super            총관리자 (기능 플래그)
/lib
  /game-engine      게임 타입별 로직 (roulette, scratch-card)
  /cta-integrations 채널별 CTA 연동 (kakao-channel, kakao-share, alrimtalk, ...)
  /auth             역할별 권한 체크
  /schemas          공유 타입/검증 스키마
/docs               설계도 원본 (위 표 참고)
```

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값 채워넣기
npm run dev
```

## 개발 순서 (docs/03 3-2 참고)

1. `/lib/schemas` — 데이터 타입 정의 (docs/04 1장 테이블 정의 기준)
2. `/lib/game-engine/scratch-card` — 게임 로직 (서버에서 결과 확정, 클라이언트는 재생만)
3. `/api/campaigns`, `/api/participants`, `/api/coupons` — 기본 CRUD
4. `/play/[storeId]` — 소비자 플로우 화면
5. `/lib/cta-integrations/kakao-channel`, `kakao-share` — MVP 1순위 CTA
6. `/admin` — 광고주 관리자
7. 이후 데모/홍보사이트/2순위 CTA/대리점·프랜차이즈·총관리자 순 (docs/03 참고)

## 원칙 (반드시 지킬 것)

- 게임 결과는 **서버에서만 확정**한다. 클라이언트는 결과를 받아 애니메이션만 재생한다.
- 모든 관리자 API는 **서버 측에서 소속 권한을 재검증**한다 (`docs/02` 3장 권한 매트릭스 기준). 프론트엔드 화면 숨김만으로 권한을 대신하지 않는다.
- 새 게임 타입/CTA 채널 추가 시 기존 코드를 수정하지 않고 `/lib/game-engine`, `/lib/cta-integrations`에 모듈만 추가한다.
- 전화번호 등 개인정보는 암호화 저장 + 해시 조회 방식을 따른다 (`docs/04` 3장 참고).

## 상태

- [x] 설계도 4종 완료 (docs 폴더)
- [ ] 데이터 스키마 코드화
- [ ] 게임 엔진 MVP
- [ ] 소비자 플로우 화면
- [ ] 광고주 관리자
