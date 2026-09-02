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

### 2026-08-09 (5단계: 계산대 검증 화면 — 직원용)
- [x] `/staff` 경로 신설 — 직원 로그인/계정 시스템 아직 없어서 별도 인증 없이 접근 가능 (추후 비밀번호만 추가할 예정). 손님용 화면과 달리 캐릭터/애니메이션 없이 업무용 톤(큰 글자, 명확한 버튼)으로 구성
- [x] `GET /api/coupons/lookup?code=` — 쿠폰 상세 조회 (금액/상태/발급일시/사용기간)
- [x] `POST /api/coupons/verify` — 인증 필요(`pending_verify`/`unverified`) 쿠폰 confirm→`used`, unverified→`unverified`(+사유: 앱없음/거부/기타). 재시도 무제한이라 `unverified`도 다시 confirm/unverified 처리 가능
- [x] `POST /api/coupons/use` — 인증 불필요(`issued`) 쿠폰 즉시 `used` 처리
- [x] **서버 측 재검증 추가** (지시문엔 없었지만 "모든 API는 서버에서 재검증" 원칙에 따라 보완): 화면 버튼을 우회해 API를 직접 호출해도 이미 사용됐거나(`used`) 기간이 지난(`valid_until` < 현재) 쿠폰은 상태 전환이 거부됨(409)
- [x] 화면 분기: `issued`→사용 처리 버튼만 / `pending_verify`·`unverified`→확인함·미확인 처리 버튼(+사유 드롭다운) / `used`→"이미 사용된 쿠폰입니다" 안내만 / 기간 만료 시 모든 버튼 무시하고 "사용기간이 지난 쿠폰입니다" 최우선 표시
- [x] 실제 API 시나리오 테스트로 검증: 1,000원권 사용 처리→`used`, 10,000원권 확인함→`used`, 10,000원권 미확인 처리(사유:앱없음)→`unverified`→재조회 후 재시도(확인함)까지 정상 전환, 이미 사용된 쿠폰 재사용 시도는 서버가 409로 차단

### 2026-08-09 (문서/규칙 정리 — 설계도 SSOT 동기화 + 프로젝트 규칙 등록)
- [x] **문제 발견**: `docs/당근인형뽑기_게임설계도.md`가 회사 컴퓨터에만 있고 집 컴퓨터엔 없었음 — 지시문마다 이 문서의 절 번호를 계속 참조했는데 Cursor 쪽엔 파일 자체가 없는 상태로 작업이 진행되고 있었음
- [x] 해당 문서를 `docs/`로 추가하고, 3~4절(확률/재고 로직)을 실제 구현(3단계에서 피벗한 "수량 기반 자동계산" 방식)에 맞게 갱신 — `total_quantity`/`remaining_quantity`/`computed_probability`, `expected_daily_participants`, `tier_usage_counters` 삭제 반영. 9절 데이터 모델도 동일하게 수정. 원래 있던 "일/주/월 한도" 관련 내용은 삭제하지 않고 `[v2.1 업데이트]`로 표시해 왜 바뀌었는지 이력 보존
- [x] `.cursor/rules/project-rules.mdc` 추가 — 금전/확률/재고 로직엔 자동검증 테스트 필수, 진행 기록 규칙, "설계도가 SSOT" 원칙을 항상 적용되는 규칙으로 등록 (Git 규칙은 기존 `git-workflow.mdc`와 중복이라 제외)
- [x] README "배포 전 반드시 확인할 것" 섹션 신설 — 임시 처리 항목(카카오 미연동, `/staff` 무인증, 만료 배치 미구현 등) 추적
- [x] `.cursorrules`의 "참고 문서 우선순위"에 새 설계도 문서를 1순위로 추가

### 2026-08-09 (5단계 마무리 — 만료 판정 로직 통일)
- [x] **UI 확인**: `/staff`에서 `status='used'` 쿠폰 조회 시 버튼 없이 "이미 사용된 쿠폰입니다" 안내만 뜨는지 확인 — ternary 체인 구조상 원래도 배타적이라 문제 없었음, API 레벨 테스트로 재확인 완료
- [x] `lib/coupons/getEffectiveStatus.ts` 신설 — "쿠폰의 실제 유효 상태"(DB status + valid_until 비교)를 계산하는 단일 함수. `GET /api/coupons/lookup`, `POST /api/coupons/verify`, `POST /api/coupons/use` 3곳 모두 이 함수로 통일 (기존엔 만료 판정이 각 API/프론트에 따로 흩어져 있었음)
- [x] **버그성 엣지케이스 발견/수정**: 기존엔 프론트에서 `valid_until`만 비교해 만료를 판정했는데, 만약 DB `status`가 이미 `'expired'`로 저장돼 있는 경우(지금은 아무 코드도 이렇게 안 하지만 나중에 배치가 생기면 가능)를 화면이 놓치는 구조였음 — `getEffectiveStatus`가 "status가 이미 used/expired면 그대로 신뢰, 아니면 valid_until로 판정"하는 우선순위를 명확히 하며 해결
- [x] `lookup` API 응답의 `status`가 이제 DB 원본이 아니라 `getEffectiveStatus()` 계산값 — 프론트(`/staff`)는 더 이상 자체적으로 만료를 계산하지 않고 서버 응답만 신뢰하도록 단순화
- [x] `lib/coupons/getEffectiveStatus.test.ts` — `node:test` 4개 (정상/만료/이미사용/DB에 expired로 저장된 경우)
- [x] 만료 테스트 쿠폰(`valid_until`=어제)을 직접 시드해서 실제 확인: lookup 응답 `status='expired'`, `/use` 재시도 시 409 차단 — 모두 통과

### 2026-08-09 (검증: 참여제한 로직 무영향 확인 + 규칙 파일 정리)
- [x] **확인 1**: 설계도 3.4절("일/주/월 한도 폐기") 수정이 `daily_participation_log`(손님 하루 1회 참여 제한, 2단계 기능)에 영향 없음을 확인 — `lib/game/participation.ts`는 2단계 커밋(`e4e06fe`) 이후 한 번도 수정된 적 없음(`git log --follow`로 확인). 3.4절은 프라이즈 티어(경품) 한도, 5절/9절의 `daily_participation_log`는 완전히 별개 테이블·로직이라 애초에 겹치지 않음
- [x] **확인 2**: "참고 문서 우선순위"가 `.cursorrules`(레거시 형식)에만 있고 `.cursor/rules/project-rules.mdc`(신형식)엔 없던 문제 발견 — `project-rules.mdc`로 이전하고, `.cursorrules`엔 이전 위치를 가리키는 안내만 남김 (두 곳에 중복 관리하면 드리프트 위험이 있어 한 곳으로 통일)
- [x] **확인 3**: `git-workflow.mdc`는 이번 대화에서 만든 파일이 아니라, 오늘 오후 5:52 커밋(`82a9ad6`, "게임 코어 프로토타입 + Git 워크플로우 설정")에서 이미 생성된 파일 — 1단계 작업 세션에서 함께 만들어진 것으로 추정 (파일 내용에 회사 컴퓨터 경로가 남아있음)

