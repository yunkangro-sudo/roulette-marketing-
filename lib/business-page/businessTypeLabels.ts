/**
 * 업종별 라벨 매핑 — 공개 페이지("⑤ 대표 상품/메뉴/서비스" 섹션명)와 관리자 입력폼
 * (헬스장 사장님에게 "메뉴 이름을 입력하세요"가 뜨면 안 됨) 양쪽에서 재사용한다.
 *
 * 업종이 늘어나면 이 매핑에 항목만 추가하면 된다 — 코드의 switch문을 건드릴 필요 없음.
 */

export type BusinessType = 'restaurant' | 'cafe' | 'salon' | 'gym' | 'academy' | 'service'

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: 'restaurant', label: '식당' },
  { value: 'cafe', label: '카페' },
  { value: 'salon', label: '미용/시술' },
  { value: 'gym', label: '체육시설' },
  { value: 'academy', label: '학원/교육' },
  { value: 'service', label: '기타 서비스' },
]

export const DEFAULT_BUSINESS_TYPE: BusinessType = 'service'

/** "⑤ 대표 ○○" 섹션 제목에 들어갈 명칭 */
export const PRODUCT_SECTION_LABEL: Record<BusinessType, string> = {
  restaurant: '대표 메뉴',
  cafe: '인기 메뉴',
  salon: '대표 시술',
  gym: '대표 프로그램',
  academy: '주요 서비스',
  service: '주요 서비스',
}

/** 관리자 입력폼에서 개별 항목을 가리킬 때 쓰는 명칭 (예: "메뉴 이름", "시술 이름") */
export const PRODUCT_ITEM_LABEL: Record<BusinessType, string> = {
  restaurant: '메뉴',
  cafe: '메뉴',
  salon: '시술',
  gym: '프로그램',
  academy: '서비스',
  service: '서비스',
}

export function isBusinessType(value: unknown): value is BusinessType {
  return typeof value === 'string' && BUSINESS_TYPE_OPTIONS.some((o) => o.value === value)
}

export function resolveBusinessType(value: unknown): BusinessType {
  return isBusinessType(value) ? value : DEFAULT_BUSINESS_TYPE
}
