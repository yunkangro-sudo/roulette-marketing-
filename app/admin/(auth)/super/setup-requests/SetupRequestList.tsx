'use client'

import { useMemo, useState } from 'react'
import {
  POINTS_PER_VISIT,
  SETUP_STATUSES,
  productLabel,
  type SetupPrize,
  type SetupReward,
  type SetupStatus,
} from '@/lib/setup-request/types'

export type SetupRequestItem = {
  id: string
  storeName: string
  address: string | null
  phone: string
  salespersonName: string
  salespersonPhone: string | null
  products: string[]
  hqCall: boolean
  prizes: SetupPrize[]
  rewards: SetupReward[]
  daangnUrl: string | null
  naverReviewUrl: string | null
  googleReviewUrl: string | null
  naverPlaceUrl: string | null
  intro: string | null
  businessHours: string | null
  openDate: string | null
  photoViaKakao: boolean
  memo: string | null
  status: SetupStatus
  createdAt: string
}

const BADGE: Record<SetupStatus, string> = {
  received: 'bg-amber-100 text-amber-700',
  setting: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SetupRequestList({ items: initialItems }: { items: SetupRequestItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [openId, setOpenId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [productFilter, setProductFilter] = useState<'all' | string>('all')

  const filtered = useMemo(() => {
    if (productFilter === 'all') return items
    return items.filter((item) => item.products.includes(productFilter))
  }, [items, productFilter])

  async function updateStatus(id: string, status: SetupStatus) {
    setSavingId(id)
    try {
      const res = await fetch(`/api/admin/setup-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
    } catch {
      alert('상태 변경에 실패했습니다.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto">
        {[
          { id: 'all', label: '전체' },
          { id: 'dangolting', label: '단골팅' },
          { id: 'danggeun', label: '당근마케팅' },
          { id: 'aeo', label: 'AEO마케팅' },
        ].map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setProductFilter(filter.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${
              productFilter === filter.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400">{filtered.length}건</p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-400">
          아직 접수가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const open = openId === item.id
            return (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{item.storeName}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.address ? `${item.address} · ` : ''}
                      광고주 {item.phone}
                      {item.salespersonPhone ? ` · 영업 ${item.salespersonName} ${item.salespersonPhone}` : ` · ${item.salespersonName}`}
                      {' · '}
                      {formatDate(item.createdAt)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.products.map((id) => (
                        <span key={id} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          {productLabel(id)}
                        </span>
                      ))}
                      {item.hqCall && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">본사 통화</span>
                      )}
                    </div>
                  </div>
                  <select
                    value={item.status}
                    disabled={savingId === item.id}
                    onChange={(e) => updateStatus(item.id, e.target.value as SetupStatus)}
                    className={`rounded-lg px-3 py-2 text-sm font-bold ${BADGE[item.status]}`}
                  >
                    {SETUP_STATUSES.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="mt-3 text-sm font-semibold text-gray-500"
                >
                  {open ? '접기' : '접수 내용 보기'}
                </button>

                {open && (
                  <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 text-sm text-gray-800">
                    {item.prizes.length > 0 && (
                      <div>
                        <p className="font-bold">게임 경품</p>
                        <ul className="mt-1 space-y-1">
                          {item.prizes.map((prize, i) => (
                            <li key={i}>
                              {prize.content} · 월 {prize.monthlyQty}개
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.rewards.length > 0 && (
                      <div>
                        <p className="font-bold">방문 리워드 · 1회 {POINTS_PER_VISIT}포인트</p>
                        <ul className="mt-1 space-y-1">
                          {item.rewards.map((reward, i) => (
                            <li key={i}>
                              {reward.visits}회 · {reward.name} · {reward.visits * POINTS_PER_VISIT}포인트
                              {reward.monthlyQty ? ` · 월 ${reward.monthlyQty}개` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="space-y-1 break-all">
                      {item.daangnUrl && <p>당근 단골: {item.daangnUrl}</p>}
                      {item.naverReviewUrl && <p>네이버 후기: {item.naverReviewUrl}</p>}
                      {item.googleReviewUrl && <p>구글 후기: {item.googleReviewUrl}</p>}
                      {item.naverPlaceUrl && <p>네이버 플레이스: {item.naverPlaceUrl}</p>}
                      {item.intro && <p>소개: {item.intro}</p>}
                      {item.businessHours && <p>영업시간: {item.businessHours}</p>}
                      {item.openDate && <p>오픈 희망일: {item.openDate}</p>}
                      <p>사진: {item.photoViaKakao ? '카카오톡으로 보낼 예정' : '없음. 본사가 채움'}</p>
                      {item.memo && <p>메모: {item.memo}</p>}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