### 2026-08-11 (결제금액 실측 + 성과 리포트 + 에이전시 대시보드)
- [x] **설계 변경**: 실결제금액 실측 기록 기능을 핵심 증명 수단으로 재분류 — 기존 Phase 3(후순위) → 6~7단계와 통합해 우선 구현
- [x] `payment_logs` 테이블 신설 (coupon_id nullable, store_id, kakao_user_id, amount, recorded_at) — `docs/migrations/007_payment_logs_and_store_settings.sql`
- [x] `store_settings` 테이블 신설 (월광고비, 평균객단가, 매장명) — SQL 동일 파일
- [x] `POST /api/payments/record` — 계산대에서 결제금액 선택 기록
- [x] `/staff` 화면 수정 — "사용 처리"/"확인함" 클릭 전 결제금액 선택 입력 단계 추가 (필수 아님, 건너뛰기 가능)
- [x] `GET /api/admin/report` — 월별 퍼널 집계 API (광고비→참여자→발급→사용→재방문→추가매출→ROI)
- [x] `/admin/report` 신설 — 사장님용 성과 리포트 화면 (실측/추정 배지 절대 생략 안 함)
- [x] `GET /api/admin/dashboard` — 전체 매장 지표 집계 API
- [x] `/admin/dashboard` 신설 — 에이전시용 다매장 비교 대시보드 (전체 평균 ROI 영업자료용 큰 숫자 표시)

### 2026-08-12 (6단계: 관리자 권한 + 이벤트 등록)
- [x] `store_accounts` 테이블 신설 (email/password_hash/role/store_id) — `docs/migrations/008_store_accounts.sql`
- [x] iron-session + bcryptjs 설치 — httpOnly 쿠키 기반 세션
- [x] `lib/admin/session.ts` — 세션 config, requireAdminAuth(), getAllowedStoreId()
- [x] `POST /api/admin/auth/login` — 이메일+비밀번호 로그인
- [x] `POST /api/admin/auth/logout` — 로그아웃
- [x] `POST /api/admin/auth/setup` — 첫 계정 생성 (계정 없을 때만 동작)
- [x] `/admin/login` — 관리자 로그인 화면
- [x] `/admin/(auth)/layout.tsx` — 미로그인 시 /admin/login 리디렉트
- [x] `/admin/(auth)/events` — 이벤트 목록 (role별 접근 제어)
- [x] `/admin/(auth)/events/new` — 이벤트 등록 폼 (확률 실시간 자동계산, 합계 100% 보장)
- [x] `POST /api/admin/events` — 이벤트+경품티어 동시 저장, 중복 active 차단, status 자동 결정
- [x] `/admin/report`, `/admin/dashboard` → `/admin/(auth)/` 그룹으로 이동 (로그인 없이 접근 차단)

### 다음 세션 예정
- [x] **Supabase SQL 실행 완료**: `008_store_accounts.sql` + `007_payment_logs_and_store_settings.sql`
- [x] **첫 관리자 계정 생성 완료**: `123@daum.net` / super_admin (Vercel 환경변수 등록 + 로그인 확인)
- [x] **사용 메뉴얼 초안 작성**: `docs/ADMIN_MANUAL.md` (관리자·직원·에이전시용)

### 2026-08-12 오전 (8단계: 포인트 적립/리워드 시스템)
- [x] `docs/migrations/012_points_system.sql` — 5개 테이블 + RPC 2개 (Supabase SQL Editor 실행 필요)
  - `customer_loyalty` (store_id+kakao_user_id 복합PK, point_balance, visit_count)
  - `point_ledger` (earn/redeem 내역)
  - `loyalty_settings` (매장별 적립 정책)
  - `reward_catalog` (리워드 목록)
  - `rewards_issued` (발급된 리워드, status: issued/used/expired)
  - RPC `upsert_customer_loyalty` — 포인트 적립 + 방문횟수 원자 증가
  - RPC `redeem_points_atomic` — 포인트 교환 원자 처리 (이중 차감 방지)
- [x] `/api/games/play` 수정 — 게임 완료 시 포인트 자동 적립 (꽝 포함 무조건)
- [x] `GET /api/me/points` — 손님용 포인트 잔액 + 카탈로그 + 내역 조회
- [x] `POST /api/me/points/redeem` — 리워드 교환 (RPC 원자 처리)
- [x] `/me/points` — 손님용 포인트 웹뷰 (잔액, 교환하기, 내역)
- [x] `GET/POST /api/admin/loyalty-settings` — 포인트 정책 API
- [x] `/admin/loyalty-settings` — 관리자 포인트 정책 설정 화면
- [x] `GET/POST /api/admin/reward-catalog`, `PATCH /api/admin/reward-catalog/[id]` — 리워드 관리 API
- [x] `/admin/reward-catalog` — 관리자 리워드 등록/수정/활성화 화면
- [x] `GET /api/rewards/lookup`, `POST /api/rewards/use` — 계산대 리워드 조회/사용처리 API
- [x] `/staff` 화면 — 쿠폰/리워드 탭 전환 UI 추가

### 2026-08-12 (카카오 로그인 실연동 + 전화번호 암호화 + 알림톡 stub)
- [x] `/api/auth/kakao`, `/api/auth/kakao/callback` — 카카오 OAuth 서버사이드 흐름 구현, `mockLogin`을 실제 카카오 로그인으로 교체 (심사 대기 중엔 `NEXT_PUBLIC_KAKAO_REVIEW_PENDING=true`로 mock 폴백 유지)
- [x] `docs/migrations/017_phone_alimtalk.sql` — 전화번호 AES-256-CBC 암호화 저장 + 알림톡 발송 로그 테이블 추가 (`lib/crypto/phoneEncryption.ts`)
- [x] `lib/alimtalk/send.ts` — 알림톡 발송 stub 신설 (발송대행사 계약 전까지 `message_log`에 기록만)
- [x] `NEXT_PUBLIC_APP_URL` Vercel 환경변수 등록 + trim() 처리 버그 수정 (값에 개행 섞여 리다이렉트 깨지던 문제)

### 2026-08-13 (재방문 확장 8-1~8-7 전 단계 + 리워드 카탈로그 1차 확장)
- [x] `docs/migrations/018_message_consent.sql` — 메시지 발송 동의/빈도 규칙 5단계 체크
- [x] `docs/migrations/019_activity_log.sql` — `activity_log` 행동 이력(게임시작/완료/포인트적립/쿠폰사용/리워드교환) 기록 시스템
- [x] `docs/migrations/020_missions.sql` — `missions`/`mission_progress` 방문 미션 시스템
- [x] `docs/migrations/021_customer_segments.sql` — 고객 세그먼트 자동 분류 + 대시보드 분포 카드
- [x] `docs/migrations/022_churn_risk_alerts.sql` — `churn_risk_alerts` Win-back 3단계(이탈 위험 감지·알림) + 대시보드 섹션
- [x] `docs/migrations/023_reward_verification.sql`, `024_reward_catalog_extended.sql` — 리워드에 `requires_verification`(본인확인), `reward_type`/기간한정/이미지 등 확장 (계산대 본인확인 절차 추가)
- [x] `docs/migrations/025_signup_inquiries.sql` — 랜딩 → `/signup` 광고주 신청 페이지, 문의 접수 테이블
- [x] `docs/migrations/026_message_log_extended.sql`, `027_grant_delete_permissions.sql` — 쿠폰 만료 알림 중복방지 + `service_role` DELETE 권한 정비
- [x] `GET /api/cron/expiry-reminder` — 쿠폰 만료 D-7/D-3/D-1 Vercel Cron 알림
- [x] 카카오 MESSAGE/FRIEND API 심사 대응 — "나에게 보내기" + 친구목록 연동 + 심사 가이드 문서

### 2026-08-14~15 (손님 여정 개편: 게임 먼저 → 결과 잠금 → 로그인 순서로 전환)
- [x] **설계 변경**: 로그인부터 요구하던 기존 흐름을, "게임을 먼저 하고 결과는 잠긴 채로 보여준 뒤 카카오 로그인해야 결과·쿠폰이 풀리는" 구조로 전환 (`docs/손님여정_프로세스_v2.md` 신설, SSOT로 등록)
- [x] 카카오 로그인 권한 범위(scope)에서 반려된 `friends`를 제거해 로그인 실패 수정
- [x] 대시보드/리포트 API에 역할 기반 접근 제어 추가, 관리자 메뉴를 역할별로 분리 표시
- [x] 카카오 심사 대기 중에도 데모 시연 가능하도록 mock 결과 열람 경로 추가

