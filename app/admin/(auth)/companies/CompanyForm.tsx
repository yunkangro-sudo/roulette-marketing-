'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Company {
  id?: string
  store_id: string
  store_name: string
  contract_start_date: string
  contract_end_date: string
  ad_amount: number
  contractor_name: string
  manager_name: string
  phone?: string
  website?: string
  address?: string
  remarks?: string
  daangn_url?: string
  kakao_channel_url?: string
  business_type?: string
  /** 서버에서 fetch한 광고주 이메일 (edit 모드 전용, 읽기전용) */
  advertiserEmail?: string
}

const BUSINESS_TYPES = [
  '카페·베이커리', '음식점·식당', '주점·바', '미용실·네일',
  '헬스·필라테스', '소매·편의점', '학원·교습소', '기타',
]

interface Props {
  mode: 'create' | 'edit'
  initial?: Company
}

export default function CompanyForm({ mode, initial }: Props) {
  const router = useRouter()

  const [form, setForm] = useState<Company>({
    store_id:            initial?.store_id            ?? '',
    store_name:          initial?.store_name          ?? '',
    contract_start_date: initial?.contract_start_date ?? '',
    contract_end_date:   initial?.contract_end_date   ?? '',
    ad_amount:           initial?.ad_amount           ?? 0,
    contractor_name:     initial?.contractor_name     ?? '',
    manager_name:        initial?.manager_name        ?? '',
    phone:               initial?.phone               ?? '',
    website:             initial?.website             ?? '',
    address:             initial?.address             ?? '',
    remarks:             initial?.remarks             ?? '',
    daangn_url:          initial?.daangn_url          ?? '',
    kakao_channel_url:   initial?.kakao_channel_url   ?? '',
    business_type:       initial?.business_type       ?? '',
  })

  // 생성 모드 전용: 광고주 이메일 입력
  const [newAdvertiserEmail, setNewAdvertiserEmail] = useState('')
  // 1회 표시용 임시 비밀번호 (생성 or 재발급)
  const [tempPassword, setTempPassword]   = useState('')
  const [shownEmail, setShownEmail]       = useState('')

  // 비밀번호 재발급 UI 상태
  const [resetLoading, setResetLoading]   = useState(false)
  const [resetError, setResetError]       = useState('')

  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: keyof Company, value: string | number) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  // ── 비밀번호 재발급 ────────────────────────────────────────────
  async function handleResetPassword() {
    if (!confirm('새 임시 비밀번호를 발급하시겠습니까?\n기존 비밀번호는 즉시 무효화됩니다.')) return
    setResetError('')
    setResetLoading(true)
    try {
      const res = await fetch('/api/admin/companies/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: form.store_id }),
      })
      const data = await res.json()
      if (!res.ok) { setResetError(data.error ?? '재발급 실패'); return }
      setTempPassword(data.temp_password)
      setShownEmail(data.email)
    } catch {
      setResetError('네트워크 오류가 발생했습니다')
    } finally {
      setResetLoading(false)
    }
  }

  // ── 저장 ──────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.store_id.trim() || !form.store_name.trim()) {
      setError('매장 ID와 업체명은 필수입니다'); return
    }
    if (!form.contract_start_date || !form.contract_end_date) {
      setError('계약 기간을 입력해주세요'); return
    }
    if (mode === 'create' && !newAdvertiserEmail.trim()) {
      setError('광고주 로그인 이메일을 입력해주세요'); return
    }

    setLoading(true)
    try {
      if (mode === 'create') {
        const res = await fetch('/api/admin/companies/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, advertiser_email: newAdvertiserEmail }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? '저장 실패'); return }
        setShownEmail(newAdvertiserEmail)
        setTempPassword(data.temp_password)
      } else {
        const res = await fetch(`/api/admin/companies/${initial?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_name:          form.store_name,
            contract_start_date: form.contract_start_date,
            contract_end_date:   form.contract_end_date,
            ad_amount:           form.ad_amount,
            contractor_name:     form.contractor_name,
            manager_name:        form.manager_name,
            phone:               form.phone   || null,
            website:             form.website || null,
            address:             form.address || null,
            remarks:             form.remarks || null,
            business_type:       form.business_type || null,
            daangn_url:          form.daangn_url || null,
            kakao_channel_url:   form.kakao_channel_url || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? '저장 실패'); return }
        setSuccess('저장되었습니다')
        router.refresh()
      }
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // ── 임시 비밀번호 발급 완료 화면 ─────────────────────────────
  if (tempPassword) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-green-800 mb-2">
            {mode === 'create' ? '업체 등록 완료!' : '비밀번호 재발급 완료!'}
          </h2>
          <p className="text-green-700 text-sm mb-6">
            {mode === 'create'
              ? '광고주 계정이 생성되었습니다. 아래 임시 비밀번호를 광고주에게 직접 전달하세요.'
              : '비밀번호가 재발급되었습니다. 광고주에게 직접 전달하세요.'}
          </p>

          <div className="bg-white border border-green-200 rounded-xl p-5 mb-6 text-left space-y-2">
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 w-28 shrink-0">이메일</span>
              <span className="font-mono font-bold text-gray-900">{shownEmail}</span>
            </div>
            <div className="flex gap-2 text-sm items-center">
              <span className="text-gray-500 w-28 shrink-0">비밀번호</span>
              <span className="font-mono font-bold text-orange-600 text-lg tracking-widest">{tempPassword}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 w-28 shrink-0">로그인 URL</span>
              <span className="font-mono text-blue-600">/admin/login</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6">
            💡 비밀번호 규칙: <span className="font-mono">이메일 아이디 + 1234</span> (예: {shownEmail.split('@')[0] || 'abc'}1234)
            — 나중에 잊어버려도 이 규칙으로 바로 알 수 있고, 다시 이 화면에 오려면 &quot;비밀번호 재발급&quot;을 누르면 됩니다.
          </p>

          <Link href="/admin/companies"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-lg transition-colors">
            업체 리스트로 이동
          </Link>
        </div>
      </div>
    )
  }

  // ── 폼 ───────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/companies" className="text-gray-400 hover:text-gray-600 text-sm">← 목록으로</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">
          {mode === 'create' ? '신규 업체 등록' : '업체 정보 수정'}
        </h1>
      </div>

      {error   && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── 기본 정보 ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">기본 정보</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">매장 ID *</label>
              <input value={form.store_id} onChange={(e) => set('store_id', e.target.value)}
                placeholder="예: store-gangnam-001" disabled={mode === 'edit'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-400" />
              {mode === 'create' && <p className="text-xs text-gray-400 mt-1">손님 게임 URL: /play/[매장ID]</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">업체명 *</label>
              <input value={form.store_name} onChange={(e) => set('store_name', e.target.value)}
                placeholder="단골마켓 강남점"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">계약자 이름</label>
              <input value={form.contractor_name} onChange={(e) => set('contractor_name', e.target.value)} placeholder="김사장"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">담당자 이름</label>
              <input value={form.manager_name} onChange={(e) => set('manager_name', e.target.value)} placeholder="이담당"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
            </div>
          </div>

          {/* 계약자 휴대폰 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">계약자 휴대폰</label>
            <input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)}
              placeholder="010-1234-5678" type="tel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
          </div>
        </div>

        {/* ── 계약 정보 ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">계약 정보</h2>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">계약 기간 *</label>
            <div className="flex gap-3 items-center">
              <input type="date" value={form.contract_start_date} onChange={(e) => set('contract_start_date', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
              <span className="text-gray-400 shrink-0">~</span>
              <input type="date" value={form.contract_end_date} min={form.contract_start_date} onChange={(e) => set('contract_end_date', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">월 광고비 (원)</label>
            <div className="flex items-center gap-2">
              <input type="number" min={0} value={form.ad_amount === 0 ? '' : form.ad_amount}
                onChange={(e) => set('ad_amount', e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="300000"
                className="w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
              <span className="text-sm text-gray-500">원 / 월</span>
            </div>
          </div>
        </div>

        {/* ── 매장 추가 정보 ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">매장 추가 정보</h2>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">당근마켓 단골 URL</label>
            <input value={form.daangn_url ?? ''} onChange={(e) => set('daangn_url', e.target.value)}
              placeholder="https://www.daangn.com/..." type="url"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
            <p className="text-xs text-gray-400 mt-1">손님 [당근에서 단골 추가하기] 버튼에 연결됩니다. 비우면 버튼을 숨깁니다.</p>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">카카오 채널 URL</label>
            <input value={form.kakao_channel_url ?? ''} onChange={(e) => set('kakao_channel_url', e.target.value)}
              placeholder="https://pf.kakao.com/..." type="url"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
            <p className="text-xs text-gray-400 mt-1">손님 [카카오 채널 추가하기] 버튼에 연결됩니다. 비우면 건너뛰기만 보입니다.</p>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">홈페이지 URL</label>
            <input value={form.website ?? ''} onChange={(e) => set('website', e.target.value)}
              placeholder="https://example.com" type="url"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">매장 주소</label>
            <input value={form.address ?? ''} onChange={(e) => set('address', e.target.value)}
              placeholder="서울시 강남구 테헤란로 123"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500" />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">업종</label>
            <select value={form.business_type ?? ''} onChange={(e) => set('business_type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-500">
              <option value="">업종 선택</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">비고 <span className="text-gray-400 font-normal">(내부 참고용)</span></label>
            <textarea value={form.remarks ?? ''} onChange={(e) => set('remarks', e.target.value)}
              placeholder="특이사항, 요청사항 등 자유롭게 기록하세요."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500 resize-y" />
          </div>
        </div>

        {/* ── 광고주 계정 (신규 등록 전용) ── */}
        {mode === 'create' && (
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-5 space-y-3">
            <h2 className="text-sm font-bold text-orange-900">광고주 로그인 계정 생성</h2>
            <p className="text-xs text-orange-700">
              등록 후 임시 비밀번호를 1회 화면에 표시합니다. 광고주에게 직접 전달하세요.
            </p>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">광고주 이메일 *</label>
              <input type="email" value={newAdvertiserEmail} onChange={(e) => setNewAdvertiserEmail(e.target.value)}
                placeholder="owner@example.com"
                className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500 bg-white" />
            </div>
          </div>
        )}

        {/* ── 광고주 계정 (수정 모드: 이메일 읽기전용 + 비밀번호 재발급) ── */}
        {mode === 'edit' && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-bold text-gray-700">광고주 로그인 계정</h2>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">로그인 이메일 (읽기전용)</label>
              <div className="flex gap-2 items-center">
                <input
                  value={initial?.advertiserEmail ?? '(계정 없음)'}
                  readOnly
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-100 cursor-not-allowed font-mono"
                />
                {initial?.advertiserEmail && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="shrink-0 bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
                  >
                    {resetLoading ? '처리 중...' : '비밀번호 재발급'}
                  </button>
                )}
              </div>
              {resetError && <p className="text-xs text-red-500 mt-1">{resetError}</p>}
              {initial?.advertiserEmail && (
                <p className="text-xs text-gray-400 mt-1">
                  이메일은 변경할 수 없습니다. 비밀번호 규칙은 <span className="font-mono">이메일 아이디 + 1234</span>입니다
                  (예: {initial.advertiserEmail.split('@')[0]}1234). &quot;비밀번호 재발급&quot;을 누르면 이 규칙으로 다시 설정됩니다.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg text-base transition-colors">
            취소
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-lg text-base transition-colors disabled:opacity-40">
            {loading ? '저장 중...' : mode === 'create' ? '업체 등록' : '변경사항 저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
