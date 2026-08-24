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

### 다음 예정
- [ ] 만료 배치 (쿠폰 valid_until 지난 것 expired로 갱신 — 현재는 조회 시점 판정으로 안전하게 대체 중)
- [ ] 알림톡 발송대행사 실연동 (현재 stub 상태)
- [ ] 당근 비즈프로필 실제 연동 (현재 화면 안내만, 클릭 로그 미구현)
- [ ] Supabase Pro 업그레이드 + 자동 일일 백업(PITR) 전환

---

## 배포 전 반드시 확인할 것

임시로 처리하고 넘어간 것 / 미완성 상태로 남아있는 것. 실제 서비스 오픈 전에 아래를 전부 해소해야 한다.

- [x] **카카오 로그인 실연동 완료** — `NEXT_PUBLIC_KAKAO_JS_KEY` 설정 완료. `/api/auth/kakao` OAuth 서버사이드 흐름 구현, 전화번호 암호화 저장(AES-256-CBC), iron-session 고객 세션 쿠키 적용. Mock 로그인은 키 미설정 시 개발 폴백으로만 유지
- [ ] **알림톡 발송대행사(솔라피 등) 가입 및 실제 발송 연동은 별도 진행 예정** — 현재 `lib/alimtalk/send.ts`는 `message_log` 테이블에 기록만 하는 stub 상태. `KAKAO_ALIMTALK_SENDER_KEY` 입력 후 stub 내부 주석 해제하면 즉시 연동 가능
- [ ] **카카오 로그인 심사 대기 우회** — `.env.local` 또는 Vercel에 `NEXT_PUBLIC_KAKAO_REVIEW_PENDING=true` 이면 화면 3 버튼이 실제 카카오 대신 `test-user-1` mock 세션으로 claim 한다. **심사 승인 후: 플래그를 false/삭제하고 `ResultLockedScreen.tsx`·`mock-customer-session`의 `TEMP: 카카오 심사 대기용` 주석 구간을 제거한다.**
- [ ] **카카오 비즈앱 전환 및 전화번호 동의항목 심사** — 개인사업자/법인 사업자 기준으로 카카오 비즈앱 전환 신청 후, 카카오 개발자 센터에서 "전화번호" 동의항목 심사 신청 필요. 심사 전에는 `phone_number`가 null로 내려와 전화번호 저장이 생략됨 (로그인 자체는 정상 동작)
- [ ] **알림톡 발송대행사 가입 및 KAKAO_ALIMTALK_SENDER_KEY 실제값 입력** — 현재 `lib/alimtalk/send.ts`는 `message_log` 테이블에 기록만 하는 stub 상태. 대행사(비즈뿌리오, 알리고, 솔라피 등) 가입 후 Sender Key 발급 → `.env.local`에 `KAKAO_ALIMTALK_SENDER_KEY` 입력 → `sendAlimtalk()` 내부 주석 해제 후 대행사 API 호출 코드 추가
- [ ] **개인정보처리방침 업데이트** — "전화번호 수집·이용 목적(카카오 쿠폰 알림 발송)" 항목 추가 필요. 수집 근거, 보유 기간, 제3자 제공 여부(대행사 전달 포함) 명시 필요
- [ ] **`/staff` 계산대 화면 인증 없음** — 누구나 URL로 접근해서 쿠폰을 사용/확인 처리할 수 있음. 최소 비밀번호 정도는 배포 전 추가 필요
- [ ] **쿠폰 만료 배치 미구현** — `valid_until`이 지난 쿠폰의 `status`가 실제로 `expired`로 바뀌지 않고, 조회 시점에 `lib/coupons/getEffectiveStatus.ts`가 판정해서 보여줌 (DB에는 계속 `issued`/`pending_verify` 등으로 남음). 규모가 커지면 배치를 추가하되, 그래도 조회 시점 판정 로직은 안전망으로 유지하는 게 안전
- [ ] **당근 단골 추가 실제 연동 없음** — `VerificationCtaScreen`은 화면과 쿠폰 코드 표시만 하고, 실제 당근 비즈프로필 딥링크 연결과 클릭 로그(`damgeun_click_logs`)는 미구현
- [ ] **동시 접속자 방어(트랜잭션 락) 없음** — `/api/games/play`의 재고 차감이 단순 조회→차감 흐름 (로컬 소규모 사용자 기준으로 의도적 생략, `docs/당근인형뽑기_게임설계도.md` 4.3절 참고)
- [ ] **관리자 CRUD 화면 미구현** — 이벤트 등록/수정, 확률 자동계산 UI, 쿠폰 현황 대시보드 아직 없음. `/admin/report`, `/admin/dashboard`는 조회 전용으로 구현됨 (store_settings.monthly_ad_budget 수정은 아직 SQL 직접)
- [ ] **`store_settings.monthly_ad_budget`/`average_order_value` 수동 입력** — Supabase SQL로 직접 업데이트 필요. 관리자 편집 UI는 6단계에서 추가 예정
- [ ] **테스트 이벤트 데이터가 하드코딩** — `test-store-001`/`test-event-001` 기준으로만 검증됨, 실제 매장 온보딩 플로우 없음

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
| [`docs/migrations/`](./docs/migrations/) | Supabase 대시보드에서 실행한 DB 변경사항 기록 (Git에 안 남는 부분 추적용, **새 세션 시작 시 필수 확인**) |
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

## 카카오 연동 현황 (2026-08-12 실연동 완료)

카카오 로그인은 **실제 OAuth로 연동 완료**된 상태다 (`lib/auth/kakao.ts`, `/api/auth/kakao`, `/api/auth/kakao/callback`). 초창기엔 mockLogin으로 대체하던 보류 상태였으나 8단계에서 교체되었다.

| 항목 | 상태 | 파일 |
|---|---|---|
| 카카오 로그인 (OAuth) | **연동 완료** | `lib/auth/kakao.ts` |
| 전화번호 수집(동의항목) | **비즈앱 전환 + 심사 대기** — 심사 전엔 `phone_number`가 null로 내려와 저장 생략 (로그인 자체는 정상) | `lib/auth/kakao.ts` |
| 카카오 채널 친구추가 CTA | 연동 완료 (`NEXT_PUBLIC_ADVERTISER_KAKAO_URL`) | `PlayFlow.tsx` |
| 카카오 알림톡 | **미연동** — `message_log`에 기록만 하는 stub 상태, 발송대행사 계약 필요 | `lib/alimtalk/send.ts` |
| 카카오 심사 대기 우회 | `NEXT_PUBLIC_KAKAO_REVIEW_PENDING=true`면 실제 OAuth 대신 mock 세션으로 결과 열람 (데모/심사 대기 중 시연용) | `ResultLockedScreen.tsx` |

> 심사 승인 후: `NEXT_PUBLIC_KAKAO_REVIEW_PENDING` 플래그를 false/삭제하고 관련 `TEMP:` 주석 구간을 제거할 것 (아래 "배포 전 반드시 확인할 것" 참고).

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