### 2026-08-18~21 (손님 화면 프리미엄 디자인 개편 + 데모모드 + 모바일 최적화)
- [x] 손님 화면(게임 랜딩/진행/결과/쿠폰함) 전면 프리미엄 테마 개편 — 캐비닛 카드형 디자인, 매장명 명판(실측 좌표 오버레이), 쿠폰 티켓 디자인 통일, 버튼 애니메이션·컬러 정리 (다수 커밋, 8/18~8/21)
- [x] `DEMO_UNLIMITED_PLAY` 플래그 추가 — 데모 버전 전용 1일 1회 참여 제한 해제 옵션
- [x] `docs/migrations/028_universal_danggeun_verify.sql` — 전 경품 당근 확인 절차 통일 + 계산대 대기열 구조 도입
- [x] `docs/migrations/029_points_enabled.sql`, `030_store_profile_urls.sql` — 매장별 포인트 적립 온/오프 스위치, 당근/카카오채널 URL 저장
- [x] `docs/migrations/031_signup_self_registration.sql` — 회원가입 페이지를 문의 접수용에서 **실제 계정 생성**으로 전환
- [x] `docs/migrations/032_coupon_label.sql` — 실물 경품 당첨 시 금액 대신 실제 품목명(`label`) 표시
- [x] 손님용 게임 화면(`/play/[storeId]`)이 PC에서 열어도 모바일 해상도로 보이도록 반응형 고정 수정
- [x] 관리자: 월광고비 입력창 "0" 고정 버그 수정, 이벤트 온/오프 토글 문구 추가, 경품 티어 상품명/금액/전체수량 자유 수정 + 티어 추가/삭제 기능
- [x] 관리자: 광고주 임시 비밀번호를 "이메일 아이디+1234" 규칙으로 자동 생성하도록 변경, 비밀번호 재발급 500 에러 수정
- [x] 관리자 모드 모바일 반응형 최적화 + "모바일 우선 UI 체크리스트" 규칙 추가

### 2026-08-23 (광고주 관리자 모드 확장 v2 + 슈퍼관리자 모드 개편 v1)
- [x] `docs/migrations/033_subscriptions.sql` — `subscriptions`(이용기간/결제 이력) 테이블, 구독 상태 판정(`classifySubscription`) 로직
- [x] `docs/migrations/034_member_tracking_extended.sql` — 고객 최초방문/카카오최초로그인 시점 추적 컬럼 추가
- [x] `docs/migrations/035_challenge_frequency.sql` — 참여 제한을 "하루 1회" 하드코딩에서 매일/주간/월간/무제한으로 일반화
- [x] `docs/migrations/036_impersonation_log.sql` — 슈퍼관리자 **대리접속(Impersonation)** 메커니즘 + 감사 로그, `ImpersonationBanner`, 미들웨어 접근 제어
- [x] 슈퍼관리자 전용 글로벌 대시보드(`/admin/super/dashboard`), 업체 리스트/상세 탭 구조, 회사 목록 검색·필터링 추가
- [x] `docs/관리자_메뉴_구조_확정.md` 갱신 — 광고주/슈퍼관리자 메뉴 구조 최종 확정 (6개 고정 원칙 폐기, 기능 계속 추가 가능하도록 변경)

### 2026-08-24 (리워드 카탈로그 2차 개편 + DB 백업 안전망)
- [x] `docs/migrations/037_reward_catalog_discount_and_verification.sql` — `discount_amount`(할인금액) 컬럼 추가, `requires_verification=false`면 계산대 확인 단계 없이 즉시 지급되도록 `redeem_points_atomic`/`assign_checkout_queue` RPC 수정 (그동안 폼에 토글이 없어 사실상 항상 확인 필수였던 문제 해결)
- [x] 관리자 리워드 등록/수정 폼 개편 — 본인확인 체크박스, 유형별 조건부 필드(할인금액), 자연어 설명문구, 저장 전 유효성 검사, 리워드 클릭 시 수정 모달 신설
- [x] 손님용 리워드샵(`/me/points`) 이미지 카드형 개편 — 포인트 부족 시 프로그레스바, 본인확인 필요 리워드 배지 표시
- [x] `docs/migrations/038_cleanup_reward_catalog_test_data.sql` — 테스트 더미 리워드 정리
- [x] `scripts/backup-db.mjs` 신설 — `pg_dump` 미설치 환경(Windows 포함)에서도 동작하는 Node 기반 DB 데이터 백업 스크립트, `backups/`를 `.gitignore`에 추가
- [x] `docs/migrations/README.md`에 "왜 Supabase 대시보드에 No migrations로 뜨는가" 설명 추가 — CLI를 쓴 적이 없어 대시보드 마이그레이션 추적 테이블이 비어있는 것이 원인(정상 상태)임을 문서화
- [x] **문서 정비**: 8/13~8/24(013~038번 마이그레이션) 작업이 이 진행 로그에 누락되어 있던 것을 발견 — 이 구간을 소급 정리해 기록 (재발 방지: 세션 종료 체크리스트의 "진행 로그 기록" 항목을 앞으로 다시 챙길 것)
- [x] `NEXT_PUBLIC_KAKAO_REVIEW_PENDING`/`DEMO_UNLIMITED_PLAY` Vercel Production 환경변수 점검 — 둘 다 Production에 `true`로 남아있던 것을 발견, `false`로 변경 + Production 스코프 제거(Preview만 유지) 후 재배포
- [x] **버그 발견/수정**: 위 재배포로 실제 카카오 로그인이 프로덕션에서 처음 실행되면서 `KOE006`(리다이렉트 URI 미등록) 에러 발생 — 원인은 `lib/auth/kakao.ts`가 `client_id`로 JavaScript 키를 사용하고 있었는데 리다이렉트 URI는 REST API 키 쪽에 등록되어 있어 불일치했던 것. `KAKAO_REST_API_KEY`를 client_id로 사용하도록 수정
- [x] Supabase `db.*.supabase.co` 직접 연결이 IPv6 전용으로 바뀌어 있어 `scripts/backup-db.mjs` 실행이 안 되던 문제 발견 — Session Pooler(IPv4) 연결 문자열로 `DATABASE_URL` 교체하여 해결, 비밀번호에 남아있던 불필요한 대괄호 표기도 정리
- [x] `KAKAO_CLIENT_SECRET` 미설정으로 발생하던 `KOE010`(invalid_client) 수정 — 카카오 개발자센터에서 발급 후 `.env.local`/Vercel에 등록, 재배포 후 실제 카카오 계정으로 로그인·당첨 결과 확인·쿠폰 알림톡(나에게 보내기) 자동 발송까지 정상 동작 최초 확인
- [x] **버그 발견/수정**: 손님 세션(`pendingPlay`/`revealedPlay`)이 브라우저 쿠키 단위 전역 슬롯이라, 로그인 완료 전에 서로 다른 매장의 게임 페이지를 넘나들면 나중 매장의 결과로 앞 매장의 대기 결과가 덮어써지는 문제 발견 — 실제로 `aschip`(촌놈칩스)에서 플레이 직후 `chj-001`(판타스틱필름) 결과가 대신 확정되어, `aschip` 기준 "내 쿠폰함"에 쿠폰이 안 보이는 현상으로 나타남. `/api/games/pending`, `/api/games/claim`에 `store_id` 일치 검증을 추가해 다른 매장 결과가 섞이면 "대기 결과 없음"으로 안전하게 처리하도록 수정
- [x] `AlreadyParticipatedScreen`(이미 참여하셨어요 화면)에 남아있던 QA용 "다른 계정으로 테스트" 버튼 제거 — 실제 손님 화면에는 노출하지 않음
- [x] **버그 발견/수정**: 이벤트 등록 폼의 "쿠폰 사용 기간 > 고정 날짜" 옵션이 `coupon_validity_value`를 `"시작일~종료일"` 범위 문자열로 저장하는데, `computeValidUntil()`은 이를 단일 날짜로 가정해 `Invalid Date` 예외가 발생 — 이 예외가 조용히 무시되면서 당첨은 정상 처리되지만 쿠폰만 생성 안 되는 상태로 남음(`aschip`, `arc` 이벤트 실제 영향 확인). `computeValidUntil`이 `~` 포함 문자열이면 종료일만 추출하도록 수정 + 회귀 테스트 2건 추가

