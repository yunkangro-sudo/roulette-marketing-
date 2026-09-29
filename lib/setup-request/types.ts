export const SETUP_PRODUCTS = [
  { id: 'dangolting', label: '단골팅' },
  { id: 'danggeun', label: '당근마케팅' },
  { id: 'aeo', label: 'AEO마케팅' },
] as const

export type SetupProductId = (typeof SETUP_PRODUCTS)[number]['id']

export const SETUP_STATUSES = [
  { id: 'received', label: '접수' },
  { id: 'setting', label: '세팅중' },
  { id: 'done', label: '완료' },
] as const

export type SetupStatus = (typeof SETUP_STATUSES)[number]['id']

export type SetupPrize = { content: string; monthlyQty: number }
export type SetupReward = { name: string; visits: number; monthlyQty: number | null }

export const POINTS_PER_VISIT = 100

export function productLabel(id: string): string {
  return SETUP_PRODUCTS.find((p) => p.id === id)?.label ?? id
}
