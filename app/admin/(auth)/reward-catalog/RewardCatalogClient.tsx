'use client'

import { useEffect, useState, useCallback } from 'react'
import StoreSelector from '../components/StoreSelector'

type RewardType = 'free_item' | 'discount' | 'points' | 'experience' | 'special_coupon' | 'vip_reward'
type ExtraFieldKey = 'discount_amount'

interface Reward {
  id: string
  name: string
  point_cost: number
  active: boolean
  stock: number | null
  requires_verification: boolean
  reward_type: RewardType
  start_at: string | null
  end_at: string | null
  image_url: string | null
  discount_amount: number | null
}

interface Props { role: string; storeId: string | null }

const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  free_item:      '무료 상품',
  discount:       '할인 쿠폰',
  points:         '포인트 추가',
  experience:     '체험 서비스',
  special_coupon: '특별 쿠폰',
  vip_reward:     'VIP 전용',
}

const REWARD_TYPE_OPTIONS: { value: RewardType; label: string }[] = [
  { value: 'free_item',      label: '무료 상품 (예: 아메리카노 1잔)' },
  { value: 'discount',       label: '할인 쿠폰 (예: 3,000원 할인)' },
  { value: 'points',         label: '포인트 추가 (예: 500P 추가 적립)' },
  { value: 'experience',     label: '체험 서비스 (예: 무료 시식/시음)' },
  { value: 'special_coupon', label: '특별 쿠폰 (한정 이벤트용)' },
  { value: 'vip_reward',     label: 'VIP 전용 리워드' },
]

// 리워드 유형별로 추가로 노출할 입력 필드 목록.
// 나중에 다른 유형에 전용 필드(예: 체험서비스의 "체험 내용")를 추가하려면
// 여기 배열에 키만 늘리고, RewardFormFields의 해당 분기만 추가하면 된다.
const REWARD_TYPE_EXTRA_FIELDS: Record<RewardType, ExtraFieldKey[]> = {
  free_item:      [],
  discount:       ['discount_amount'],
  points:         [],
  experience:     [],
  special_coupon: [],
  vip_reward:     [],
}

interface RewardFormValues {
  name: string
  pointCost: string
  stock: string
  rewardType: RewardType
  timeLimited: boolean
  startAt: string
  endAt: string
  imageUrl: string
  requiresVerification: boolean
  discountAmount: string
}

function emptyForm(): RewardFormValues {
  return {
    name: '', pointCost: '', stock: '', rewardType: 'free_item',
    timeLimited: false, startAt: '', endAt: '', imageUrl: '',
    requiresVerification: true, discountAmount: '',
  }
}

function formFromReward(r: Reward): RewardFormValues {
  return {
    name: r.name,
    pointCost: String(r.point_cost),
    stock: r.stock === null ? '' : String(r.stock),
    rewardType: r.reward_type ?? 'free_item',
    timeLimited: !!(r.start_at || r.end_at),
    startAt: toDateInputValue(r.start_at),
    endAt: toDateInputValue(r.end_at),
    imageUrl: r.image_url ?? '',
    requiresVerification: r.requires_verification,
    discountAmount: r.discount_amount === null ? '' : String(r.discount_amount),
  }
}

type FormErrors = Partial<Record<'name' | 'pointCost' | 'discountAmount', string>>

function validateRewardForm(f: RewardFormValues): FormErrors {
  const errors: FormErrors = {}
  if (!f.name.trim()) errors.name = '리워드 이름을 입력해주세요'

  const cost = Number(f.pointCost)
  if (!f.pointCost || !Number.isFinite(cost) || cost <= 0) {
    errors.pointCost = '필요 포인트는 0보다 큰 숫자로 입력해주세요'
  }

  if (REWARD_TYPE_EXTRA_FIELDS[f.rewardType].includes('discount_amount')) {
    const amt = Number(f.discountAmount)
    if (!f.discountAmount || !Number.isFinite(amt) || amt <= 0) {
      errors.discountAmount = '할인 쿠폰은 할인 금액을 꼭 입력해야 해요'
    }
  }

  return errors
}

function toDateInputValue(isoStr: string | null): string {
  if (!isoStr) return ''
  return isoStr.slice(0, 10)  // "YYYY-MM-DD"
}