### 2026-08-25 (보안 대응 + 리워드 이미지 업로드 + 이미지 최적화)
- [x] `docs/migrations/039_enable_rls_all_tables.sql` — Supabase 보안 어드바이저 경고 대응, `signup_inquiries` 제외 24개 테이블 전체 RLS 재활성화(정책 없이 service_role만 접근, 기능 영향 없음)
- [x] `docs/migrations/040_reward_images_storage_bucket.sql` — 리워드 이미지를 URL 입력 대신 실제 파일 업로드로 전환 (Storage 버킷, 5MB 제한)
- [x] 게임 런타임 이미지 12개 PNG→WebP 변환(13.7MB→0.6MB, 90%+ 절감) + 랜딩 진입 시점 프리로드 추가

### 2026-08-25~26 (리워드 교환 구조 통합 + 포인트/재고 차감 시점 이동 + 업체 하드 삭제)
- [x] `docs/migrations/041_reward_redemption_coupons_integration.sql` — 리워드 교환을 별도 `rewards_issued` 테이블 대신 `coupons` 테이블로 통합해, 게임 당첨 쿠폰과 완전히 동일한 코드 확인 화면·계산대 흐름을 재사용
- [x] `docs/migrations/042_remove_usage_threshold_gate.sql` — 리워드 교환 최소잔액(usage_threshold) 게이트 완전 제거 (리워드 가격만으로 교환 가능 여부 판단)
- [x] `docs/migrations/043_defer_point_deduction_to_confirm.sql` — 포인트/재고 차감 시점을 "교환하기" 클릭 순간 → "사장님 확인"(실사용 확정) 순간으로 이동, `confirm_coupon_used_atomic` 신규 RPC
- [x] `docs/migrations/044_delete_store_completely.sql`, `045_fix_delete_store_completely_permission.sql` — 슈퍼관리자용 업체 완전 삭제(Hard Delete) 기능, `SECURITY DEFINER` 권한 오류 수정

### 2026-08-27~29 (랜딩페이지 v5 전면 리뉴얼)
- [x] 신규 랜딩(`components/landing-v5/`) 대대적 개편 — 히어로, "실제 접점"(QR/쿠폰함/카톡알림) 섹션, 문제제기/포지셔닝 비대칭 레이아웃, 당근 연동 섹션, FAQ 14문항, 요금제(베이직+AEO마케팅 2카드), 관리자 미리보기 모달, 클라이언트 도입사례 섹션 등 다수 커밋
- [x] "Before/After 드래그 비교" 섹션을 "성장 엔진" 섹션(회차별 플로우 카드, 패널 프레임 배경)으로 교체
- [x] `docs/migrations/046_signup_inquiries_source.sql` — 요금제 리드 소스 구분(베이직 신청 경로 추적)
- [x] `docs/migrations/047_aeo_waitlist.sql` — "AEO마케팅" 카드 출시 알림 대기자 전용 테이블
- [x] 성과 리포트(`/admin/report`)를 월광고비/ROI 퍼널 방식에서 **객단가 기반 스토리텔링형 리포트**로 전면 개편 — 헤드라인(구독료 대비 배수)/활동퍼널(MoM 증감)/단골전환스토리/당근단골자산가치/성장궤적(3개월 예측)/인기 시간대 6개 섹션. "월 광고비"/"ROI" 카드는 삭제(DB 컬럼은 유지), "평균 결제금액(객단가)" 입력 필드를 포인트 정책 화면에 추가

### 2026-08-31 (경품 티어 확률 직접입력 + 카카오톡 메시지 버튼 추가)
- [x] `docs/migrations/048_prize_tier_probability_mode.sql` — 경품 티어를 "수량 기반 자동계산" 외에 "확률(%) 직접입력" 모드로도 설정 가능하도록 확장 (이벤트별 `prize_tier_mode` 선택)
- [x] 쿠폰 발급 카카오톡(나에게 보내기) 메시지에 "당근마켓 후기 남기고 쿠폰받기" 버튼 추가
- [x] **버그 발견/수정**: 위 버튼에 당근(`daangn.com`) 링크를 직접 연결하면 카카오 API가 메시지 발송 자체를 전체 실패시키는 문제 발견 — 자체 도메인 경유 리다이렉트로 우회

### 2026-09-01 (슈퍼관리자 구독관리 + 도메인/랜딩 구조 정리 + NFC 방문적립 신규)
- [x] "월 광고비" 용어를 코드/화면 전체에서 "월 구독료"로 통일, 슈퍼관리자 대시보드에 KPI 6종(업체 가입추이/전체 회원수/당근 클릭수/리워드 유형별 비율/쿠폰 사용률/평균 재방문율) 추가
- [x] `docs/migrations/049_subscription_payment_fields.sql` — `subscriptions`에 `payment_date`/`payment_status`(paid/unpaid/overdue) 추가, 신규 메뉴 "업체 구독관리"(검색·필터, 입금확인 처리, CSV 다운로드)
- [x] **랜딩 URL 구조 정리** — 구 랜딩(`/landing`) 삭제, 신규 랜딩(`landing-v5`)을 루트(`/`)로 승격, `/landing-v5`는 `/`로 영구 리다이렉트 유지 (북마크 호환)
- [x] 랜딩 헤더를 가로 메뉴에서 **햄버거 + 오른쪽 슬라이드 패널**로 재구성 (로그인/회원가입/서비스/프로세스/요금제/AEO 홈페이지 제작/상담신청 CTA), `/aeo` 자리표시 페이지 신설
- [x] `next.config.ts`에 Vercel 기본 도메인(`roulette-marketing.vercel.app`) → 정식 도메인(`www.dgting.co.kr`) 영구 리다이렉트 추가 — 카카오 로그인 리다이렉트/NFC 체크인 URL 등 "현재 접속 origin"을 그대로 쓰는 모든 화면이 자동으로 정식 도메인 기준으로 동작하게 됨
- [x] `/signup` 회원가입 페이지의 예전 스타일 헤더를 새 랜딩 헤더(`Navbar`)로 교체, `Navbar`의 섹션 앵커 링크를 홈 기준 절대경로(`/#service` 등)로 수정해 다른 페이지에서도 정상 재사용되도록 개선
- [x] **NFC 방문 적립 기능 신규 추가** (`docs/migrations/050_nfc_checkin.sql`) — 매장에 놓은 NFC 태그를 손님이 태그하면 `/checkin/{storeId}`로 접속되어 자동으로 포인트 적립 또는 스탬프 적립(목표 도달 시 `reward_catalog` 리워드를 쿠폰으로 자동 발급)이 되는 기능. 게임/포인트샵 로직과 완전히 분리된 별도 경로이며 손대지 않음. `process_nfc_checkin` RPC로 "하루 1회 제한 + 적립/발급"을 한 트랜잭션에서 원자적으로 처리(동시 태그 시 이중 발급 방지). 관리자 "포인트 정책" 화면에서 사용여부/모드(포인트·스탬프)/리워드 선택/체크인 URL 복사 지원

