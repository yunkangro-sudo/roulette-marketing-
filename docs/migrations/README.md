# DB 변경 기록 (마이그레이션 로그)

Supabase 대시보드 SQL Editor에서 실행한 모든 DB 변경사항은 **반드시 이 폴더에 파일로 남긴다.**

이유: `.env.local`과 달리 Supabase 대시보드에서 직접 실행한 SQL은 Git에 자동으로 기록되지 않는다. 집/회사 두 컴퓨터를 오가며 작업하거나, 다른 세션의 AI가 이어서 작업할 때, 이 폴더가 없으면 "실제 DB 상태"와 "문서에 적힌 상태"가 어긋나는 사고가 반복된다 (2026-08-09 RLS 사고 참고).

## 규칙

1. Supabase SQL Editor에서 뭔가 실행하기 전에, 먼저 이 폴더에 `NNN_설명.sql` 파일을 만든다 (숫자는 순서대로 3자리).
2. 파일 안에 **무엇을, 왜** 바꾸는지 주석으로 남긴다.
3. SQL 실행이 끝나면 이 파일을 커밋한다.
4. 새 세션을 시작하는 AI/사람은 이 폴더의 파일들을 최신 번호까지 전부 읽고 시작한다 (실제로 DB에 적용됐다고 간주하고 작업한다).

## 파일 목록

| 번호 | 파일 | 요약 |
|---|---|---|
| 001 | [`001_disable_rls_daily_participation_log.sql`](./001_disable_rls_daily_participation_log.sql) | `daily_participation_log` RLS 비활성화 (참여 기록 저장 401 에러 수정) |
| 002 | [`002_add_prize_tiers.sql`](./002_add_prize_tiers.sql) | `prize_tiers`, `tier_usage_counters` 테이블 추가 + test-store-001 이벤트에 경품 3종(꽝 50%/1,000원 30%/10,000원 20%) 시드 |
| 003 | [`003_grant_prize_tiers.sql`](./003_grant_prize_tiers.sql) | `prize_tiers`, `tier_usage_counters`에 `service_role` GRANT 추가 (permission denied 수정) |
| 004 | [`004_quantity_based_prize_tiers.sql`](./004_quantity_based_prize_tiers.sql) | `prize_tiers` 확률(%) 직접입력 → 수량 기반(`total_quantity`/`remaining_quantity`/`computed_probability`) 자동계산으로 전환, `tier_usage_counters` 삭제, `events.expected_daily_participants` 추가 |
| 005 | [`005_normalize_prize_tier_probability.sql`](./005_normalize_prize_tier_probability.sql) | `computed_probability`가 이벤트당 합계 100%가 안 되던 문제 수정 (정규화 적용) |
| 006 | [`006_add_coupons.sql`](./006_add_coupons.sql) | `coupons` 테이블 추가 (게임 당첨 쿠폰 발급), `events.coupon_validity_type`/`coupon_validity_value` 추가 |
| 028 | [`028_universal_danggeun_verify.sql`](./028_universal_danggeun_verify.sql) | 전 경품 당근 확인 + 계산대 대기열 |
| 029 | [`029_points_enabled.sql`](./029_points_enabled.sql) | `store_settings.points_enabled` — 매장별 포인트 적립 온/오프 |
| 030 | [`030_store_profile_urls.sql`](./030_store_profile_urls.sql) | `store_contracts.daangn_url`, `kakao_channel_url` |
