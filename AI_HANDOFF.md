# AI_HANDOFF.md — 프로젝트 인수인계 문서

> 이 문서는 코드 작업 시작 전 AI가 모든 설계 문서를 읽고 정리한 핵심 판단 요약이다.  
> 실제 스키마·코드 작업 착수 전 사람이 검토·확정해야 하는 항목들을 포함한다.  
> 수정이 필요한 부분은 이 파일에 직접 표시해줄 것.

---

## 1. 이 앱이 뭘 하는 앱인가 (한 문단 요약)

소상공인(카페·음식점·미용실 등)이 QR 코드 하나로 자기 매장에 **스크래치카드/룰렛 미니게임 이벤트**를 운영할 수 있게 해주는 **재방문 전환 마케팅 SaaS**다. 손님이 QR을 찍으면 전화번호를 입력하고 게임을 돌려 쿠폰을 받고, 그 쿠폰을 매장에서 쓰기 위해 다시 방문하는 구조다. 광고주(매장주)는 관리자 화면에서 캠페인을 만들고 당첨 보상·확률을 설정하며 전환 지표를 확인한다. 이후 단계에서는 대리점(영업 채널)과 프랜차이즈(다지점 본사)를 위한 관리 레이어를 추가해 B2B SaaS로 확장한다.

---

## 2. SaaS 스타터 템플릿 → 이 프로젝트 매핑 판단

### 2-1. 템플릿 구조 vs 이 프로젝트 구조

| 템플릿 | 이 프로젝트 대응 | 비고 |
|---|---|---|
| `tenants` | `stores` | 시스템의 최소 과금·운영 단위. 광고주 단일 매장 = 하나의 store |
| `tenant_members` | `accounts` (store 소속) | store_owner + staff 계정을 store에 연결하는 관계 |
| `super_admin` 역할 | `super_admin` 역할 | 그대로 유지 |
| `tenant_admin` 역할 | `store_owner` 역할 | MVP에서는 "매장주 = tenant_admin"으로 1:1 대응 |
| `items` 예시 테이블 | `campaigns` (핵심 테이블) | CRUD 예시를 campaign CRUD로 대체 |

**핵심 판단**: 템플릿의 **2단계 권한(super_admin / tenant_admin)** 구조는 MVP에서 필요한 권한 범위와 정확히 일치한다. 템플릿 구조를 뜯어고치지 않고, `tenant`를 `store`로 의미 재정의해서 그대로 사용하는 것이 가장 안전하고 빠른 접근이다.

### 2-2. 4단계 역할 계층 중 MVP 범위 판단

docs/02 6장 구축 순서와 .cursorrules의 스코프 관리 원칙을 종합한 판단:

**MVP 스프린트 1에서 구현할 역할 (2단계)**

| 역할 | 템플릿 매핑 | 이유 |
|---|---|---|
| `super_admin` (총관리자) | `super_admin` | 템플릿이 이미 제공, 초기 시스템 세팅·파일럿 온보딩에 즉시 필요 |
| `store_owner` (광고주) | `tenant_admin` | 실제 파일럿 운영에 필요한 유일한 고객 역할 |

**MVP에서 미루는 역할 (기능 플래그로 잠금)**

| 역할 | 미루는 이유 |
|---|---|
| `agency` (대리점) | docs/02 6장: "파일럿 이후 필요 시점에 활성화". 파일럿 3개월은 총관리자가 직접 매장 온보딩 |
| `franchise_hq` (프랜차이즈 본사) | docs/02 6장: "실제 프랜차이즈 계약 확정 시점에 구축". 수요 확인 전 과잉 개발 방지 |
| `franchise_branch` (프랜차이즈 지점) | `franchise_hq` 와 세트, 동일하게 미룸 |
| `staff` (매장 직원) | 쿠폰 사용처리는 `store_owner` 계정으로 임시 커버. 2순위 |

**결론**: 지금 당장 `agencies`와 `franchises` 테이블은 **스키마만 확보** (nullable FK로 연결), 로직과 화면은 기능 플래그로 잠금. `accounts.role` enum에는 미래 역할 값을 미리 선언해두되 현재 사용하지 않는 역할은 API 인가에서 차단.

---

## 3. `items` 예시 테이블을 대체할 실제 핵심 테이블 목록

docs/04 1-1 테이블 정의 기준, **MVP 범위만** 선별:

### 구현할 테이블 (MVP 필수)

| 테이블 | 역할 | 우선순위 |
|---|---|---|
| `stores` | 템플릿 `tenants` 대체. 매장 기본정보, QR 토큰, 카테고리 | 1순위 |
| `campaigns` | 핵심 CRUD 대상. game_type, marketing_goal, 기간, 상태 | 1순위 |
| `rewards` | 캠페인별 보상 목록. 확률·한도·재고. 합계 100% 서버 검증 필수 | 1순위 |
| `participants` | 게임 참여자. **phone_encrypted + phone_hash 이중화 필수** | 1순위 |
| `coupons` | 발급된 쿠폰. code unique, 상태(issued/used/expired) | 1순위 |
| `cta_events` | CTA 클릭/전환 로그. 집계 지표의 원천 데이터 | 2순위 |
| `audit_logs` | 주요 조작 기록. 처음부터 설계 포함(docs/02 5-6 원칙) | 2순위 |

### 스키마만 확보, 로직 미구현 (MVP 제외)

| 테이블 | 이유 |
|---|---|
| `agencies` | 대리점 기능 플래그 잠금과 동일 이유 |
| `franchises` | 프랜차이즈 기능 플래그 잠금과 동일 이유 |
| `settlements` | docs/02 6장 명시: "대리점 활성화 시점에 확장". 최소 스키마만 |