### 2026-09-01 (2차: 매장 고정 QR코드 생성/다운로드 + 남아있던 vercel.app 기본값 정리)
- [x] `qrcode` 라이브러리 도입, `GET /api/admin/store-qr?format=png|svg` — 매장 고정 QR을 즉석 생성해서 반환(DB 저장 없음, `storeId`만으로 매번 결정적으로 생성). 세션 기반으로 자기 매장만 생성 가능(advertiser 고정, staff 차단, super_admin/agency는 대리접속/조회 storeId 기준)
- [x] `/admin/events` 화면 상단에 `StoreQrCard` 추가 — QR 미리보기, PNG(960px)/SVG(인쇄용) 다운로드 버튼 2개, 복사 가능한 URL 텍스트, "QR 밑에 이 주소를 같이 인쇄하세요" 안내. 에러정정 최고단계(H) 적용(코팅지 반사광 대비)
- [x] **버그 발견/수정**: 카카오 "나에게 보내기" 쿠폰 메시지(`lib/kakao/meMessage.ts`)가 `NEXT_PUBLIC_APP_URL` 환경변수 미설정 시 폴백하는 기본값이 여전히 `roulette-marketing.vercel.app`으로 남아있던 것을 발견 — `.env.example` 기본값, `lib/kakao/meMessage.ts`, `app/review-guide/page.tsx`(카카오 심사관용 가이드), `scripts/test-reward-filter.mjs`의 폴백/하드코딩 값을 모두 `https://www.dgting.co.kr`로 정리. **Vercel 프로덕션 `NEXT_PUBLIC_APP_URL` 환경변수의 실제 값이 무엇인지는 아직 확인 못 함 — 다음 세션에서 반드시 확인할 것 (아래 "배포 전 반드시 확인할 것" 참고)**

### 2026-09-02 (매장 공개 홈페이지 신규 + SEO 기반 신설)
- [x] **매장 공개 홈페이지(`/b/{storeId}`) 신규 추가** (`docs/migrations/051_business_page.sql`) — 홈페이지 없는 매장에 정식 소개 페이지를 자동 생성. `store_id`를 그대로 slug로 재사용(별도 slug 컬럼 없음), 주소/전화는 `store_contracts`를 그대로 재사용(중복 저장 안 함). 신규 `business_entity`(1:1, `homepage_enabled` 기본 true·`online_play_enabled` 기본 false)/`business_media`/`business_faq`/`business_external_links` 테이블. 무료/유료 차이는 순수 "누가 콘텐츠를 입력하느냐"일 뿐, DB에 기능 게이팅 없음
- [x] 히어로(로고/커버/소개), 신뢰지표(이번 달 참여자수·재방문율, 10명 미만이면 자동 숨김), 진행중 이벤트/리워드 미리보기(`/api/events/active`와 동일하게 확률·재고는 절대 노출 안 함), 매장 사진, 리뷰 링크(네이버/구글), 매장 정보(주소·영업시간·연락처·당근·카카오채널·인스타 등 외부링크), FAQ 섹션 구현. `LocalBusiness` JSON-LD 구조화데이터 + 동적 OG 메타태그 포함
- [x] 관리자 신규 메뉴 "매장 홈페이지"(`/admin/business-page`) — 노출 온오프, 온라인 게임 참여 허용 온오프, 소개글/영업시간/업종, 로고·커버·매장사진 업로드(`business-images` Storage 버킷 신규), 리뷰링크·외부링크·FAQ 관리
- [x] `entry_source`(`qr_instore`\|`online_page`) 통계 컬럼을 `activity_log`에 추가하고 `PlayFlow→GameContainer→PlayScreen→/api/games/play→persistPlayResult` 전체 경로에 배선 — 매장 홈페이지에서 원격 참여한 경우(`?source=online`)를 구분 집계할 수 있게 함. **경품 확률/재고 분기에는 절대 사용하지 않음**(URL 파라미터라 조작 가능하므로 통계 전용)
- [x] 쿠폰함(`/me/points`) 상단에 "매장 홈페이지 →" 바로가기 추가
- [x] `app/sitemap.ts`/`app/robots.ts` 신규 생성 — `/b/{storeId}`만 검색엔진에 노출(`homepage_enabled=false`인 매장은 사이트맵에서 자동 제외), 나머지 개인화/인증 영역은 전부 차단

### 2026-09-02 (2차: 매장 공개 홈페이지 확장 — 업종별 라벨, 대표상품, 오늘/이번달 토글, 매장 자랑)
- [x] GPT가 작성한 "업체 공개 홈페이지 — 최종 통합본" 지시문 검토 후, 기존 결정과 충돌하는 부분(온라인 게임 참여 기본값/소유권, `slug` 별도 컬럼, "당근 소식" 자동발행 전제)은 반영하지 않고 기존 구조 유지 — 사장님 확인 완료. "당근 소식" 섹션은 원본 기능 자체가 없어 이번 범위에서 제외, `docs/v2_로드맵/매장홈페이지_당근소식섹션.md`에 정리
- [x] `docs/migrations/052_business_page_v2.sql` — `business_entity`에 `business_type`(업종)/`parking_info`(주차)/`pet_friendly`(반려동물)/`store_pride_points`(매장 자랑) 추가, 신규 `business_products`(대표 상품/메뉴/서비스, 3~6개 제한은 앱 레벨 검증) 테이블
- [x] `lib/business-page/businessTypeLabels.ts` — 업종별 라벨 매핑(식당→"대표 메뉴", 카페→"인기 메뉴", 미용→"대표 시술", 체육→"대표 프로그램", 학원/서비스→"주요 서비스")을 공개페이지와 관리자 입력폼 양쪽에서 재사용. 업종 늘어나도 매핑만 추가하면 됨(스위치문 없음)
- [x] "오늘·이번달, 우리 매장" 섹션 신규(`LiveStatsToggle.tsx`) — 참여자 수/재방문율/지급된 혜택 수를 오늘·이번달 두 기간 모두 서버에서 한 번에 계산해 내려주고, 클라이언트에서는 추가 API 호출 없이 토글만 전환. "이번 달" 참여자 수가 10명 미만이면 토글 자체를 숨김(텅 빈 숫자 노출 방지 원칙 유지)
- [x] "지금 받을 수 있는 혜택" 섹션 신규 — 게임/쿠폰/리워드 3분류 카드로 "지금 진행중인 이벤트"(실데이터)와 역할 분리(이쪽은 마케팅 설명용, 그쪽은 실제 라이브 데이터). 히어로/이 섹션/오늘·이번달 섹션 끝, 총 3곳에 동일 게임 URL로 연결되는 CTA 배치
- [x] 관리자 화면(`/admin/business-page`)에 업종 선택, 주차정보, 반려동물 토글, "우리 매장의 자랑"(최대 4개), "대표 상품/메뉴/서비스"(최대 6개, 개별 사진 업로드) 입력 섹션 추가
- [x] 공개페이지(`/b/{storeId}`) 섹션 순서를 최종본 기준으로 재정렬: 히어로 → 오늘·이번달 → 지금 받을 수 있는 혜택 → 진행중인 이벤트 → 대표 상품/메뉴/서비스 → 매장 사진 → 리뷰 → 매장 정보(주차/반려동물 포함) → 우리 매장의 자랑 → FAQ
- [x] 실제 `aschip` 매장으로 로컬 빌드+응답 검증 완료 (활성 리워드 수 등 실데이터 정상 반영 확인)

