# DB 변경 기록 (마이그레이션 로그)

Supabase 대시보드 SQL Editor에서 실행한 모든 DB 변경사항은 **반드시 이 폴더에 파일로 남긴다.**

이유: `.env.local`과 달리 Supabase 대시보드에서 직접 실행한 SQL은 Git에 자동으로 기록되지 않는다. 집/회사 두 컴퓨터를 오가며 작업하거나, 다른 세션의 AI가 이어서 작업할 때, 이 폴더가 없으면 "실제 DB 상태"와 "문서에 적힌 상태"가 어긋나는 사고가 반복된다 (2026-08-09 RLS 사고 참고).

## 규칙

1. Supabase SQL Editor에서 뭔가 실행하기 전에, 먼저 이 폴더에 `NNN_설명.sql` 파일을 만든다 (숫자는 순서대로 3자리).
2. 파일 안에 **무엇을, 왜** 바꾸는지 주석으로 남긴다.
3. SQL 실행이 끝나면 이 파일을 커밋한다.
4. 새 세션을 시작하는 AI/사람은 이 폴더의 파일들을 최신 번호까지 전부 읽고 시작한다 (실제로 DB에 적용됐다고 간주하고 작업한다).

## 왜 Supabase 대시보드에 "No migrations"로 뜨는가

Supabase 대시보드의 **Database → Migrations** 화면은 `supabase` CLI(`supabase migration new`, `supabase db push` 등)로 적용한 이력만 추적한다. CLI는 마이그레이션을 적용할 때마다 `supabase_migrations.schema_migrations` 라는 내부 테이블에 기록을 남기고, 대시보드는 그 테이블을 읽어서 보여준다.

이 프로젝트는 지금까지 **CLI를 한 번도 쓰지 않고** Supabase 대시보드의 SQL Editor에서 이 폴더의 `.sql` 파일 내용을 직접 붙여넣어 실행하는 방식으로만 스키마를 변경해왔다 (`supabase/` 폴더 자체가 프로젝트에 없음 = CLI 초기화조차 안 된 상태). SQL Editor에서 실행한 내용은 스키마에는 정상 반영되지만 `schema_migrations` 테이블에는 아무 기록도 남기지 않으므로, 실제로 38번까지 변경을 했어도 대시보드에는 "No migrations"로 보이는 것이 정상이다. **데이터 유실이나 실행 실패를 의미하는 게 아니다.**

이 폴더(`docs/migrations/001~038*.sql` + 이 README)가 사실상 이 프로젝트의 유일한 마이그레이션 이력이며, CLI의 대체 역할을 하고 있다. 앞으로도 계속 이 방식(SQL Editor + 이 폴더에 기록)을 쓸지, 아니면 `supabase link` + `supabase db push`로 전환할지는 별도 결정 사항이다.

## 파일 목록

