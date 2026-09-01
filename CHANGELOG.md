# Changelog

이 프로젝트의 주요 변경사항을 기록한다. 형식은 [Keep a Changelog](https://keepachangelog.com/) 기준.

> **참고**: 2026-08 중순 이후 세션별 상세 변경 이력은 이 파일 대신 [`README.md`](./README.md) "진행 로그" 섹션에 날짜별로 기록되고 있다 (커밋 단위 상세 기록). 이 파일은 굵직한 마일스톤 요약용으로 유지한다.

## [2026-09-01] 슈퍼관리자 구독관리 + 도메인/랜딩 구조 정리 + NFC 방문적립

### 추가
- NFC 태그 기반 방문 적립 기능 (포인트 또는 스탬프 선택형) — `/checkin/[storeId]`, `process_nfc_checkin` RPC, 관리자 포인트 정책 화면에서 설정
- 슈퍼관리자 신규 메뉴 "업체 구독관리" — 결제(입금) 이력 확인/등록, CSV 다운로드
- 슈퍼관리자 대시보드 KPI 6종 확장 (가입추이/회원수/당근클릭/리워드유형/쿠폰사용률/재방문율)
- `/aeo` 자리표시 페이지, `aeo_waitlist` 테이블

### 변경
- "월 광고비" 용어를 전체 코드/화면에서 "월 구독료"로 통일
- 성과 리포트(`/admin/report`)를 광고비/ROI 퍼널 방식에서 객단가 기반 스토리텔링형 리포트(6개 섹션)로 전면 개편
- 랜딩페이지를 루트(`/`)로 승격, 구 랜딩(`/landing`) 삭제, 헤더를 햄버거+슬라이드 패널 메뉴로 재구성
- 카카오 로그인/체크인 등 모든 링크가 Vercel 기본 도메인이 아닌 `www.dgting.co.kr` 정식 도메인으로만 노출되도록 `next.config.ts`에 영구 리다이렉트 추가

## [2026-08-25~08-31] 랜딩페이지 v5 리뉴얼 + 리워드/포인트 구조 정리

### 추가
- 신규 랜딩페이지(landing-v5) 전면 리뉴얼 — 성장 엔진 섹션, 실제 접점 섹션, FAQ 14문항, 요금제 리드 전환 개편 등
- 리워드 이미지 파일 업로드(Storage 버킷), 경품 티어 확률(%) 직접입력 모드
- 쿠폰 발급 카카오 메시지에 "당근마켓 후기 남기고 쿠폰받기" 버튼

### 변경
- 리워드 교환을 별도 테이블 대신 `coupons` 테이블로 통합 (게임 당첨과 동일 흐름 재사용)
- 포인트/재고 차감 시점을 "교환 선택" → "사장님 확인(실사용)" 시점으로 이동
- 게임 런타임 이미지를 WebP로 변환 (약 90% 용량 절감)

### 수정
- Supabase 보안 어드바이저 경고 대응: RLS 비활성 상태였던 24개 테이블 재활성화
- 당근(`daangn.com`) 링크를 카카오 메시지에 직접 넣으면 발송 전체가 실패하는 문제를 자체 도메인 경유 리다이렉트로 우회

## [Unreleased]

### 추가
- `POST /api/games/play` — 게임 결과 서버 확정 API (경품 가중 랜덤 추첨, 클라이언트는 결과만 받아 애니메이션 재생) + 당첨 시 `coupons` 발급까지 연결
- `coupons` 테이블 — `source_type='game_win'`만 다룸. 인증 불필요 당첨은 `issued`, 인증 필요 당첨은 `pending_verify`로 즉시 기록
- `lib/game-engine/prizeDraw.ts`, `lib/game-engine/probability.ts`, `lib/game-engine/couponValidity.ts` — 추첨/확률계산/유효기간계산 순수 함수
- `VerificationCtaScreen` — 고액(인증 필요) 당첨 후 당근 단골 추가 유도 화면
- `docs/migrations/` — Supabase 대시보드 DB 변경사항 추적 폴더 (멀티 환경 작업 시 Git에 안 남는 부분 보완)
- `/staff` 계산대 검증 화면 — 직원용, 인증 없이 접근 (추후 비밀번호 추가 예정). 쿠폰 코드 조회 후 상태별 버튼 분기(사용 처리 / 확인함·미확인 처리 / 사용 완료 안내 / 기간 만료 안내)
- `GET /api/coupons/lookup`, `POST /api/coupons/verify`, `POST /api/coupons/use` — 쿠폰 상태머신 전환 API. 클라이언트 버튼 노출 로직과 별개로 서버에서도 상태·유효기간을 재검증해 잘못된 전환을 막음
- `docs/당근인형뽑기_게임설계도.md` — 프로젝트 단일 진실 소스(SSOT) 문서 추가. 3~4절(확률/재고 로직)을 실제 구현(수량 기반 자동계산)에 맞게 갱신, 9절 데이터 모델도 `tier_usage_counters` 삭제/`prize_tiers`·`events` 스키마 변경 반영
- `.cursor/rules/project-rules.mdc` — 검증 습관(금전 로직엔 테스트 필수)/진행 기록/개발 순서(로직 우선, 설계도=SSOT) 규칙을 항상 적용되는 Cursor 규칙으로 등록
- README.md "배포 전 반드시 확인할 것" 섹션 — 카카오 미연동, `/staff` 무인증, 만료 배치 미구현 등 임시 처리 항목 추적용
- `lib/coupons/getEffectiveStatus.ts` — 쿠폰의 "실제 유효 상태"(DB status + valid_until 비교)를 판정하는 단일 함수. `lookup`/`verify`/`use` 3개 API가 모두 재사용하도록 통일 (6~7단계 관리자 대시보드에서도 재사용 예정) + `node:test` 4개

### 변경
- `prize_tiers` 확률 관리 방식을 확률(%) 직접입력에서 **수량 기반 자동계산**으로 전환 (`total_quantity`/`remaining_quantity`/`computed_probability`). 추첨 가중치는 고정된 `computed_probability`만 사용하고, `remaining_quantity`는 품절 시 꽝으로 강제 전환하는 안전장치로만 사용
- `tier_usage_counters` 테이블 삭제 (수량 기반으로 통합되어 불필요)

### 수정
- `daily_participation_log` RLS로 인해 참여 기록 저장이 조용히 실패하던 버그 수정 (하루 1회 참여 제한 무력화 문제) — [`docs/migrations/001_disable_rls_daily_participation_log.sql`](./docs/migrations/001_disable_rls_daily_participation_log.sql)
- "참고 문서 우선순위"가 레거시 `.cursorrules`에만 있고 신형식 `.cursor/rules/project-rules.mdc`엔 없던 문제 수정 — `project-rules.mdc`로 이전, `.cursorrules`엔 이전 위치 안내만 남김
- `computed_probability`가 티어별 독립 계산만 되고 정규화가 없어 이벤트당 합계가 100%를 보장하지 못하던 문제 수정 (`normalizeProbabilities()` 추가) — [`docs/migrations/005_normalize_prize_tier_probability.sql`](./docs/migrations/005_normalize_prize_tier_probability.sql)

### 테스트
- `lib/game-engine/probability.test.ts` — `node:test` 기반, `npm test`로 실행. 확률 합계 100% 보장을 검증

### 설계 완료
- 사업/마케팅 전략 기획서
- 시스템 구조 설계도 (역할 계층, 데이터모델 개념도, 권한 매트릭스, 화면군)
- 게임 연동 마케팅 설계도 (CTA 채널별 기술 검증, 전체 설계도 로드맵)
- ERD / API 명세 / 개인정보·보안 설계도
- 프로젝트 스캐폴드 (README, .cursorrules, .env.example 등)

### 다음
- 알림톡(비즈메시지) 발송대행사 실연동
- NFC 방문적립 실제 현장 태그 테스트
- 쿠폰 만료 배치, 당근 비즈프로필 딥링크 실연동
- (상세 목록은 [`README.md`](./README.md) "배포 전 반드시 확인할 것" 섹션 참고)
