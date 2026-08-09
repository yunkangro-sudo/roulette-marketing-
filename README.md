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

- [x] 2단계 버그 수정: "처음부터 다시 보기" 참여 제한 우회 문제 수정
- [x] Supabase 테이블 권한(GRANT) 추가

### 2026-08-09 (집 컴퓨터 세션 — 멀티 환경 세팅 + 버그 발견/수정)
- [x] 회사 → 집 컴퓨터 첫 클론 + `.env.local` 세팅 완료 (Supabase, AUTH_SECRET 등)
- [x] `test-user-1`/`test-user-2` 로그인 → 게임 완료 → 재로그인 중복 참여 차단 시나리오 재현 테스트
- [x] **버그 발견**: `daily_participation_log`에 RLS가 켜져 있어 참여 기록 저장이 401로 조용히 실패 → 하루 1회 참여 제한이 무력화되어 있었음 (에러가 화면에 안 보이고 콘솔에만 로그됨)
- [x] **수정**: `alter table daily_participation_log disable row level security;` 적용 (`docs/migrations/001_disable_rls_daily_participation_log.sql` 참고)
- [x] `docs/migrations/` 폴더 신설 — Supabase 대시보드에서 실행한 SQL은 앞으로 전부 이 폴더에 기록 (Git에 안 남는 DB 변경 추적용)

- [x] 위 RLS 수정 재테스트 완료 — already_participated 화면 정상 노출 확인

### 2026-08-09 (3단계: 게임 결과 서버 확정)
- [x] `POST /api/games/play` 추가 — 서버가 `prize_tiers`를 조회해 가중 랜덤 추첨 후 결과만 반환 (클라이언트는 결과 받아서 애니메이션만 재생)
- [x] `lib/game-engine/prizeDraw.ts` — 추첨 순수 함수 (`drawPrizeTier`, `applyStockSafetyNet`)
- [x] `PlayScreen.tsx` — 드래그 손 뗀 시점에 API 호출 → 응답으로 애니메이션 재생하도록 교체 (`/game-demo`처럼 eventId 없는 데모 모드는 기존 클라이언트 로컬 추첨 유지)
- [x] `prize_tiers` 스키마를 확률(%) 직접입력 → **수량 기반 자동계산**으로 전환
  - `total_quantity`/`remaining_quantity`/`computed_probability` 컬럼, `events.expected_daily_participants` 추가
  - `computed_probability`(이벤트 설정 시점에 고정 계산)를 추첨 가중치로 사용 — `remaining_quantity`를 가중치로 쓰면 재고가 줄수록 확률이 흔들리는 버그가 있어서 안전장치(품절 시 꽝 강제 전환) 용도로만 분리
  - `lib/game-engine/probability.ts` — 확률 계산 순수 함수 (관리자 화면 없어서 아직 API 연결 안 함, 4단계에서 재사용 예정)
  - `tier_usage_counters` 테이블 삭제 (수량 기반으로 통합되어 불필요)
- [x] 실제 API 반복 호출(200회 + 소진 테스트)로 검증: 재고가 줄어도 비율 안정적으로 유지, 특정 티어 소진 시 이후 절대 안 나오는 것까지 확인
- [x] **버그 수정**: `computed_probability`를 티어별로 독립 계산만 하고 정규화하지 않아 이벤트당 합계가 100%가 안 되던 문제(91.667%) 발견/수정 — `lib/game-engine/probability.ts`에 `normalizeProbabilities()` 추가, `npm test`(node:test 기반) 테스트 5개로 합계 100% 보장 검증, DB 기존 값도 정규화 재적용 (54.545/27.273/18.182 = 100)

### 2026-08-09 (4단계: 쿠폰 발급/상태머신 — 게임 당첨분 source_type='game_win'만)
- [x] `coupons` 테이블 추가 (`kakao_user_id` 포함 — 지시문엔 없었지만 "내 쿠폰함" 조회를 위해 필수라 판단해 추가). `game_event_id`는 아직 참조할 "게임 세션" 테이블이 없어서 생략, `event_id`만 사용
- [x] `events.coupon_validity_type`/`coupon_validity_value` 추가 (테스트 이벤트는 relative_days/14로 시드)
- [x] `lib/game-engine/couponValidity.ts` — `valid_until` 계산 순수 함수 + `node:test` 5개 (14일 계산, 월 넘어가는 경우 등)
- [x] `/api/games/play`가 당첨(꽝 제외) 시 `coupons` row 생성 — 인증 불필요면 `issued`, 인증 필요면 `pending_verify`로 즉시 기록
- [x] 결과화면에 쿠폰 코드/사용기간 표시 추가, 고액 당첨 시 "당근 단골 추가 유도" 화면(`VerificationCtaScreen`)으로 연결 (실제 당근 연동은 다음 단계)
- [x] 실제 반복 플레이로 검증: 1,000원권→`issued`, 10,000원권→`pending_verify`, `valid_until`이 발급일+14일 정확히 계산됨, 꽝은 쿠폰 미생성 — 모두 확인 완료