### 인덱스 우선순위 (docs/04 1-3)

- `participants(phone_hash, campaign_id)` — 중복 참여 방지 (가장 빈번한 조회)
- `stores(qr_code_token)` unique — QR 진입 라우팅
- `coupons(code)` unique — 직원 사용처리 화면

---

## 4. 이번 스프린트에서 만들 것 vs 만들지 않을 것

docs/03 3-2 작업 순서 1~6단계 기준으로 판단.

### ✅ 만들 것 (Sprint 1 범위)

| 항목 | 근거 |
|---|---|
| `/lib/schemas` — Campaign/Reward/Participant/Coupon Zod 타입 정의 | docs/03 3-2 1번, 모든 후속 작업의 기반 |
| DB 마이그레이션 — stores/campaigns/rewards/participants/coupons 테이블 | docs/04 1장 테이블 정의 기준 |
| RLS 정책 — store_owner는 자기 store 데이터만, super_admin은 전체 | 템플릿 RLS 패턴 확장 |
| `/lib/game-engine/scratch-card` — 확률 계산 순수 함수 (서버 전용) | docs/03 3-2 2번 |
| `/api/stores/:qrToken` — QR 진입 조회 API | docs/04 2-1 소비자 API 1번 |
| `/api/participants` — 전화번호 제출 + 중복 참여 서버 검증 | docs/04 2-1 소비자 API 2번 |
| `/api/participants/:id/play` — **서버에서 확률 계산 후 결과 반환** | 게임 결과 서버 확정 원칙 |
| `/api/admin/campaigns` CRUD | docs/04 2-2 관리자 API |
| `/api/admin/coupons/:code/use` — 쿠폰 사용처리 | 파일럿 운영 필수 |
| `/play/[storeId]` — 소비자 게임 플로우 화면 (전화번호 입력 → 게임 → 쿠폰) | docs/03 3-2 4번 |
| `/admin` — 광고주 관리자 (dashboard/campaigns/coupons/store-settings) | docs/03 3-2 6번 |
| `/lib/cta-integrations/kakao-channel`, `kakao-share` — MVP 1순위 CTA | docs/03 3-2 5번 |

### ❌ 만들지 않을 것 (Sprint 1 제외)

| 항목 | 이유 |
|---|---|
| `/franchise`, `/agency`, `/super` 화면 | 기능 플래그로 잠금, 파일럿 이후 단계 |
| 알림톡(알림톡) CTA 연동 | 발송 비용 발생, 코어 플로우 안정화 이후 |
| 네이버 플레이스·당근 단골 CTA | 2순위 CTA, 1순위 안정화 후 |
| 정산 로직 (settlements) | 스키마만 확보, 대리점 활성화 시점 |
| 홍보 사이트 (`/(public)`) | 파일럿 성과 데이터 확보 후 제작 |
| 데모 페이지 | 게임 엔진·소비자 플로우 안정화 후 |
| 다크모드 | .cursorrules 명시 제외 항목 |
| 리뷰 리워드 연동 | 3순위 CTA, 자동 검증 불가 |
| 결제/정산 자동화 | .cursorrules 명시 제외 항목 |
| `staff` 역할 전용 권한 세분화 | store_owner로 임시 커버 |

---

## 5. 미확정 — 코드 착수 전 확인 필요

아래 항목은 AI가 판단하기 어렵거나, 사람이 결정해야 실제 코드 방향이 확정되는 것들이다.

| 항목 | 선택지 | 권장 |
|---|---|---|
| **Supabase 연동 여부** | 스타터 템플릿이 이미 Supabase를 쓰는지, 새로 추가해야 하는지 | 확인 필요 |
| **`accounts` vs `auth.users` 관계** | 템플릿이 `auth.users`를 직접 쓰는지, 별도 `profiles`/`accounts` 테이블을 두는지 | 템플릿 스키마 확인 필요 |
| **전화번호 암호화 키 관리** | Supabase Vault 사용 vs 환경 변수 AES-256 | Supabase Vault 권장 (관리 간편) |
| **참여자 세션 토큰** | JWT 발급 방식 vs Supabase anonymous session | anonymous session 권장 (로그인 없이 QR 진입하는 소비자 흐름 최적) |
| **`stores` = `tenants` 완전 대체 여부** | 템플릿의 `tenants` 테이블을 rename해서 쓸지, 별도 `stores` 테이블을 추가할지 | rename 권장 (마이그레이션 단순화) |

---

## 6. 설계 원칙 체크리스트 (코딩 시작 전 필수)

- [ ] 게임 결과(당첨 보상)는 반드시 서버에서만 계산·확정한다
- [ ] 모든 관리자 API는 서버 미들웨어에서 소속·권한 재검증한다
- [ ] `stores`를 최소 단위로, 광고주/프랜차이즈 지점이 동일 구조를 공유한다
- [ ] 전화번호는 `phone_encrypted` + `phone_hash` 이중화 저장한다
- [ ] 게임 타입은 `/lib/game-engine/{type}` 모듈로 분리한다
- [ ] CTA 채널은 `/lib/cta-integrations/{channel}` 모듈로 분리한다
- [ ] `audit_logs` 테이블은 처음부터 스키마에 포함한다
- [ ] 데이터 타입은 `/lib/schemas`의 공유 Zod 정의를 쓴다 (화면마다 따로 정의 금지)

---

*이 문서는 실제 개발이 진행되면서 업데이트된다. 설계와 다르게 구현해야 할 경우 이유를 이 파일의 해당 항목 옆에 인라인으로 남긴다.*