### 2026-09-02 (3차: 영업 시연용 샘플 매장 10곳 — Phase 0/1)
- [x] GPT가 작성한 "마케팅용 샘플 업체 10곳" 지시문 검토 — "stores 테이블"은 실제로는 `store_contracts`, "성과리포트 is_demo 제외"는 이미 매장 1개 단위 조회라 불필요, 업종 목록 앞뒤 불일치, 리워드 역산 기준(방문당 포인트)·로그인계정 생성·"샘플 레퍼런스" 메뉴 신설 등 지시문에 빠진 부분을 짚어서 확인받음
- [x] **Phase 0: 데이터 격리 인프라** (`053_demo_store_isolation.sql`) — `store_contracts.is_demo`(기본 false) 추가. 슈퍼관리자 대시보드(9개 쿼리 개별 수정)·구독관리 리스트 집계에서 제외, 업체 리스트 "샘플" 필터 탭 신규(기본/다른 탭에서는 항상 숨김), 알림톡·카카오 발송 함수 진입부에 이중 방어코드, `sitemap.ts` 제외 + `/b/{slug}` `noindex` 메타태그 자동 삽입. 데모 매장 0건 상태에서 기존 집계 불변 확인 완료
- [x] **매장 홈페이지 히어로 커스터마이징** (`054_business_entity_hero_copy.sql`) — 지시문의 "홈페이지 메인 카피"/"게임 CTA 문구"를 저장할 필드가 기존 스키마에 없어서(있던 건 `description` 한 줄뿐, 게임 버튼 문구는 코드에 고정 텍스트) `business_entity.tagline`/`game_cta_label` 신규 추가. 비어있으면 기존과 동일하게 동작(하위 호환), 관리자 화면·공개페이지·API 전부 반영
- [x] **Phase 1: 샘플 매장 10곳 콘텐츠 생성** (`scripts/seed-demo-stores.mjs`) — 음식점/카페/미용실/네일샵/헬스장/에스테틱/베이커리/세차/키즈카페/펫살롱. 업종 매핑은 6종 라벨만 있어 베이커리→카페, 나머지 5개(네일샵/에스테틱/세차/키즈카페/펫살롱)는 "주요 서비스"로 통일(사장님 확인). 매장마다 로그인계정·1년 이용기간·포인트정책(1회=100p)·즉시쿠폰 3개+꽝(percent 모드+수량 무제한이라 재고 소진 없음)·장기 리워드 2개(방문 N회치 역산)·대표상품 4개·홈페이지 콘텐츠 자동 생성. 재실행하면 기존 데이터를 지우고 다시 만듦(멱등). 실제 페이지 응답(200, noindex, 커스텀 카피/CTA 반영) 검증 완료
- [ ] **Phase 2 예정**: 가상 활동데이터(가짜 손님/방문/쿠폰발급/세그먼트) — 기간은 사장님 요청으로 8~12주→3~8주로 축소. `upsert_customer_loyalty` RPC가 `now()` 고정이라 과거 날짜 시뮬레이션에 못 써서 별도 스크립트로 `customer_loyalty`/`activity_log`/`point_ledger`/`coupons`를 직접 계산해 채우는 방식으로 설계 필요. 슈퍼관리자 "샘플 레퍼런스"(재생성 버튼) 메뉴도 미착수

### 다음 예정
- [ ] 매장 공개 홈페이지 실제 광고주 입력 테스트 (사진 업로드/FAQ/리뷰링크/업종별 대표상품/매장자랑 등 실사용 확인)
- [ ] 매장 소식 섹션 — 자체 게시판 신설 여부 검토 (`docs/v2_로드맵/매장홈페이지_당근소식섹션.md` 참고)
- [ ] 만료 배치 (쿠폰 valid_until 지난 것 expired로 갱신 — 현재는 조회 시점 판정으로 안전하게 대체 중)
- [ ] 알림톡(비즈메시지) 발송대행사 실연동 (`lib/alimtalk/send.ts` 여전히 stub — 카카오 "나에게 보내기"(`lib/kakao/meMessage.ts`)와는 별개 트랙)
- [ ] 당근 비즈프로필 실제 연동 (현재 화면 안내/링크만, 클릭 로그는 `daangn_click` activity_log로 집계만 되고 딥링크 자동 연결은 미구현)
- [ ] Supabase Pro 업그레이드 + 자동 일일 백업(PITR) 전환 — 진행 여부 재확인 필요 (`ADMIN_FEATURES.md` 참고)
- [ ] NFC 방문적립 실제 태그로 현장 테스트 (하루1회 제한/포인트·스탬프 각 모드/계산대 스캔 확인 — `docs/migrations/050_nfc_checkin.sql` 상단 체크리스트 참고)
- [ ] 카카오 앱을 `www.dgting.co.kr` 전용으로 새로 만들 경우, 콜백 URL(`https://www.dgting.co.kr/api/auth/kakao/callback`) 재등록 + 신규 키값(`KAKAO_REST_API_KEY`/`KAKAO_CLIENT_SECRET`/`NEXT_PUBLIC_KAKAO_JS_KEY`) `.env.local`/Vercel 갱신

---

## 배포 전 반드시 확인할 것

임시로 처리하고 넘어간 것 / 미완성 상태로 남아있는 것. 실제 서비스 오픈 전에 아래를 전부 해소해야 한다.