| 번호 | 파일 | 요약 |
|---|---|---|
| 001 | [`001_disable_rls_daily_participation_log.sql`](./001_disable_rls_daily_participation_log.sql) | `daily_participation_log` RLS 비활성화 (참여 기록 저장 401 에러 수정) |
| 002 | [`002_add_prize_tiers.sql`](./002_add_prize_tiers.sql) | `prize_tiers`, `tier_usage_counters` 테이블 추가 + test-store-001 이벤트에 경품 3종(꽝 50%/1,000원 30%/10,000원 20%) 시드 |
| 003 | [`003_grant_prize_tiers.sql`](./003_grant_prize_tiers.sql) | `prize_tiers`, `tier_usage_counters`에 `service_role` GRANT 추가 (permission denied 수정) |
| 004 | [`004_quantity_based_prize_tiers.sql`](./004_quantity_based_prize_tiers.sql) | `prize_tiers` 확률(%) 직접입력 → 수량 기반(`total_quantity`/`remaining_quantity`/`computed_probability`) 자동계산으로 전환, `tier_usage_counters` 삭제, `events.expected_daily_participants` 추가 |
| 005 | [`005_normalize_prize_tier_probability.sql`](./005_normalize_prize_tier_probability.sql) | `computed_probability`가 이벤트당 합계 100%가 안 되던 문제 수정 (정규화 적용) |
| 006 | [`006_add_coupons.sql`](./006_add_coupons.sql) | `coupons` 테이블 추가 (게임 당첨 쿠폰 발급), `events.coupon_validity_type`/`coupon_validity_value` 추가 |
| 007 | [`007_payment_logs_and_store_settings.sql`](./007_payment_logs_and_store_settings.sql) | `payment_logs`, `store_settings` (광고비·객단가) 추가 |
| 008 | [`008_store_accounts.sql`](./008_store_accounts.sql) | `store_accounts` (이메일·비밀번호 매장 관리자 계정) 추가 |
| 009 | [`009_tier_quantity_changes.sql`](./009_tier_quantity_changes.sql) | 경품 티어 수량 변경 이력 테이블 추가 |
| 010 | [`010_store_contracts.sql`](./010_store_contracts.sql) | `store_contracts` (업체 계약 정보) 테이블 추가 |
| 011 | [`011_event_status_changes.sql`](./011_event_status_changes.sql) | 이벤트 상태 변경 이력 테이블 추가 |
| 012 | [`012_points_system.sql`](./012_points_system.sql) | 포인트 시스템 5개 테이블 + RPC 2개 (`customer_loyalty`, `point_ledger` 등) 추가 |
| 013 | [`013_short_codes.sql`](./013_short_codes.sql) | 쿠폰/리워드 `short_code` 컬럼 추가 |
| 014 | [`014_manual_coupon.sql`](./014_manual_coupon.sql) | 수동 쿠폰 발급 지원 |
| 015 | [`015_game_type.sql`](./015_game_type.sql) | `events.game_type` 컬럼 추가 (게임 교체 대비) |
| 016 | [`016_store_contracts_extended.sql`](./016_store_contracts_extended.sql) | `store_contracts` 확장 컬럼 추가 |
| 017 | [`017_phone_alimtalk.sql`](./017_phone_alimtalk.sql) | 전화번호 암호화 저장 + 알림톡 발송 로그 추가 |
| 018 | [`018_message_consent.sql`](./018_message_consent.sql) | 메시지 발송 동의/빈도 규칙 추가 |
| 019 | [`019_activity_log.sql`](./019_activity_log.sql) | `activity_log` 행동 이력 테이블 추가 |
| 020 | [`020_missions.sql`](./020_missions.sql) | `missions` / `mission_progress` 방문 미션 테이블 추가 |
| 021 | [`021_customer_segments.sql`](./021_customer_segments.sql) | 고객 세그먼트 자동 분류 추가 |
| 022 | [`022_churn_risk_alerts.sql`](./022_churn_risk_alerts.sql) | `churn_risk_alerts` Win-back 3단계 추가 |
| 023 | [`023_reward_verification.sql`](./023_reward_verification.sql) | `reward_catalog.requires_verification` 추가 |
| 024 | [`024_reward_catalog_extended.sql`](./024_reward_catalog_extended.sql) | `reward_catalog` 확장 (유형·기간한정 등) |
| 025 | [`025_signup_inquiries.sql`](./025_signup_inquiries.sql) | 랜딩 무료 체험 신청 `signup_inquiries` 테이블 추가 |
| 026 | [`026_message_log_extended.sql`](./026_message_log_extended.sql) | `message_log` 확장 (쿠폰 만료 알림 중복방지) |
| 027 | [`027_grant_delete_permissions.sql`](./027_grant_delete_permissions.sql) | `service_role` DELETE 권한 부여 + 테스트 데이터 정리 |
| 028 | [`028_universal_danggeun_verify.sql`](./028_universal_danggeun_verify.sql) | 전 경품 당근 확인 + 계산대 대기열 |
| 029 | [`029_points_enabled.sql`](./029_points_enabled.sql) | `store_settings.points_enabled` — 매장별 포인트 적립 온/오프 |
| 030 | [`030_store_profile_urls.sql`](./030_store_profile_urls.sql) | `store_contracts.daangn_url`, `kakao_channel_url` |
| 031 | [`031_signup_self_registration.sql`](./031_signup_self_registration.sql) | `signup_inquiries`에 누락된 `service_role` GRANT 추가(가입 저장 실패 버그 수정) + `store_contracts.business_type` 컬럼 추가 |
| 032 | [`032_coupon_label.sql`](./032_coupon_label.sql) | `coupons.label` 컬럼 추가 — 실물 경품 당첨 시 직원 계산대/손님 쿠폰함에 품목명이 아닌 금액만 표시되던 문제 수정 |
| 033 | [`033_subscriptions.sql`](./033_subscriptions.sql) | `subscriptions` (이용기간/결제 이력) 테이블 추가 — 광고주 관리자 모드 v2 |
| 034 | [`034_member_tracking_extended.sql`](./034_member_tracking_extended.sql) | `customer_loyalty.first_seen_at`/`kakao_first_login_at` 추가, `activity_log`에 `kakao_login`/`daangn_click` 이벤트 타입 추가 |
| 035 | [`035_challenge_frequency.sql`](./035_challenge_frequency.sql) | `events.challenge_frequency` 추가, `daily_participation_log`에 `event_id`/`last_played_at` 추가 (하루 1회 하드코딩 → 매일/주간/월간/무제한 일반화) |
| 036 | [`036_impersonation_log.sql`](./036_impersonation_log.sql) | `impersonation_log` (슈퍼관리자 대리접속 감사 로그) 테이블 추가 — 슈퍼관리자 모드 개편 v1 |
| 037 | [`037_reward_catalog_discount_and_verification.sql`](./037_reward_catalog_discount_and_verification.sql) | `reward_catalog.discount_amount` 추가, `redeem_points_atomic`이 `requires_verification=false`면 확인 단계 없이 바로 `pending_apply`로 발급하도록 수정, `assign_checkout_queue`에 초기 대기열 상태 인자 추가 |
| 038 | [`038_cleanup_reward_catalog_test_data.sql`](./038_cleanup_reward_catalog_test_data.sql) | (일회성) `chj-001` 매장의 `[TEST-*]`/`[테스트]`/`[A]~[D]` 리워드 테스트 더미데이터 삭제 |
| 039 | [`039_enable_rls_all_tables.sql`](./039_enable_rls_all_tables.sql) | **[보안]** Supabase 보안 어드바이저 경고 대응 — `signup_inquiries` 제외 전체 24개 테이블 RLS 재활성화 (정책 없이 전체 차단, `service_role`은 영향 없음). 자세한 내용은 아래 "2026-08-25 보안 사고" 참고 |
| 040 | [`040_reward_images_storage_bucket.sql`](./040_reward_images_storage_bucket.sql) | 리워드 이미지 업로드용 Supabase Storage `reward-images` 버킷 생성 (public read, 5MB 제한, jpg/png/webp만 허용). `scripts/create-reward-images-bucket.mjs`(Storage Admin API)로 실행, raw SQL 아님 — 별도 쓰기 정책 없음(업로드는 항상 service_role 서버 API 경유) |
| 041 | [`041_reward_redemption_coupons_integration.sql`](./041_reward_redemption_coupons_integration.sql) | 포인트 리워드 교환을 `rewards_issued` 대신 `coupons` 테이블로 통합 — `coupons.source_type`에 `reward_redemption` 추가, `coupons.reward_catalog_id` 컬럼 추가, `redeem_points_atomic`이 `coupons`에 발급하도록 변경. 게임 당첨 쿠폰과 완전히 동일한 코드 확인 화면(`/me/points/[couponId]`)·계산대 흐름을 그대로 재사용 |
| 042 | [`042_remove_usage_threshold_gate.sql`](./042_remove_usage_threshold_gate.sql) | `redeem_points_atomic`에서 `loyalty_settings.usage_threshold`("최소 사용 가능 잔액") 체크 제거 — 리워드 가격 위에 이 값이 추가로 얹혀져서, 리워드 가격만큼 모아도 여전히 교환이 막히는 버그가 있었음. 이제 리워드 교환 가능 여부는 오직 해당 리워드의 `point_cost`만으로 판단 (컬럼/관리자 화면 자체는 유지) |
| 043 | [`043_defer_point_deduction_to_confirm.sql`](./043_defer_point_deduction_to_confirm.sql) | 리워드 교환의 포인트/재고 차감 시점을 "교환하기" 클릭 순간에서 "사장님 확인"(실사용 확정) 순간으로 이동. `coupons.point_cost` 컬럼 추가(교환 당시 가격 고정), `redeem_points_atomic`은 이제 쿠폰만 발급하고 포인트/재고를 건드리지 않음, 신규 `confirm_coupon_used_atomic` RPC가 쿠폰을 `used`로 확정하면서 포인트 차감 + 재고 차감 + `point_ledger` 기록을 원자적으로 처리. `/api/me/coupons/[couponId]/confirm-use`, `/api/checkout/[storeId]/approve`(apply 액션)에서 이 RPC를 호출하도록 변경 |
| 044 | [`044_delete_store_completely.sql`](./044_delete_store_completely.sql) | 슈퍼관리자용 "업체 완전 삭제(Hard Delete)" RPC `delete_store_completely` 추가 — `store_id` 텍스트 컬럼으로만 연결된 24개 테이블 전체를 FK 위반 없는 순서로 지우고 마지막에 `store_contracts` 본체를 삭제. `app/admin/companies/[id]` 상세 페이지의 "위험 구역"(super_admin 전용, 업체명 재입력 2차 확인)에서 호출 |
| 045 | [`045_fix_delete_store_completely_permission.sql`](./045_fix_delete_store_completely_permission.sql) | `delete_store_completely` 실행 시 `permission denied for table tier_quantity_changes` 에러 수정 — 함수를 `SECURITY DEFINER`로 재정의해 호출자(service_role)의 테이블별 GRANT 여부와 무관하게 소유자(postgres) 권한으로 실행되게 함 |
| 046 | [`046_signup_inquiries_source.sql`](./046_signup_inquiries_source.sql) | `signup_inquiries.source` 컬럼 추가 — 랜딩 요금제 섹션 "베이직 신청" 폼이 어느 경로로 들어온 리드인지 구분 (`landing_v5_pricing_basic`) |
| 047 | [`047_aeo_waitlist.sql`](./047_aeo_waitlist.sql) | `aeo_waitlist` (AEO마케팅 출시 알림 대기자) 테이블 추가 — 랜딩 요금제 섹션 "AEO마케팅" 카드의 "출시 알림 받기" 리드를 베이직 신청과 분리 저장. service_role 전용, anon 정책 없음 |
| 048 | [`048_prize_tier_probability_mode.sql`](./048_prize_tier_probability_mode.sql) | `events.prize_tier_mode` 컬럼 추가 (`quantity`\|`percent`, 기본값 `quantity`) — 경품 티어를 "총 수량 입력→자동계산" 또는 "확률(%) 직접입력" 중 골라서 설정할 수 있게 함 |
| 049 | [`049_subscription_payment_fields.sql`](./049_subscription_payment_fields.sql) | `subscriptions.payment_date`(실제 입금 확인일)/`payment_status`(`paid`\|`unpaid`\|`overdue`, 기본값 `unpaid`) 컬럼 추가 — 슈퍼관리자 "업체 구독관리" 화면의 수동 입금 확인 워크플로우용. 기존 이력 row는 `paid`/입금일=`start_date`로 일괄 보정 |

