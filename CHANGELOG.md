# Changelog

이 프로젝트의 주요 변경사항을 기록한다. 형식은 [Keep a Changelog](https://keepachangelog.com/) 기준.

## [Unreleased]

### 추가
- `POST /api/games/play` — 게임 결과 서버 확정 API (경품 가중 랜덤 추첨, 클라이언트는 결과만 받아 애니메이션 재생) + 당첨 시 `coupons` 발급까지 연결
- `coupons` 테이블 — `source_type='game_win'`만 다룸. 인증 불필요 당첨은 `issued`, 인증 필요 당첨은 `pending_verify`로 즉시 기록
- `lib/game-engine/prizeDraw.ts`, `lib/game-engine/probability.ts`, `lib/game-engine/couponValidity.ts` — 추첨/확률계산/유효기간계산 순수 함수
- `VerificationCtaScreen` — 고액(인증 필요) 당첨 후 당근 단골 추가 유도 화면
- `docs/migrations/` — Supabase 대시보드 DB 변경사항 추적 폴더 (멀티 환경 작업 시 Git에 안 남는 부분 보완)
- `/staff` 계산대 검증 화면 — 직원용, 인증 없이 접근 (추후 비밀번호 추가 예정). 쿠폰 코드 조회 후 상태별 버튼 분기(사용 처리 / 확인함·미확인 처리 / 사용 완료 안내 / 기간 만료 안내)
- `GET /api/coupons/lookup`, `POST /api/coupons/verify`, `POST /api/coupons/use` — 쿠폰 상태머신 전환 API. 클라이언트 버튼 노출 로직과 별개로 서버에서도 상태·유효기간을 재검증해 잘못된 전환을 막음

### 변경
- `prize_tiers` 확률 관리 방식을 확률(%) 직접입력에서 **수량 기반 자동계산**으로 전환 (`total_quantity`/`remaining_quantity`/`computed_probability`). 추첨 가중치는 고정된 `computed_probability`만 사용하고, `remaining_quantity`는 품절 시 꽝으로 강제 전환하는 안전장치로만 사용
- `tier_usage_counters` 테이블 삭제 (수량 기반으로 통합되어 불필요)

### 수정
- `daily_participation_log` RLS로 인해 참여 기록 저장이 조용히 실패하던 버그 수정 (하루 1회 참여 제한 무력화 문제) — [`docs/migrations/001_disable_rls_daily_participation_log.sql`](./docs/migrations/001_disable_rls_daily_participation_log.sql)
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
- `/lib/schemas` 데이터 타입 코드화
- 스크래치카드 게임 엔진 MVP