### 다음 세션 예정
- [ ] 5단계: 관리자 화면 (캠페인 관리, 쿠폰 현황, 이벤트 기간·예상참여자수 입력 → 확률 자동계산 UI)
- [ ] 쿠폰 사용처리 화면 (직원용, status → used) / 만료 배치 (status → expired)
- [ ] 6단계: 카카오 로그인 실제 연결 (mockLogin → Kakao SDK 교체)

---

## 문서 지도 (설계서)

코드를 수정하기 전에 아래 문서를 먼저 확인한다. 특히 02, 03, 04는 코드 구조와 1:1로 대응한다.

| 문서 | 내용 |
|---|---|
| [`docs/01-marketing-strategy.md`](./docs/01-marketing-strategy.md) | 사업/마케팅 전략 (하이브리드 판매 구조, 채널, 예산) |
| [`docs/02-system-architecture.md`](./docs/02-system-architecture.md) | 역할 계층, 데이터 모델 개념도, 권한 매트릭스, 화면군 사이트맵 |
| [`docs/03-game-cta-design.md`](./docs/03-game-cta-design.md) | 서비스 참여-전환 프로세스, CTA 채널별 기술 검토, 설계서 전체 로드맵 |
| [`docs/04-data-api-security.md`](./docs/04-data-api-security.md) | ERD 상세, API 명세, 개인정보·보안 원칙 |
| [`docs/migrations/`](./docs/migrations/) | Supabase 대시보드에서 실행한 DB 변경사항 기록 (Git에 안 남는 부분 추적용, **새 세션 시작 시 필수 확인**) |
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

채팅창(대화 기록)은 집 ↔ 회사 컴퓨터 간에 **공유되지 않는다.** 이어서 작업하기 위한 유일한 연결고리는 Git에 커밋된 문서들이다. 그래서 아래 두 가지를 세션마다 반드시 지킨다.

### 세션 시작 시 (AI에게 맨 처음 전달할 지시문)

새 컴퓨터에서 작업을 시작할 때, Claude(지시문 작성)나 Cursor(실행) 양쪽 모두에게 아래 문구를 **가장 먼저** 붙여넣는다. 그래야 이전 세션의 판단·버그·수정 내역을 놓치지 않고 이어갈 수 있다.

```
작업 시작 전에 아래를 순서대로 반드시 먼저 확인해줘:

1. git pull origin main 으로 최신 코드 동기화
2. README.md 전체 (특히 "진행 로그" 최신 날짜 항목)
3. CHANGELOG.md
4. AI_HANDOFF.md
5. docs/migrations/ 폴더 안의 모든 SQL 파일 (Supabase 대시보드에서 실행된 DB 변경사항 — 실제 DB에 이미 적용된 것으로 간주할 것)
6. .env.example (새로 추가된 환경변수가 있는지, 내 .env.local에 빠진 게 없는지 확인)

다 확인했으면 "현재 상태 요약"을 먼저 나에게 말해주고, 내가 확인/승인하면 작업을 시작해줘.
기존 아키텍처와 코드 스타일은 그대로 유지하고, 불필요한 재작성은 하지 마.
```

### 세션 종료 시 (다음 세션에 끊김 없이 넘기기 위한 체크리스트)

- [ ] README.md "진행 로그"에 오늘 한 일 + **왜** 그렇게 했는지 한 줄 이상 기록
- [ ] Supabase 대시보드에서 SQL을 실행했다면, `docs/migrations/`에 번호 붙여서 파일로 남김 (규칙: [`docs/migrations/README.md`](./docs/migrations/README.md))
- [ ] 새 환경변수를 추가했다면 `.env.example`에도 반영
- [ ] `git add . && git commit -m "..." && git push origin main`