- [x] **카카오 로그인 실연동 완료** — `NEXT_PUBLIC_KAKAO_JS_KEY` 설정 완료. `/api/auth/kakao` OAuth 서버사이드 흐름 구현, 전화번호 암호화 저장(AES-256-CBC), iron-session 고객 세션 쿠키 적용. Mock 로그인은 키 미설정 시 개발 폴백으로만 유지
- [x] **`/staff` 계산대 화면 인증 추가 완료** — `store_accounts`/`iron-session` 관리자 로그인 도입(6단계) 이후 `/staff`는 `staff`/`advertiser` 역할 로그인이 필수. 누구나 URL로 접근 가능하던 문제는 해소됨
- [x] **관리자 CRUD 화면 구현 완료** — 이벤트 등록/수정, 회원 관리, 쿠폰 관리, 포인트 정책, 리워드 관리, 성과 리포트, 슈퍼관리자 업체·구독 관리까지 전부 화면으로 구현됨 (`docs/관리자_메뉴_구조_확정.md` 참고)
- [x] **`store_settings` 관리자 편집 UI 구현 완료** — `average_order_value`(객단가), NFC 설정 등 전부 `/admin/loyalty-settings` 화면에서 입력 가능. `월 광고비` 컬럼은 화면에서 제거(DB 컬럼만 유지)하고 "월 구독료" 개념으로 대체됨
- [ ] **알림톡(비즈메시지) 발송대행사 가입 및 실제 발송 연동 필요** — 현재 `lib/alimtalk/send.ts`는 `message_log` 테이블에 기록만 하는 stub 상태 (쿠폰 발급 시 카카오 "나에게 보내기"(`lib/kakao/meMessage.ts`)는 별도로 실제 발송되고 있음, 혼동 주의). 대행사(비즈뿌리오, 알리고, 솔라피 등) 가입 후 Sender Key 발급 → `.env.local`에 `KAKAO_ALIMTALK_SENDER_KEY` 입력 → `sendAlimtalk()` 내부 주석 해제 후 대행사 API 호출 코드 추가
- [ ] **카카오 비즈앱 전환 및 전화번호 동의항목 심사** — 개인사업자/법인 사업자 기준으로 카카오 비즈앱 전환 신청 후, 카카오 개발자 센터에서 "전화번호" 동의항목 심사 신청 필요. 심사 전에는 `phone_number`가 null로 내려와 전화번호 저장이 생략됨 (로그인 자체는 정상 동작)
- [ ] **카카오 앱을 `www.dgting.co.kr` 전용으로 신규 생성 시 콜백 URL 재등록 필요** — 리다이렉트 URI는 `req.nextUrl.origin` 기준으로 동적 생성되므로, 카카오 개발자센터에 `https://www.dgting.co.kr/api/auth/kakao/callback` 패턴을 등록하면 됨. 새 앱 생성 시 `KAKAO_REST_API_KEY`/`KAKAO_CLIENT_SECRET`/`NEXT_PUBLIC_KAKAO_JS_KEY`를 `.env.local`/Vercel에 갱신할 것
- [ ] **개인정보처리방침 업데이트** — "전화번호 수집·이용 목적(카카오 쿠폰 알림 발송)" 항목 추가 필요. 수집 근거, 보유 기간, 제3자 제공 여부(대행사 전달 포함) 명시 필요
- [ ] **쿠폰 만료 배치 미구현** — `valid_until`이 지난 쿠폰의 `status`가 실제로 `expired`로 바뀌지 않고, 조회 시점에 `lib/coupons/getEffectiveStatus.ts`가 판정해서 보여줌 (DB에는 계속 `issued`/`pending_verify` 등으로 남음). 규모가 커지면 배치를 추가하되, 그래도 조회 시점 판정 로직은 안전망으로 유지하는 게 안전
- [ ] **당근 단골 추가 실제 딥링크 연동 없음** — 화면·쿠폰 코드 표시 + 당근 URL 링크(`daangn_url`) 안내는 되어있으나, 실제 당근 비즈프로필 자동 딥링크 연결은 미구현. 클릭 자체는 `activity_log`(`daangn_click`)로 집계됨
- [ ] **동시 접속자 방어(트랜잭션 락) 없음** — `/api/games/play`의 재고 차감이 단순 조회→차감 흐름 (로컬 소규모 사용자 기준으로 의도적 생략, `docs/당근인형뽑기_게임설계도.md` 4.3절 참고). 단, `redeem_points_atomic`/`process_nfc_checkin` 등 포인트·쿠폰 발급 관련 RPC는 원자적 트랜잭션으로 처리됨
- [ ] **테스트 이벤트 데이터가 일부 하드코딩** — 초기 `test-store-001`/`test-event-001` 기준 시드 데이터가 남아있음, 실제 매장은 정상 온보딩(회원가입) 플로우로 생성됨
- [ ] **NFC 방문적립 실제 태그 현장 테스트 미완료** — 코드/마이그레이션은 배포됐으나, 실제 NFC 태그로 직접 태그해서 하루1회 제한·포인트/스탬프 각 모드·계산대 스캔까지 확인하는 실사용 테스트는 아직 안 함
- [ ] **Vercel 프로덕션 `NEXT_PUBLIC_APP_URL` 환경변수 값 확인 필요** — 로컬 CLI가 이 프로젝트에 연결되어 있지 않아 실제 값을 확인하지 못함. `https://www.dgting.co.kr`로 설정되어 있는지 Vercel 대시보드에서 직접 확인할 것. 아니라면 카카오 쿠폰 발급 메시지 링크와 매장 QR코드가 옛 도메인을 가리키게 됨(코드 쪽 폴백 기본값은 이미 정리 완료)
- [ ] **매장 고정 QR코드 실제 인쇄 스캔 테스트 미완료** — 코드는 배포됐으나, 실제 프린터로 인쇄해서 폰 카메라로 스캔했을 때 에러정정 H단계가 코팅지 반사광/오염 환경에서도 잘 읽히는지는 아직 확인 안 함
- [ ] **Supabase Pro 업그레이드 + 자동 일일 백업(PITR) 전환** — 진행 여부 최종 확인 필요 (`ADMIN_FEATURES.md` "다음 작업 추천 순서" 1번 참고)

---

## 문서 지도 (설계서)

코드를 수정하기 전에 아래 문서를 먼저 확인한다. **현재 SSOT는 한글 설계도 문서들이다** (01~04 번호 문서는 프로젝트 초창기 룰렛/스크래치카드 기획안으로, 현재 구현과 맞지 않아 `docs/_archive/`로 옮겨두었다).

| 문서 | 내용 |
|---|---|
| [`docs/당근인형뽑기_게임설계도.md`](./docs/당근인형뽑기_게임설계도.md) | **게임/쿠폰/포인트 로직의 단일 진실 소스(SSOT).** 확률/재고 로직(3~4절), 쿠폰 발급·검증(6절), 관리자 화면(8절), 데이터 모델(9절), 포인트 시스템(13절), 빌드 순서·API 명세(14절). 지시문에서 "O절 참고"라고 하면 이 문서를 본다. **v2.1부터 실제 구현(수량 기반 확률 자동계산)과 동기화됨 — 구현이 문서와 달라지면 이 파일도 같이 업데이트할 것** |
| [`docs/당근인형뽑기_재방문확장설계도_v2.1.md`](./docs/당근인형뽑기_재방문확장설계도_v2.1.md) | 게임설계도 위에 얹는 재방문 성장 시스템 확장 (미션, 세그먼트, 이탈 감지, 리워드 카탈로그, 메시지 동의) |
| [`docs/손님여정_프로세스_v2.md`](./docs/손님여정_프로세스_v2.md) | **손님 화면 흐름의 정본.** 게임 먼저→결과 잠금→로그인 해제 순서, iron-session 필드, 라우트·API 매핑 |
| [`docs/화면별_텍스트_스냅샷.md`](./docs/화면별_텍스트_스냅샷.md) | 손님 화면에 실제로 노출되는 문구 스냅샷 (`PlayFlow.tsx` 기준) |
| [`docs/관리자_메뉴_구조_확정.md`](./docs/관리자_메뉴_구조_확정.md) | 역할별 관리자 메뉴 구조·권한 원칙 (광고주/슈퍼·에이전시) |
| [`docs/ADMIN_MANUAL.md`](./docs/ADMIN_MANUAL.md) | 관리자·직원용 실사용 메뉴얼 (로그인, 이벤트, 리포트, 계산대) |
| [`docs/dangolting_landing_v5_cursor_spec.md`](./docs/dangolting_landing_v5_cursor_spec.md) | 신규 랜딩페이지(landing-v5, 현재 루트 `/`) 카피·섹션·디자인 원본 지시문 |
| [`docs/SEO_AEO_GEO_세팅_지시서_v1.md`](./docs/SEO_AEO_GEO_세팅_지시서_v1.md) | SEO/AEO/GEO(생성형 검색 노출) 세팅 지시서 |
| [`docs/특허_회피구조_설명.md`](./docs/특허_회피구조_설명.md) | 특허 회피 설계 원칙 — "게임 실행이 채널 구독과 무관해야 함" 등 고정 원칙의 근거 |
| [`docs/v2_로드맵/전국응모시스템.md`](./docs/v2_로드맵/전국응모시스템.md) | v2 로드맵 — 전국 단위 응모 시스템 구상안 (미착수) |
| [`docs/v2_로드맵/NFC_QR_직원수동적립.md`](./docs/v2_로드맵/NFC_QR_직원수동적립.md) | v2 로드맵 — NFC/QR 둘 다 안 될 때 직원이 손님 QR 스캔으로 수동 적립하는 최후 보완 수단 (미착수, 직원 계정 방식 결정 보류) |
| [`docs/migrations/`](./docs/migrations/) | Supabase 대시보드에서 실행한 DB 변경사항 기록 (Git에 안 남는 부분 추적용, **새 세션 시작 시 필수 확인**, 최신 번호는 `050_nfc_checkin.sql`) |
| [`ADMIN_FEATURES.md`](./ADMIN_FEATURES.md) | 관리자 모드 관련 결정사항·진행상황 추적 (완료/보류/미시작 구분) |
| [`DESIGN.md`](./DESIGN.md) | 컬러 토큰, 타이포그래피, 레이아웃 원칙, 컴그래픽 요소 |
| [`docs/_archive/`](./docs/_archive/) | 초창기 기획안(01~04 번호 문서) 보관함 — 현재 구현과 불일치하니 참고용으로만 열람 |

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
  page.tsx            루트(/) — landing-v5를 직접 렌더 (구 랜딩 /landing은 삭제됨)
  /(customer)         손님 게임 플로우
    /game-demo        게임 프로토타입
    /play/[storeId]   실서비스 게임 참여 프로세스
    /checkin/[storeId] NFC 방문 적립 체크인 화면
  /(mockup)           랜딩/약관/개인정보/데모 등 홍보용 정적 페이지 (landing-v5 포함, /landing-v5는 /로 리다이렉트만 함)
  /me                 손님용 포인트/쿠폰 웹뷰 (/me/points 등)
  /staff              계산대 검증 화면 (staff/advertiser 로그인 필요)
  /signup             광고주 회원가입
  /aeo                AEO 홈페이지 제작 자리표시 페이지
  /admin/(auth)       광고주·슈퍼관리자·에이전시 공용 관리자 영역 (역할별 메뉴 분기, docs/관리자_메뉴_구조_확정.md 참고)
    /super/dashboard      슈퍼관리자 전체 대시보드
    /super/subscriptions  업체 구독관리 (신규)
    /companies            업체 리스트/상세 (대리접속 진입점)
    /loyalty-settings     포인트 정책 (NFC 설정 포함)
    /report               성과 리포트 (객단가 기반 스토리텔링형)
  /api                서버 API 라우트 (게임/쿠폰/포인트/관리자/카카오OAuth/NFC체크인 등)