> 참고: 위 표는 Git에 존재하는 SQL 파일 목록이다. **Git에 파일이 있다고 해서 Supabase DB에 실제로 실행되었음이 보장되지는 않는다.** 실제 적용 여부가 불확실하면 Supabase SQL Editor에서 `SELECT to_regclass('public.해당테이블명')` 또는 `information_schema.columns`로 직접 확인할 것.

## 2026-08-25 보안 사고: 전체 테이블 RLS 비활성화 상태 발견 및 복구

**발단**: Supabase가 "테이블의 RLS가 꺼져있어 프로젝트 URL만 알면 누구나 데이터를 읽고/수정하고/삭제할 수 있다"는 보안 경고 메일을 보냄.

**조사 결과**: `docs/migrations/001~038` + `docs/sql-setup.sql` 전체를 조사한 결과, `signup_inquiries` 1개를 제외한 **24개 테이블**이 RLS OFF 상태였음 (일부는 처음부터 RLS를 켠 적이 없고, 일부는 개발 중 "permission denied" 에러가 날 때마다 정식 해결 대신 RLS를 꺼버리는 임시방편이 반복되어 발생함 — 001번 마이그레이션 주석에 "배포 전 반드시 재활성화" 경고가 있었으나 지켜지지 않았음). 원래 후보에 있던 `tier_usage_counters`는 004번 마이그레이션에서 이미 삭제된 테이블이라 실제로는 대상에서 제외됨 (실행 중 `relation does not exist` 에러로 발견 → `039` 파일을 `ALTER TABLE IF EXISTS` 방식으로 방어적으로 수정).

