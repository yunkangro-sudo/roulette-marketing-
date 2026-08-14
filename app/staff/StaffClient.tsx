'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type ItemType = 'coupon' | 'reward'
type ItemStatus = 'issued' | 'pending_verify' | 'pending_apply' | 'used' | 'expired' | 'unverified'

interface QueueItem {
  id: string
  display_code: string
  seq: number
  kakao_user_id: string | null
  item_type: ItemType
  item_id: string
  label: string | null
  amount: number
  status: 'waiting' | 'confirmed' | 'applied' | 'cancelled'
}

interface WorkingItem {
  item_type: ItemType
  item_id: string
  display_code: string
  label: string
  amount: number
  status: ItemStatus
  short_code?: string
}

const REASONS = ['앱없음', '거부', '기타'] as const

interface Props { storeId: string; role: string }

export default function StaffClient({ storeId, role }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'queue' | 'code'>('queue')
  const [qrEnabled, setQrEnabled] = useState(true)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [code, setCode] = useState('')
  const [codeKind, setCodeKind] = useState<ItemType>('coupon')
  const [working, setWorking] = useState<WorkingItem | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReason, setShowReason] = useState(false)
  const [reason, setReason] = useState('')
  const [banner, setBanner] = useState<WorkingItem | null>(null)

  const locked = !!banner

  const loadQueue = useCallback(async () => {
    if (locked) return
    try {
      const res = await fetch(`/api/checkout/${encodeURIComponent(storeId)}/queue`)
      if (!res.ok) return
      const data = await res.json()
      setQrEnabled(data.qrEnabled !== false)
      setQueue(data.items ?? [])
    } catch { /* ignore */ }
  }, [storeId, locked])

  useEffect(() => {
    loadQueue()
    const t = setInterval(loadQueue, 3000)
    return () => clearInterval(t)
  }, [loadQueue])

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  async function approve(action: 'confirm' | 'apply' | 'reject', item: WorkingItem, rejectReason?: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/checkout/${encodeURIComponent(storeId)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          item_type: item.item_type,
          item_id: item.item_id,
          reason: rejectReason,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '처리에 실패했습니다')
        return false
      }
      return true
    } catch {
      setError('네트워크 오류가 발생했습니다')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!working) return
    const ok = await approve('confirm', working)
    if (!ok) return
    setBanner({ ...working, status: 'pending_apply' })
    setWorking(null)
    setShowReason(false)
  }

  async function handleApply() {
    if (!banner) return
    const ok = await approve('apply', banner)
    if (!ok) return
    setBanner(null)
    setWorking(null)
    loadQueue()
  }

  async function handleReject() {
    if (!working || !reason) return
    const ok = await approve('reject', working, reason)
    if (!ok) return
    setWorking(null)
    setShowReason(false)
    setReason('')
    loadQueue()
  }

  function selectQueue(q: QueueItem) {
    if (locked) return
    setError('')
    setShowReason(false)
    setWorking({
      item_type: q.item_type,
      item_id: q.item_id,
      display_code: q.display_code,
      label: q.label ?? (q.item_type === 'coupon' ? `${q.amount.toLocaleString()}원` : '리워드'),
      amount: q.amount,
      status: q.status === 'confirmed' ? 'pending_apply' : 'pending_verify',
    })
    if (q.status === 'confirmed') {
      setBanner({
        item_type: q.item_type,
        item_id: q.item_id,
        display_code: q.display_code,
        label: q.label ?? '',
        amount: q.amount,
        status: 'pending_apply',
      })
      setWorking(null)
    }
  }

  async function handleCodeLookup() {
    const target = code.trim().toUpperCase()
    if (!target) return
    setLoading(true)
    setError('')
    setShowReason(false)
    try {
      const url = codeKind === 'coupon'
        ? `/api/coupons/lookup?code=${encodeURIComponent(target)}&store_id=${encodeURIComponent(storeId)}`
        : `/api/rewards/lookup?code=${encodeURIComponent(target)}&store_id=${encodeURIComponent(storeId)}`
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '조회에 실패했습니다')
        setWorking(null)
        return
      }
      if (codeKind === 'coupon') {
        const c = data.coupon
        setWorking({
          item_type: 'coupon',
          item_id: c.id,
          display_code: c.short_code ?? '',
          label: `${Number(c.amount).toLocaleString()}원 쿠폰`,
          amount: c.amount,
          status: c.status,
          short_code: c.short_code,
        })
        if (c.status === 'pending_apply') {
          setBanner({
            item_type: 'coupon',
            item_id: c.id,
            display_code: c.short_code ?? '—',
            label: `${Number(c.amount).toLocaleString()}원 쿠폰`,
            amount: c.amount,
            status: 'pending_apply',
          })
          setWorking(null)
        }
      } else {
        const r = data.reward
        const amount = r.reward_catalog?.point_cost ?? 0
        setWorking({
          item_type: 'reward',
          item_id: r.id,
          display_code: r.short_code ?? '',
          label: r.reward_catalog?.name ?? '리워드',
          amount,
          status: r.status,
          short_code: r.short_code,
        })
        if (r.status === 'pending_apply') {
          setBanner({
            item_type: 'reward',
            item_id: r.id,
            display_code: r.short_code ?? '—',
            label: r.reward_catalog?.name ?? '리워드',
            amount,
            status: 'pending_apply',
          })
          setWorking(null)
        }
      }
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">계산대</h1>
            <p className="text-xs text-gray-500 mt-0.5">{storeId} · {role}</p>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">로그아웃</button>
        </div>

        <div className="flex gap-2 mb-5">
          <button onClick={() => !locked && setTab('queue')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab === 'queue' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
            QR 대기 {queue.length > 0 ? `(${queue.length})` : ''}
          </button>
          <button onClick={() => !locked && setTab('code')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab === 'code' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
            코드 입력
          </button>
        </div>

        {tab === 'queue' && (
          <div className="mb-5">
            {!qrEnabled && (
              <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-3">
                QR 자동조회가 꺼져 있습니다. 코드 입력 탭을 사용하세요.
              </p>
            )}
            {qrEnabled && queue.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">대기 중인 손님이 없습니다</p>
            )}
            <div className="space-y-2">
              {queue.map((q) => (
                <button key={q.id} onClick={() => selectQueue(q)} disabled={locked}
                  className="w-full text-left bg-white border-2 border-gray-200 hover:border-orange-400 rounded-xl px-4 py-3 disabled:opacity-40">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-2xl text-orange-500 tracking-wide">{q.display_code}</span>
                    <span className="text-sm font-bold text-gray-900">{q.label ?? `${q.amount.toLocaleString()}원`}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {q.item_type === 'coupon' ? '쿠폰' : '리워드'} · {q.status === 'confirmed' ? '할인 적용 대기' : '단골 확인 대기'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'code' && (
          <div className="mb-5">
            <div className="flex gap-2 mb-3">
              <button onClick={() => setCodeKind('coupon')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold ${codeKind === 'coupon' ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600'}`}>쿠폰</button>
              <button onClick={() => setCodeKind('reward')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold ${codeKind === 'reward' ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600'}`}>리워드</button>
            </div>
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCodeLookup() }}
                placeholder="6자리 코드" maxLength={8} disabled={locked}
                className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-mono tracking-widest" />
              <button onClick={handleCodeLookup} disabled={loading || locked}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-40">조회</button>
            </div>
          </div>
        )}

        {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm font-semibold">{error}</div>}

        {working && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
            {working.display_code && (
              <p className="text-center font-black text-4xl text-orange-500 mb-3">{working.display_code}</p>
            )}
            <p className="text-center font-bold text-xl text-gray-900 mb-1">{working.label}</p>
            <p className="text-center text-sm text-gray-500 mb-5">
              {working.item_type === 'coupon' ? `${working.amount.toLocaleString()}원` : `${working.amount.toLocaleString()}P`}
              {working.short_code ? ` · ${working.short_code}` : ''}
            </p>

            {working.status === 'used' ? (
              <div className="bg-gray-100 text-gray-600 rounded-lg px-4 py-4 text-center font-bold">이미 사용된 경품입니다</div>
            ) : working.status === 'expired' ? (
              <div className="bg-gray-100 text-gray-600 rounded-lg px-4 py-4 text-center font-bold">사용기간이 지난 경품입니다</div>
            ) : working.status === 'pending_apply' ? (
              <p className="text-center text-sm text-gray-500">할인 적용 안내가 열려 있습니다</p>
            ) : !showReason ? (
              <div>
                <p className="text-center text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                  손님 폰의 당근 단골 화면을 확인한 뒤 아래를 눌러주세요. 확인 방법은 매장 재량입니다.
                </p>
                <div className="flex gap-3">
                  <button onClick={handleConfirm} disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-lg text-lg font-bold disabled:opacity-40">확인함</button>
                  <button onClick={() => setShowReason(true)} disabled={loading}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-4 rounded-lg text-lg font-bold">미확인 처리</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-bold text-gray-700 mb-3">미확인 사유</p>
                <div className="flex gap-2 mb-4">
                  {REASONS.map((r) => (
                    <button key={r} onClick={() => setReason(r)}
                      className={`flex-1 py-3 rounded-lg text-sm font-bold border-2 ${reason === r ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300'}`}>{r}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowReason(false); setReason('') }} className="flex-1 bg-gray-200 py-3 rounded-lg font-bold">취소</button>
                  <button onClick={handleReject} disabled={!reason || loading} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold disabled:opacity-40">미확인 확정</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {banner && (
        <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center px-6"
          onClick={(e) => e.stopPropagation()}>
          <p className="text-orange-400 font-black text-7xl tracking-wide mb-6">{banner.display_code}</p>
          <p className="text-white font-black text-6xl sm:text-7xl mb-4 tabular-nums">
            {banner.item_type === 'coupon'
              ? `${banner.amount.toLocaleString()}원`
              : banner.label}
          </p>
          <p className="text-white/80 text-xl font-bold text-center mb-10">계산대에서 이 금액을 적용해주세요</p>
          <button onClick={handleApply} disabled={loading}
            className="w-full max-w-sm bg-orange-500 hover:bg-orange-400 text-white py-5 rounded-2xl text-xl font-black disabled:opacity-40">
            {loading ? '처리 중...' : '할인 적용 완료'}
          </button>
          {error && <p className="text-red-400 text-sm mt-4 font-semibold">{error}</p>}
        </div>
      )}
    </div>
  )
}
