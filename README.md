# 당골마켓 — 당근 인형뽑기 게임 마케팅 SaaS

로컬 상공인 방문 전환을 위한 미니게임(당근 인형뽑기) 마케팅 SaaS.
QR로 접속 → 게임 참여 → 카카오 채널·알림톡으로 방문 전환까지 이어지는 흐름을 제공한다.

---

## 진행 로그

### 2026-08-09
- [x] Git 저장소 초기화 및 GitHub Push
- [x] Vercel 배포 연결 완료
- [x] Supabase 프로젝트 생성 및 환경변수 설정
- [x] 게임 코어 프로토타입 — `/game-demo` 라우트 구현
  - [x] 시작 화면 (StartScreen)
  - [x] 최초 1회 안내 오버레이 (sessionStorage 스킵 처리)
  - [x] 크레인 좌우 드래그 + 하강/집기/상승/배출 애니메이션 (Framer Motion)
  - [x] 5초 유휴 시 폴백 버튼 자동 노출
  - [x] 결과 화면 (꽝/소액/고액 분기)
  - [x] 처음부터 다시 보기

- [x] 2단계: 랜딩 + 가짜 로그인(mockLogin) + 이벤트 자동 라우팅 (`/play/[storeId]`)
  - [x] `lib/auth/mockLogin.ts` — 카카오 교체 대비 분리 구현
  - [x] `lib/game/participation.ts` — KST 기준 일 1회 참여 체크/기록
  - [x] Supabase 테이블 생성 (events, daily_participation_log)
  - [x] 이벤트 없음 / 이미 참여 / 정상 진입 3가지 분기 처리

### 다음 세션 예정
- [ ] 3단계: 게임 결과 서버 결정 (API 라우트 + Supabase RPC)
- [ ] 4단계: 관리자 화면 (캠페인 관리, 쿠폰 현황)
- [ ] 5단계: 카카오 로그인 실제 연결 (mockLogin → Kakao SDK 교체)

---

## 문서 지도 (설계서)

코드를 수정하기 전에 아래 문서를 먼저 확인한다. 특히 02, 03, 04는 코드 구조와 1:1로 대응한다.

| 문서 | 내용 |
|---|---|
| [`docs/01-marketing-strategy.md`](./docs/01-marketing-strategy.md) | 사업/마케팅 전략 (하이브리드 판매 구조, 채널, 예산) |
| [`docs/02-system-architecture.md`](./docs/02-system-architecture.md) | 역할 계층, 데이터 모델 개념도, 권한 매트릭스, 화면군 사이트맵 |
| [`docs/03-game-cta-design.md`](./docs/03-game-cta-design.md) | 서비스 참여-전환 프로세스, CTA 채널별 기술 검토, 설계서 전체 로드맵 |
| [`docs/04-data-api-security.md`](./docs/04-data-api-security.md) | ERD 상세, API 명세, 개인정보·보안 원칙 |
| [`DESIGN.md`](./DESIGN.md) | 컬러 토큰, 타이포그래피, 레이아웃 원칙, 컴그래픽 요소 |

---

## 기술 선택

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + Framer Motion
- Supabase (DB + Auth + Storage)
- 배포: Vercel (Seoul 리전)

---

## 폴더 구조

```
/app
  /(customer)       손님 게임 플로우
    /game-demo      게임 프로토타입 (1단계)
    /play/[storeId] 실서비스 게임 참여 프로세스 (예정)
  /(public)         홍보사이트 (예정)
  /admin            광고주 관리자 (예정)
  /franchise        프랜차이즈 관리자 (예정)
  /agency           대리점 관리자 (예정)
  /super            총관리자 (예정)

/components
  /game             게임 컴포넌트 (2단계에서 그대로 재사용)
    GameContainer   게임 상태 관리
    StartScreen     시작 화면
    OnboardingOverlay  최초 안내 오버레이
    PlayScreen      크레인 드래그 게임
    ResultScreen    결과 화면
    types.ts        공유 타입
    gameUtils.ts    확률 계산

/lib
  /game-engine      게임 엔진별 로직 (예정)
  /cta-integrations 채널별 CTA 모듈 (예정)
  /auth             인증/권한 체크 (예정)
  /schemas          공유 데이터 검증 스키마 (예정)
/docs               설계서 원본 (↑ 참고)
```

---

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값 채우기 (Supabase, Kakao 등)
npm run dev
# → http://localhost:3000/game-demo 에서 게임 확인
```

---

## 개발 원칙 (반드시 지킬 것)

- 게임 결과는 **서버에서 결정**한다. 클라이언트는 결과를 받아 애니메이션만 재생한다.
- 모든 관리자 API는 **서버 측에서 역할 권한을 검증**한다 (`docs/02` 3장 권한 매트릭스 기준). 프론트엔드 화면 숨김만으로 권한을 제어하지 않는다.
- 새 게임 또는 CTA 채널 추가 시 기존 코드를 수정하지 않고 `/lib/game-engine`, `/lib/cta-integrations`에 모듈을 추가한다.
- 전화번호 등 개인정보는 암호화 저장 + 필요시 조회 방식을 따른다(`docs/04` 3장 참고).

---

## ⚠️ 카카오 연동 보류 — 건드리지 말 것

카카오 로그인 및 카카오 채널/알림톡 연동은 **의도적으로 미구현 상태**이다.

| 항목 | 상태 | 파일 |
|---|---|---|
| 카카오 로그인 | **보류** — mockLogin으로 대체 중 | `lib/auth/mockLogin.ts` |
| 카카오 채널 친구추가 CTA | **보류** | 미구현 |
| 카카오 알림톡 | **보류** | 미구현 |

**교체 방법 (준비되면):**
1. `lib/auth/mockLogin.ts`의 `login()` 함수만 카카오 OAuth 호출로 교체
2. `.env.local`에 `KAKAO_REST_API_KEY`, `NEXT_PUBLIC_KAKAO_JS_KEY`, `KAKAO_CLIENT_SECRET` 추가
3. 나머지 화면 코드는 수정 불필요

> 카카오 개발자센터 설정이 완료되기 전까지 카카오 관련 코드를 추가하거나 SDK를 호출하지 않는다.

---

## 멀티 환경 작업 규칙 (집 ↔ 회사)

```
세션 시작: git pull origin main  → 최신 코드 동기화
세션 종료: git add . && git commit -m "..." && git push origin main
```

> `.env.local`은 Git에 포함되지 않으므로, 각 컴퓨터마다 별도 생성 필요.
> Supabase API 키는 .env.example 참고해서 동일하게 입력할 것.