function toISODateEnd(dateStr: string): string {
  // 선택한 날짜의 23:59:59 KST → UTC
  return dateStr ? `${dateStr}T23:59:59+09:00` : ''
}

function buildRewardPayload(f: RewardFormValues) {
  const extraFields = REWARD_TYPE_EXTRA_FIELDS[f.rewardType]
  return {
    name: f.name,
    point_cost: f.pointCost,
    stock: f.stock || null,
    requires_verification: f.requiresVerification,
    reward_type: f.rewardType,
    start_at: f.timeLimited && f.startAt ? `${f.startAt}T00:00:00+09:00` : null,
    end_at: f.timeLimited && f.endAt ? toISODateEnd(f.endAt) : null,
    image_url: f.imageUrl || null,
    discount_amount: extraFields.includes('discount_amount') && f.discountAmount ? f.discountAmount : null,
  }
}

/** 지금 이 리워드가 손님 화면에 실제로 보이는지를 사장님이 한눈에 알 수 있게 풀어쓴 문구 */
function getExposureInfo(r: Reward): { label: string; tone: 'green' | 'amber' | 'gray' } {
  const now = new Date()
  const isExpired = r.end_at ? new Date(r.end_at) < now : false
  const isNotStarted = r.start_at ? new Date(r.start_at) > now : false

  if (!r.active) {
    return { label: '비활성 상태예요 — 손님 화면엔 보이지 않아요', tone: 'gray' }
  }
  if (isExpired) {
    return { label: '활성 상태지만 노출기간이 지나 손님껜 안 보여요', tone: 'amber' }
  }
  if (isNotStarted) {
    return { label: '활성 상태지만 시작일 전이라 아직 손님껜 안 보여요', tone: 'gray' }
  }
  return { label: '지금 손님 화면에 보이고 있어요', tone: 'green' }
}

const EXPOSURE_TONE_CLASS: Record<'green' | 'amber' | 'gray', string> = {
  green: 'bg-green-50 border-green-200 text-green-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  gray:  'bg-gray-100 border-gray-200 text-gray-500',
}