**실제 위험도**: 서버 코드는 전부 `service_role` 키만 사용(RLS 우회 권한 있음)하고, 브라우저용 `anon` 키 클라이언트(`lib/supabase/client.ts`)는 실제로 어디서도 사용되지 않는 죽은 코드였기 때문에, 이 시점까지 외부에서 직접 데이터에 접근한 흔적은 없었던 것으로 판단됨. 다만 `anon` 키는 원래 공개되어도 되는 키라서, RLS가 꺼진 채로 두는 것 자체가 언제든 사고로 이어질 수 있는 상태였음.

**조치**: [`039_enable_rls_all_tables.sql`](./039_enable_rls_all_tables.sql)로 25개 테이블 전체 RLS 활성화 (정책 미추가 = anon/authenticated 완전 차단, service_role만 기존대로 동작). 앱 코드 변경 없음.

**향후 재발 방지 원칙**: "permission denied" 에러가 다시 발생해도 **RLS를 끄는 방식으로 해결하지 않는다.** 대신 (1) 정말 `service_role` GRANT가 누락된 것인지 먼저 확인하고, (2) 클라이언트에서 직접 접근이 필요한 경우에만 최소 권한 정책(policy)을 추가한다.

## 2026-08-25 (2차): 021·022 마이그레이션이 실제 DB에 미적용 상태였던 것 발견

