# 설계도 세트 — 데이터모델(ERD) / API 명세 / 개인정보·보안

**범위**: 시스템 구조 설계도(2장 데이터모델 개념도)를 실제 테이블/필드 수준으로 구체화하고, API 명세와 개인정보·보안 원칙까지 코딩 착수 직전 최종 확정한다.

---

## PART 1. 데이터모델 상세 설계 (ERD)

### 1-1. 테이블 정의

**`accounts`** — 모든 계층의 로그인 주체
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| role | enum | super_admin / agency / franchise_hq / franchise_branch / store_owner / staff |
| email | string, unique | 로그인 식별자 |
| password_hash | string | |
| name | string | |
| phone | string, encrypted | 계정 소유자 연락처(참여자 전화번호와 다른 테이블) |
| status | enum | active / suspended / pending |
| agency_id | uuid, nullable (FK → agencies) | agency 역할일 때만 자기 자신을 가리키거나, store_owner가 특정 대리점 소속일 때 참조 |
| created_at, updated_at | timestamp | |

**`agencies`** — 대리점
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| name | string | |
| region | string | 담당 지역 |
| commission_rate | decimal | 수수료율 (%) |
| status | enum | active / inactive |
| created_at | timestamp | |

**`franchises`** — 프랜차이즈 본사
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| name | string | 브랜드명 |
| agency_id | uuid, nullable (FK → agencies) | 대리점 경유 유치 시 참조, 총관리자 직영이면 null |
| status | enum | active / inactive |

**`stores`** — 매장 (시스템 최소 단위)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| owner_type | enum | independent(단일 광고주) / franchise_branch |
| franchise_id | uuid, nullable (FK → franchises) | franchise_branch일 때만 값 존재 |
| agency_id | uuid, nullable (FK → agencies) | independent 매장이 대리점 경유 유치된 경우 |
| name | string | |
| category | enum | 카페/음식점/미용실/기타 (Part 1 마케팅 설계도 CTA 추천 로직에 사용) |
| qr_code_token | string, unique | QR 접속용 고유 토큰 |
| status | enum | active / paused |
| created_at | timestamp | |

**`campaigns`** — 캠페인(이벤트)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| store_id | uuid (FK → stores) | |
| game_type | enum | scratch_card / roulette (5장 플러그인 구조 대응) |
| title | string | |
| marketing_goal | enum | revisit / acquisition / search_exposure / immediate_sale (게임연동마케팅 설계도 1-4 매핑) |
| status | enum | draft / running / ended |
| start_date, end_date | date | |
| coupon_valid_days | int | 기본값 14~30 |
| created_at, updated_at | timestamp | |

**`rewards`** — 캠페인별 보상
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| campaign_id | uuid (FK → campaigns) | |
| label | string | 예: "아메리카노 1,000원 할인" |
| probability | decimal | %, 캠페인 내 합계 100% 서버 검증 |
| daily_limit | int | |
| total_limit | int | |
| remaining_stock | int | |

**`participants`** — 게임 참여자
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| campaign_id | uuid (FK → campaigns) | |
| phone_encrypted | string | 암호화 저장 (2-1 참고) |
| phone_hash | string, indexed | 중복 참여 체크용 단방향 해시 (평문 비교 없이 조회) |
| result_reward_id | uuid (FK → rewards) | |
| consented_at | timestamp | 개인정보 수집 동의 시각 |
| participated_at | timestamp | |

**`coupons`** — 발급된 쿠폰
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| participant_id | uuid (FK → participants) | |
| code | string, unique | 표시용 코드 (모노스페이스 UI 대상) |
| status | enum | issued / used / expired |
| expires_at | timestamp | |
| used_at | timestamp, nullable | |
| used_by_staff_id | uuid, nullable (FK → accounts) | 사용처리한 직원 |

**`cta_events`** — CTA 클릭/전환 로그 (게임연동마케팅 설계도 1-2 매트릭스 그대로 반영)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| participant_id | uuid (FK → participants) | |
| channel | enum | kakao_channel / kakao_share / naver_place / danggeun / review / reservation |
| event_type | enum | click / confirmed | confirmed는 알림톡처럼 서버 확인 가능한 채널만 기록, 나머지는 click까지만 |
| created_at | timestamp | |

**`settlements`** — 정산 (Part 2, 3순위지만 최소 스키마는 미리 확보)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| agency_id | uuid, nullable (FK → agencies) | |
| store_id | uuid, nullable (FK → stores) | |
| period | string | 예: 2026-08 |
| amount | decimal | |
| status | enum | pending / paid |

**`audit_logs`** — 감사로그
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| actor_account_id | uuid (FK → accounts) | |
| action | string | 예: campaign.update, coupon.force_use |
| target_type, target_id | string, uuid | |
| created_at | timestamp | |

### 1-2. 관계 요약

```
agencies 1─* franchises
agencies 1─* stores (independent)
franchises 1─* stores (franchise_branch)
stores 1─* campaigns
campaigns 1─* rewards
campaigns 1─* participants
participants 1─1 coupons
participants 1─* cta_events
accounts *─1 agencies (소속)
```

### 1-3. 인덱스·제약 우선순위

- `participants.phone_hash` + `campaign_id` 복합 인덱스 — 중복 참여 방지 조회가 가장 빈번한 쿼리
- `stores.qr_code_token` unique index — QR 진입 라우팅 성능
- `coupons.code` unique index — 직원 사용처리 화면 조회 성능
- `rewards.probability` — 애플리케이션 레벨에서 캠페인당 합계 100% 검증(DB 제약으로는 표현 어려움, 서버 로직 필수)

---

## PART 2. API 명세 설계도

### 2-1. 엔드포인트 목록 (소비자용)