/** 등록 폼과 수정 모달이 공유하는 입력 필드 묶음 — 새 유형별 필드를 추가할 때도 이 컴포넌트만 고치면 된다 */
function RewardFormFields({
  values, onChange, errors,
}: {
  values: RewardFormValues
  onChange: (patch: Partial<RewardFormValues>) => void
  errors: FormErrors
}) {
  const extraFields = REWARD_TYPE_EXTRA_FIELDS[values.rewardType]

  return (
    <>
      {/* 리워드 유형 */}
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">리워드 유형</label>
        <select value={values.rewardType} onChange={(e) => onChange({ rewardType: e.target.value as RewardType })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          {REWARD_TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 이름 / 포인트 / 재고 */}
      <div className="grid grid-cols-3 gap-3 mb-1">
        <div className="col-span-3 sm:col-span-1">
          <label className="block text-xs text-gray-500 mb-1">리워드 이름</label>
          <input value={values.name} onChange={(e) => onChange({ name: e.target.value })}
            placeholder="예: 아메리카노 1잔, 마른안주 세트, 5,000원 할인"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">필요 포인트</label>
          <input type="number" value={values.pointCost}
            onChange={(e) => onChange({ pointCost: e.target.value })}
            placeholder="50" min={1}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">재고 (빈칸=무제한)</label>
          <input type="number" value={values.stock} onChange={(e) => onChange({ stock: e.target.value })} placeholder="무제한" min={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      {(errors.name || errors.pointCost) && (
        <p className="text-xs text-red-600 font-medium mb-2">{errors.name ?? errors.pointCost}</p>
      )}

      {/* 할인 금액 — 유형이 "할인 쿠폰"일 때만 표시 */}
      {extraFields.includes('discount_amount') && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">할인 금액 (원)</label>
          <input type="number" value={values.discountAmount} onChange={(e) => onChange({ discountAmount: e.target.value })}
            placeholder="3000" min={1}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <p className="text-xs text-gray-400 mt-1">결제 시 이 금액만큼 할인 적용돼요.</p>
          {errors.discountAmount && (
            <p className="text-xs text-red-600 font-medium mt-1">{errors.discountAmount}</p>
          )}
        </div>
      )}

      {/* 이미지 URL */}
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">이미지 URL (선택)</label>
        <input value={values.imageUrl} onChange={(e) => onChange({ imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>

      {/* 기간 한정 */}
      <label className="flex items-center gap-2 cursor-pointer mb-2">
        <input type="checkbox" checked={values.timeLimited} onChange={(e) => onChange({ timeLimited: e.target.checked })}
          className="h-4 w-4 accent-orange-500 cursor-pointer" />
        <span className="text-sm text-gray-700 font-medium">기간 한정으로 운영</span>
        <span className="text-xs text-gray-400">(미체크 시 상시 노출)</span>
      </label>
      {values.timeLimited && (
        <div className="flex gap-3 mb-3 pl-6">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">시작일</label>
            <input type="date" value={values.startAt} onChange={(e) => onChange({ startAt: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">종료일</label>
            <input type="date" value={values.endAt} onChange={(e) => onChange({ endAt: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      )}

      {/* 본인확인(당근 단골) 필요 여부 */}
      <label className="flex items-start gap-2 cursor-pointer mb-1 mt-1">
        <input type="checkbox" checked={values.requiresVerification}
          onChange={(e) => onChange({ requiresVerification: e.target.checked })}
          className="h-4 w-4 mt-0.5 accent-orange-500 cursor-pointer" />
        <span className="text-sm text-gray-700 font-medium">본인확인(당근 단골) 필요</span>
      </label>
      <p className="text-xs text-gray-400 mb-1 pl-6">
        켜두면 계산대에서 당근 단골 확인 후에만 지급돼요. 소액 리워드는 꺼도 괜찮아요.
      </p>
    </>
  )
}

export default function RewardCatalogClient({ role, storeId }: Props) {
  const [selectedStore, setSelectedStore] = useState(storeId ?? '')
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  // 새 리워드 등록 폼 상태
  const [newForm, setNewForm] = useState<RewardFormValues>(emptyForm())
  const [adding, setAdding] = useState(false)
  const newErrors = validateRewardForm(newForm)
  const newHasError = Object.keys(newErrors).length > 0

  // 수정 모달 상태
  const [editing, setEditing] = useState<Reward | null>(null)
  const [editForm, setEditForm] = useState<RewardFormValues>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [editMessage, setEditMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const editErrors = validateRewardForm(editForm)
  const editHasError = Object.keys(editErrors).length > 0

  const load = useCallback(async (sid: string) => {
    if (!sid) return
    setLoading(true)
    const res = await fetch(`/api/admin/reward-catalog?store_id=${encodeURIComponent(sid)}`)
    if (res.ok) setRewards(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    if (selectedStore) load(selectedStore)
    else setRewards([])
  }, [selectedStore, load])

  async function handleAdd() {
    if (!selectedStore) { setMessage({ text: '매장을 먼저 선택해주세요', ok: false }); return }
    if (newHasError) return
    setAdding(true)
    setMessage(null)
    const res = await fetch('/api/admin/reward-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_id: selectedStore, ...buildRewardPayload(newForm) }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage({ text: data.error ?? '등록 실패', ok: false })
    } else {
      setNewForm(emptyForm())
      setMessage({ text: '✅ 리워드가 등록되었습니다', ok: true })
      await load(selectedStore)
    }
    setAdding(false)
  }

  async function toggleActive(r: Reward) {
    await fetch(`/api/admin/reward-catalog/${r.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !r.active }),
    })
    await load(selectedStore)
  }

  async function updateStock(r: Reward, val: string) {
    await fetch(`/api/admin/reward-catalog/${r.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: val }),
    })
    await load(selectedStore)
  }

  function openEdit(r: Reward) {
    setEditing(r)
    setEditForm(formFromReward(r))
    setEditMessage(null)
  }

  function closeEdit() {
    setEditing(null)
    setEditMessage(null)
  }

  async function handleSaveEdit() {
    if (!editing || editHasError) return
    setSaving(true)
    setEditMessage(null)
    const res = await fetch(`/api/admin/reward-catalog/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRewardPayload(editForm)),
    })
    const data = await res.json()
    if (!res.ok) {
      setEditMessage({ text: data.error ?? '저장 실패', ok: false })
    } else {
      await load(selectedStore)
      closeEdit()
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-2">리워드 카탈로그</h1>
      <p className="text-sm text-gray-500 mb-4">
        금액 쿠폰뿐 아니라 특정 메뉴·상품도 리워드로 등록할 수 있어요
      </p>

      <div className="mb-5">
        <StoreSelector role={role} sessionStoreId={storeId} selectedStoreId={selectedStore} onSelect={setSelectedStore} />
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          message.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>{message.text}</div>
      )}

      {selectedStore ? (
        <>
          {/* ── 새 리워드 등록 ─────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">새 리워드 등록</h2>

            <RewardFormFields
              values={newForm}
              onChange={(patch) => setNewForm((prev) => ({ ...prev, ...patch }))}
              errors={newErrors}
            />

            <button onClick={handleAdd} disabled={adding || newHasError}
              className="mt-3 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50 transition-colors">
              {adding ? '등록 중...' : '+ 등록'}
            </button>
          </div>

          {/* ── 리워드 목록 ────────────────────────────────── */}
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-8">불러오는 중...</p>
          ) : rewards.length === 0 ? (
            <div className="bg-gray-50 rounded-xl border border-gray-200 py-10 text-center text-gray-400 text-sm">
              등록된 리워드가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map((r) => {
                const exposure = getExposureInfo(r)
                const periodNote = r.start_at || r.end_at
                  ? `${r.start_at ? toDateInputValue(r.start_at) : '시작일 없음'} ~ ${r.end_at ? toDateInputValue(r.end_at) : '종료일 없음'}`
                  : '상시 노출'

                return (
                  <div key={r.id} onClick={() => openEdit(r)}
                    className={`bg-white border rounded-xl px-5 py-4 cursor-pointer hover:border-orange-300 transition-colors ${
                    exposure.tone === 'green' ? 'border-gray-200' : 'border-gray-100 opacity-70'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                            {REWARD_TYPE_LABELS[r.reward_type ?? 'free_item']}
                          </span>
                          {r.requires_verification && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium shrink-0">본인확인</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-sm text-orange-500 font-bold">{r.point_cost.toLocaleString()}P</p>
                          {r.reward_type === 'discount' && r.discount_amount ? (
                            <span className="text-xs text-orange-600 font-semibold">{r.discount_amount.toLocaleString()}원 할인</span>
                          ) : null}
                          <span className="text-xs text-gray-400">{periodNote}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>재고:</span>
                          <input type="number" defaultValue={r.stock ?? ''} onBlur={(e) => updateStock(r, e.target.value)}
                            placeholder="∞" min={0}
                            className="w-16 border border-gray-200 rounded px-2 py-1 text-center text-xs" />
                        </div>
                        <button onClick={() => toggleActive(r)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                            r.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}>
                          {r.active ? '활성' : '비활성'}
                        </button>
                      </div>
                    </div>
                    <p className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded-lg border ${EXPOSURE_TONE_CLASS[exposure.tone]}`}>
                      {exposure.label}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
          위에서 매장을 선택하면 리워드를 관리할 수 있습니다
        </div>
      )}

      {/* ── 리워드 수정 모달 ────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-8" onClick={closeEdit}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">리워드 수정</h2>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* 지금 손님 화면에 실제로 보이는 상태인지 한눈에 표시 */}
            <p className={`mb-4 inline-block text-xs font-medium px-2.5 py-1.5 rounded-lg border ${EXPOSURE_TONE_CLASS[getExposureInfo(editing).tone]}`}>
              {getExposureInfo(editing).label}
            </p>

            {editMessage && (
              <div className={`mb-3 px-3 py-2 rounded-lg text-sm font-medium ${
                editMessage.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>{editMessage.text}</div>
            )}

            <RewardFormFields
              values={editForm}
              onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
              errors={editErrors}
            />

            <div className="flex gap-2 mt-4">
              <button onClick={closeEdit}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">
                취소
              </button>
              <button onClick={handleSaveEdit} disabled={saving || editHasError}
                className="flex-1 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-5 py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