**발단**: `/admin/loyalty-settings`에서 저장 시 `Could not find the 'default_revisit_interval_days' column of 'loyalty_settings' in the schema cache` 에러 발생.

**원인**: `021_customer_segments.sql`(← `loyalty_settings.default_revisit_interval_days`, `customer_loyalty.segment` 추가 + `recalculate_customer_segment` 함수)과 `022_churn_risk_alerts.sql`(← `process_churn_risk` 함수)가 git에는 파일로 존재하지만, 실제 Supabase DB에는 **한 번도 실행되지 않은 상태**였음 (`churn_risk_alerts` 테이블만 어떤 경로로든 이미 존재했고, 나머지는 전부 누락). 이 폴더 최상단 안내문("Git에 파일이 있다고 해서 실제로 실행되었음이 보장되지 않는다")이 실제로 발생한 사례.

**영향 범위**: 포인트 정책 저장(`loyalty-settings`)뿐 아니라, 이 컬럼/함수에 의존하는 **고객 세그먼트 자동분류**(`/admin/members`, `/api/admin/segments`, `lib/segments/recalculate.ts`)와 **이탈위험 알림**(`/api/admin/churn-risk`) 기능도 같은 원인으로 조용히 실패하고 있었을 가능성이 높음.

**조치**: `DATABASE_URL`(postgres 직접 연결)로 021, 022 파일 전체를 그대로 재실행 — 두 파일 모두 `ADD COLUMN IF NOT EXISTS` / `CREATE OR REPLACE FUNCTION` / `DROP CONSTRAINT IF EXISTS` 기반이라 재실행해도 안전(멱등)함을 확인 후 적용. 적용 후 `information_schema`로 컬럼 존재, `pg_proc`으로 함수 존재, 실제 PostgREST(Supabase JS 클라이언트) 경유 upsert까지 재현 테스트해서 정상 동작 확인함. 앱 코드는 원래부터 이 컬럼/함수를 전제로 작성되어 있었으므로 코드 변경 없음.