| 메서드 | 경로 | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/stores/:qrToken` | QR 진입 시 매장/캠페인 정보 조회 | 불필요 |
| POST | `/api/participants` | 전화번호 제출 + 동의 (중복 참여 서버 검증) | 불필요 |
| POST | `/api/participants/:id/play` | 게임 실행, 서버에서 확률 계산 후 결과 반환 | 참여자 세션 토큰 |
| GET | `/api/coupons/:id` | 쿠폰함 조회 | 참여자 세션 토큰 |
| POST | `/api/cta/:channel/click` | CTA 클릭 로그 기록 | 참여자 세션 토큰 |

**설계 원칙**: 게임 결과(당첨 보상)는 **반드시 서버에서 확정**하고 클라이언트는 결과만 받아 애니메이션을 재생한다. 클라이언트가 확률을 계산하게 하면 조작 위험이 있다.

### 2-2. 엔드포인트 목록 (관리자용, 공통 패턴)

| 메서드 | 경로 | 설명 | 권한(3장 매트릭스 기준) |
|---|---|---|---|
| GET | `/api/admin/campaigns` | 캠페인 목록 | store_owner(자기 매장) / franchise_hq(자기 지점 전체) |
| POST | `/api/admin/campaigns` | 캠페인 생성 | store_owner / franchise_hq |
| PATCH | `/api/admin/campaigns/:id` | 캠페인 수정 | 생성자와 동일 소속만 |
| GET | `/api/admin/dashboard` | 전환 퍼널 데이터 | 소속 범위 내 |
| POST | `/api/admin/coupons/:code/use` | 쿠폰 사용처리 | store_owner / staff / franchise_hq |
| GET | `/api/agency/clients` | 소속 광고주 목록 | agency (자기 소속만) |
| GET | `/api/super/agencies` | 전체 대리점 조회 | super_admin 전용 |

**설계 원칙**: 모든 관리자 API는 URL 파라미터로 대상 리소스를 받되, **서버 미들웨어에서 "요청 계정이 이 리소스에 접근 가능한 소속인지"를 매 요청마다 재검증**한다(구조 설계도 5-2 원칙 그대로). 프론트엔드에서 안 보이게 하는 것으로 끝내지 않는다.

### 2-3. 서버 트리거형 API (사용자 요청이 아닌 내부 트리거)

| 트리거 | 설명 |
|---|---|
| 알림톡 발송 배치 | 쿠폰 발급 후 N일 경과 미사용 참여자 대상, 매일 1회 배치로 재방문 알림톡 발송 |
| 쿠폰 만료 처리 배치 | `expires_at` 경과 시 status를 expired로 일괄 변경 |
| 정산 집계 배치 | 매월 1회 agency/store 단위 settlement 레코드 생성 |

---

## PART 3. 개인정보·보안 설계도

전화번호를 직접 수집·저장하는 서비스이므로, 코딩 착수 전 아래 원칙을 최소한으로 확정한다. (**법률 자문이 필요한 영역이므로 아래는 일반적인 기술 설계 원칙이며, 실제 서비스 오픈 전 개인정보처리방침·법무 검토가 별도로 필요하다.**)

### 3-1. 수집·저장 원칙

- 참여 시 동의 문구를 화면에 명시하고 `participants.consented_at`에 동의 시각을 반드시 기록한다 (동의 없는 수집 금지)
- 전화번호는 `phone_encrypted`(암호화 저장)와 `phone_hash`(조회용 단방향 해시)로 이중화해서, DB가 유출돼도 평문 전화번호가 노출되지 않게 한다
- 개인정보 보유기간을 캠페인 정책으로 명시(예: 참여일로부터 1년 후 자동 파기 배치)하고, 이 기간을 관리자 화면에 노출해 광고주도 인지하게 한다
- 알림톡 발송은 정보통신망법상 "수신 동의를 받은 대상"에게만 발송하고, 참여 시 동의 문구에 "재방문 알림 메시지 수신"을 포함해서 별도 동의 절차를 줄인다 (단, 정확한 문구는 법무 검토 필요)

### 3-2. 접근 권한·감사

- `audit_logs`에 개인정보 조회성 API(예: 참여자 목록 조회) 접근도 기록 대상에 포함
- 매장 직원 계정은 쿠폰 사용처리에 필요한 최소 정보(쿠폰 코드, 보상명)만 조회 가능하고, 전화번호 원문은 직원 화면에 노출하지 않는다
- 대리점 계정은 소속 광고주의 참여자 개인정보(전화번호)에 직접 접근할 이유가 없으므로, 대리점 화면에는 집계 통계만 노출하고 개별 참여자 데이터는 노출하지 않는다

### 3-3. 기술적 보안 체크리스트

- [ ] 전화번호 등 민감 필드는 저장 시 암호화, 전송 구간은 HTTPS 강제
- [ ] 관리자 로그인은 세션 만료 시간 설정 (장시간 미사용 시 자동 로그아웃)
- [ ] API Rate Limiting — 특히 `/api/participants`(전화번호 제출)에 어뷰징 방지 적용
- [ ] 쿠폰 코드는 추측 불가능한 랜덤 문자열로 생성 (순차 증가 ID 노출 금지)
- [ ] 관리자 계정 비밀번호는 해시 저장, 총관리자 계정은 2단계 인증 권장

---

## 다음 단계

이 3개(ERD, API, 개인정보·보안)까지 확정되면 지난 대화의 "설계도 8개" 중 코딩 착수 전 필수 항목은 모두 준비된 상태다. 이제 Cursor로 실제 개발을 시작해도 되는 시점이며, 지난 문서(게임연동마케팅설계도 및 전체로드맵)의 3-2 작업 순서 1번(`/lib/schemas`)부터 바로 이 문서의 1장 테이블 정의를 코드로 옮기면 된다.