/components
  /game               게임 컴포넌트 (StartScreen/PlayScreen/ResultScreen/StampBoard 등)
  /landing-v5         현재 루트 랜딩페이지 전용 컴포넌트 (Navbar 등, landing-v5.css로 스코프)

/lib
  /game-engine        확률/재고/쿠폰유효기간 순수 함수
  /auth               카카오 OAuth, mockLogin, 세션
  /admin              관리자 세션, 권한, 구독 상태 판정
  /alimtalk           알림톡 발송 유틸 (stub, 위 "배포 전 확인" 참고)
  /kakao              카카오 "나에게 보내기" 메시지 발송
  /coupons            쿠폰 유효 상태 판정
/docs                 설계서 원본 (↑ "문서 지도" 참고)
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

## 카카오 연동 현황 (2026-08-12 실연동 완료)

카카오 로그인은 **실제 OAuth로 연동 완료**된 상태다 (`lib/auth/kakao.ts`, `/api/auth/kakao`, `/api/auth/kakao/callback`). 초창기엔 mockLogin으로 대체하던 보류 상태였으나 8단계에서 교체되었다.

| 항목 | 상태 | 파일 |
|---|---|---|
| 카카오 로그인 (OAuth) | **연동 완료** | `lib/auth/kakao.ts` |
| 전화번호 수집(동의항목) | **비즈앱 전환 + 심사 대기** — 심사 전엔 `phone_number`가 null로 내려와 저장 생략 (로그인 자체는 정상) | `lib/auth/kakao.ts` |
| 카카오 채널 친구추가 CTA | 연동 완료 (`NEXT_PUBLIC_ADVERTISER_KAKAO_URL`) | `PlayFlow.tsx` |
| 카카오 "나에게 보내기" (쿠폰 발급 알림) | **연동 완료** — 쿠폰 발급 시 실제 발송됨. "당근마켓 후기 남기고 쿠폰받기" 버튼 포함(당근 링크는 직접 넣지 않고 자체 도메인 경유 리다이렉트 사용 — 직접 링크 시 발송 전체 실패하는 카카오 API 제약 발견) | `lib/kakao/meMessage.ts` |
| 카카오 알림톡(비즈메시지) | **미연동** — `message_log`에 기록만 하는 stub 상태, 발송대행사 계약 필요. 위 "나에게 보내기"와는 완전히 별개 기능이니 혼동 주의 | `lib/alimtalk/send.ts` |
| 카카오 심사 대기 우회 | `NEXT_PUBLIC_KAKAO_REVIEW_PENDING=true`면 실제 OAuth 대신 mock 세션으로 결과 열람 (데모/심사 대기 중 시연용) | `ResultLockedScreen.tsx` |
| 카카오 로그인 리다이렉트 URI | 접속 origin(`req.nextUrl.origin`) 기준 동적 생성. Vercel 기본 도메인은 `next.config.ts`에서 `www.dgting.co.kr`로 301 리다이렉트되므로 실질적으로 항상 정식 도메인 기준으로 동작 | `app/api/auth/kakao/route.ts` |

> 심사 승인 후: `NEXT_PUBLIC_KAKAO_REVIEW_PENDING` 플래그를 false/삭제하고 관련 `TEMP:` 주석 구간을 제거할 것 (아래 "배포 전 반드시 확인할 것" 참고).
> 새 카카오 앱으로 키를 교체할 경우: `KAKAO_REST_API_KEY`/`KAKAO_CLIENT_SECRET`/`NEXT_PUBLIC_KAKAO_JS_KEY`를 `.env.local`/Vercel에 갱신하고, 카카오 개발자센터에 `https://www.dgting.co.kr/api/auth/kakao/callback`을 Redirect URI로 등록할 것.

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
2. README.md 전체 (특히 "진행 로그" 최신 날짜 항목, "배포 전 반드시 확인할 것" 섹션)
3. CHANGELOG.md
4. docs/당근인형뽑기_게임설계도.md (게임/쿠폰/포인트 로직의 단일 진실 소스 — v2.1로 실제 구현과 동기화되어 있음)
5. .cursor/rules/project-rules.mdc, .cursor/rules/git-workflow.mdc (항상 적용되는 프로젝트 규칙)
6. AI_HANDOFF.md
7. docs/migrations/ 폴더 안의 모든 SQL 파일 (Supabase 대시보드에서 실행된 DB 변경사항 — 실제 DB에 이미 적용된 것으로 간주할 것)
8. .env.example (새로 추가된 환경변수가 있는지, 내 .env.local에 빠진 게 없는지 확인)

다 확인했으면 "현재 상태 요약"을 먼저 나에게 말해주고, 내가 확인/승인하면 작업을 시작해줘.
기존 아키텍처와 코드 스타일은 그대로 유지하고, 불필요한 재작성은 하지 마.
```

### 세션 종료 시 (다음 세션에 끊김 없이 넘기기 위한 체크리스트)

- [ ] README.md "진행 로그"에 오늘 한 일 + **왜** 그렇게 했는지 한 줄 이상 기록
- [ ] Supabase 대시보드에서 SQL을 실행했다면, `docs/migrations/`에 번호 붙여서 파일로 남김 (규칙: [`docs/migrations/README.md`](./docs/migrations/README.md))
- [ ] 새 환경변수를 추가했다면 `.env.example`에도 반영
- [ ] `git add . && git commit -m "..." && git push origin main`