**향후 재발 방지 원칙**: 새 DB 변경 작업을 시작하기 전, 특히 "예전에 만들어뒀던 기능인데 갑자기 에러난다"는 신고가 들어오면 코드보다 먼저 `information_schema.columns` / `pg_proc`으로 **실제 DB 상태부터 확인**한다. 이 폴더의 파일 존재 여부만으로 DB 상태를 판단하지 않는다.

## 2026-08-26: 리워드 교환 시 포인트/재고 차감 시점이 잘못 설계되어 있던 문제

**발단**: 손님이 포인트로 리워드를 교환("교환하기" 클릭)한 뒤, 실제 매장에서 "사장님 확인" 버튼을 누르지 않았는데도 다른 리워드의 "교환하기" 버튼이 비활성화되는 현상이 반복 신고됨.

**원인**: `redeem_points_atomic`이 "교환하기" 클릭 즉시 포인트 잔액과 재고를 차감하도록 설계되어 있었음. 그런데 실제 정책은 "교환하기 = 쿠폰 코드 화면만 보여줌", "사장님 확인 = 실제 차감 확정"이어야 했음. 즉시 차감 방식에서는 손님이 매장에 가기도 전에 포인트가 사라져서, "누르지도 않았는데 사용 처리된 것처럼" 보이는 것이 당연한 결과였음(실제로는 버그가 아니라 설계 자체가 정책과 달랐던 것).

**조치**: [`043_defer_point_deduction_to_confirm.sql`](./043_defer_point_deduction_to_confirm.sql)로 차감 시점을 이동. `coupons.point_cost` 컬럼을 추가해 교환 당시 가격을 쿠폰에 고정 저장하고, `redeem_points_atomic`은 잔액/재고를 조회만 해서 교환 가능 여부만 확인한 뒤 쿠폰 row만 생성하도록 수정. 신규 `confirm_coupon_used_atomic` RPC를 만들어 쿠폰이 실제로 `used`로 확정되는 순간(`/api/me/coupons/[couponId]/confirm-use`, `/api/checkout/[storeId]/approve`의 `apply` 액션) 포인트 차감 + 재고 차감 + `point_ledger` 기록을 한 번에 처리하도록 변경. 실제 DB에 테스트 계정으로 교환→확인 전체 흐름을 재현해 포인트/재고가 각 시점에 정확히 변화하는지 확인함.

**향후 재발 방지 원칙**: "찜/예약" 성격의 액션(여기서는 "교환하기")과 "실제 확정/사용" 액션(여기서는 "사장님 확인")이 분리된 플로우에서는, 잔액 차감 같은 비가역적 부작용을 반드시 확정 액션 쪽에 두어야 한다. 예약 단계에서는 "가능한지 확인"만 하고 실제 상태 변경은 하지 않는다.
