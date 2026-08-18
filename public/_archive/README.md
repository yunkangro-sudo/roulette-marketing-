# 보관된 미사용/중복 이미지 (public/_archive)

앱 코드(.tsx/.ts)에서 실제로 참조되지 않는 이미지, 또는 characters 폴더와 중복된 이미지들을
삭제 대신 이 폴더로 이동해두었습니다 (2026-08-18 정리).

## 폴더별 내용

- root-loose-duplicates/ — 프로젝트 최상위(루트)에 잘못 놓여있던 characters 중복본 5개 + AI 생성 임시 이미지
- public-root-duplicates/ — public/ 바로 아래 있던 crane_claw_arm.png, bg_claw_machine_empty.png 중복본
  (실제 사용본은 public/characters/ 안에 있음)
- 기타/, 버전2이미지/ — 예전 집게 에셋 추출 작업 중 만들어진 중간 산출물/구버전 원본
- landing-v5-unused/ — 랜딩 v5 히어로 이미지 후보였으나 코드에서 미채택된 3개
  (실제 채택본은 public/landing-v5/hero-action.png 등)
- 광고업체/ — 코드에서 참조되지 않는 샘플 매장 사진
- characters/ — public/characters/ 안에서 코드 미참조로 확인된 6개
  - 기본화면.png, 기본화면01.png: 구 집게 추출 스크립트(scripts/_archive/extract-claw-from-base.mjs) 전용 소스, bg_default.png 방식으로 대체됨
  - bg_daangn_promo.png, char_daangn_promo.png, char_grabbed.png, char_megaphone.png: 현재 화면에 연결되지 않음 (향후 당근 프로모션/애니메이션 확장 시 재사용 가능성 있어 보관)

필요한 이미지는 언제든 원래 위치로 다시 옮겨서 사용할 수 있습니다.
