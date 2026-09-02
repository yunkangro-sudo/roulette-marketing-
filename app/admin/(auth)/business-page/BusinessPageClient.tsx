'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import StoreSelector from '../components/StoreSelector'

interface Props { role: string; storeId: string | null }

interface FaqRow { question: string; answer: string }
interface LinkRow { platform: string; url: string }

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export default function BusinessPageClient({ role, storeId }: Props) {
  const [selectedStore, setSelectedStore] = useState(storeId ?? '')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  // 읽기 전용 (store_contracts가 정답 소스 — /admin/company에서 수정)
  const [storeName, setStoreName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')

  const [homepageEnabled, setHomepageEnabled] = useState(true)
  const [onlinePlayEnabled, setOnlinePlayEnabled] = useState(false)
  const [showTrustMetrics, setShowTrustMetrics] = useState(true)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [businessHours, setBusinessHours] = useState('')
  const [naverReviewUrl, setNaverReviewUrl] = useState('')
  const [googleReviewUrl, setGoogleReviewUrl] = useState('')

  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [storePhotos, setStorePhotos] = useState<string[]>([])
  const [faqList, setFaqList] = useState<FaqRow[]>([])
  const [links, setLinks] = useState<LinkRow[]>([])

  const [uploading, setUploading] = useState<'LOGO' | 'COVER' | 'STORE' | null>(null)
  const [imageError, setImageError] = useState('')

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const storeInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async (sid: string) => {
    if (!sid) return
    const res = await fetch(`/api/admin/business-page?store_id=${encodeURIComponent(sid)}`)
    if (res.ok) {
      const data = await res.json()
      setStoreName(data.store_name ?? '')
      setAddress(data.address ?? '')
      setPhone(data.phone ?? '')
      setHomepageEnabled(data.homepage_enabled !== false)
      setOnlinePlayEnabled(data.online_play_enabled === true)
      setShowTrustMetrics(data.show_trust_metrics !== false)
      setCategory(data.category ?? '')
      setDescription(data.description ?? '')
      setBusinessHours(data.business_hours ?? '')
      setNaverReviewUrl(data.naver_review_url ?? '')
      setGoogleReviewUrl(data.google_review_url ?? '')

      const media = (data.media ?? []) as { media_type: string; url: string }[]
      setLogoUrl(media.find((m) => m.media_type === 'LOGO')?.url ?? null)
      setCoverUrl(media.find((m) => m.media_type === 'COVER')?.url ?? null)
      setStorePhotos(media.filter((m) => m.media_type === 'STORE').map((m) => m.url))

      setFaqList((data.faq ?? []).map((f: FaqRow) => ({ question: f.question, answer: f.answer })))
      setLinks((data.external_links ?? []).map((l: LinkRow) => ({ platform: l.platform, url: l.url })))
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (selectedStore) load(selectedStore)
    else setLoaded(false)
  }, [selectedStore, load])

  const publicUrl = useMemo(() => {
    if (!selectedStore) return ''
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.dgting.co.kr'
    return `${origin}/b/${selectedStore}`
  }, [selectedStore])

  async function uploadImage(file: File, type: 'LOGO' | 'COVER' | 'STORE') {
    setImageError('')
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { setImageError('jpg, png, webp 형식의 이미지만 업로드할 수 있어요'); return }
    if (file.size > MAX_IMAGE_SIZE) { setImageError('이미지는 5MB 이하만 업로드할 수 있어요'); return }
    if (!selectedStore) { setImageError('매장을 먼저 선택해주세요'); return }

    setUploading(type)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('store_id', selectedStore)
      const res = await fetch('/api/admin/business-page/upload-image', { method: 'POST', body: fd })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.url) { setImageError(data?.error ?? '업로드에 실패했어요'); return }

      if (type === 'LOGO') setLogoUrl(data.url)
      else if (type === 'COVER') setCoverUrl(data.url)
      else setStorePhotos((prev) => [...prev, data.url])
    } catch {
      setImageError('네트워크 오류로 업로드에 실패했어요')
    } finally {
      setUploading(null)
    }
  }

  function addFaq() { setFaqList((prev) => [...prev, { question: '', answer: '' }]) }
  function removeFaq(i: number) { setFaqList((prev) => prev.filter((_, idx) => idx !== i)) }
  function updateFaq(i: number, patch: Partial<FaqRow>) {
    setFaqList((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))
  }

  function addLink() { setLinks((prev) => [...prev, { platform: '', url: '' }]) }
  function removeLink(i: number) { setLinks((prev) => prev.filter((_, idx) => idx !== i)) }
  function updateLink(i: number, patch: Partial<LinkRow>) {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  async function handleSave() {
    if (!selectedStore) { setMessage({ text: '매장을 먼저 선택해주세요', ok: false }); return }
    setSaving(true)
    setMessage(null)
    try {
      const media = [
        ...(logoUrl ? [{ media_type: 'LOGO', url: logoUrl }] : []),
        ...(coverUrl ? [{ media_type: 'COVER', url: coverUrl }] : []),
        ...storePhotos.map((url) => ({ media_type: 'STORE' as const, url })),
      ]

      const res = await fetch('/api/admin/business-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: selectedStore,
          homepage_enabled: homepageEnabled,
          online_play_enabled: onlinePlayEnabled,
          show_trust_metrics: showTrustMetrics,
          category,
          description,
          business_hours: businessHours,
          naver_review_url: naverReviewUrl,
          google_review_url: googleReviewUrl,
          media,
          faq: faqList,
          external_links: links,
        }),
      })
      const data = await res.json()
      if (!res.ok) setMessage({ text: data.error ?? '저장 실패', ok: false })
      else setMessage({ text: '저장되었습니다', ok: true })
    } catch {
      setMessage({ text: '네트워크 오류가 발생했습니다', ok: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">매장 홈페이지</h1>
      <p className="text-sm text-gray-500 mb-6">
        홈페이지 없는 매장에 정식 소개 페이지를 만들어줍니다. 모든 매장에 기본으로 공개되며,
        온라인 게임 참여는 사장님이 직접 켜야만 허용됩니다.
      </p>

      <div className="mb-6">
        <StoreSelector role={role} sessionStoreId={storeId} selectedStoreId={selectedStore} onSelect={setSelectedStore} />
      </div>

      {!selectedStore ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
          위에서 매장을 선택하면 홈페이지를 설정할 수 있습니다
        </div>
      ) : !loaded ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">불러오는 중...</div>
      ) : (
        <div className="space-y-6">
          {/* 공개 주소 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-1">공개 홈페이지 주소</p>
            <p className="text-sm text-blue-600 break-all mb-2">{publicUrl}</p>
            <p className="text-xs text-gray-400">
              손님 쿠폰함(내 쿠폰함) 화면 상단의 "매장 홈페이지" 바로가기로도 연결돼요.
            </p>
          </div>

          {message && (
            <div className={`rounded-lg px-4 py-3 text-sm font-medium ${message.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {message.text}
            </div>
          )}

          {/* 노출 설정 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <ToggleRow
              label="홈페이지 사용"
              hint="끄면 방문자에게 '준비중' 화면이 표시돼요"
              checked={homepageEnabled}
              onChange={setHomepageEnabled}
            />
            <ToggleRow
              label="온라인 게임 참여 허용"
              hint="켜면 매장에 와본 적 없는 손님도 홈페이지에서 게임할 수 있어요 (리워드 재고 소모 주의)"
              checked={onlinePlayEnabled}
              onChange={setOnlinePlayEnabled}
            />
            <ToggleRow
              label="신뢰지표 노출"
              hint="이번 달 참여자 수, 재방문율 표시 (참여자 10명 미만이면 자동 숨김)"
              checked={showTrustMetrics}
              onChange={setShowTrustMetrics}
            />
          </div>

          {/* 매장 정보 (읽기전용 + 직접입력) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">매장 정보</h2>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <ReadOnlyField label="업체명" value={storeName || '(업체 정보에서 입력)'} />
              <ReadOnlyField label="연락처" value={phone || '(업체 정보에서 입력)'} />
            </div>
            <ReadOnlyField label="주소" value={address || '(업체 정보에서 입력)'} />
            <p className="text-xs text-gray-400">업체명·주소·연락처는 "업체 정보" 메뉴에서 수정할 수 있어요.</p>

            <Field label="업종">
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="예: 분식, 카페"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
            </Field>
            <Field label="소개글">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                placeholder="매장을 한 줄~짧은 문단으로 소개해주세요"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none" />
            </Field>
            <Field label="영업시간">
              <input value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} placeholder="예: 매일 11:00~21:00, 일요일 휴무"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
            </Field>
          </div>

          {/* 사진 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">사진</h2>
            {imageError && <p className="text-xs text-red-500">{imageError}</p>}

            <ImageUploadRow
              label="로고"
              url={logoUrl}
              uploading={uploading === 'LOGO'}
              inputRef={logoInputRef}
              onPick={(f) => uploadImage(f, 'LOGO')}
              onRemove={() => setLogoUrl(null)}
            />
            <ImageUploadRow
              label="대표(커버) 사진"
              url={coverUrl}
              uploading={uploading === 'COVER'}
              inputRef={coverInputRef}
              onPick={(f) => uploadImage(f, 'COVER')}
              onRemove={() => setCoverUrl(null)}
            />

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">매장 내부/외부 사진 ({storePhotos.length}장)</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {storePhotos.map((url, i) => (
                  <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setStorePhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <input ref={storeInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadImage(f, 'STORE') }} />
              <button
                type="button"
                onClick={() => storeInputRef.current?.click()}
                disabled={uploading === 'STORE'}
                className="text-sm font-semibold text-orange-500 hover:text-orange-600 disabled:opacity-50"
              >
                {uploading === 'STORE' ? '업로드 중...' : '+ 사진 추가'}
              </button>
            </div>
          </div>

          {/* 리뷰 링크 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">리뷰 남기기</h2>
            <p className="text-xs text-gray-400">
              입력한 링크가 있으면 홈페이지에 버튼으로 노출돼요. 리워드 지급이나 게임 결과와는 전혀 연결되지 않는 순수 외부링크예요.
            </p>
            <Field label="네이버 리뷰 URL">
              <input value={naverReviewUrl} onChange={(e) => setNaverReviewUrl(e.target.value)} placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
            </Field>
            <Field label="구글 리뷰 URL">
              <input value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)} placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
            </Field>
          </div>

          {/* 외부 링크 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-bold text-gray-900">외부 링크 (인스타그램 등)</h2>
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input value={l.platform} onChange={(e) => updateLink(i, { platform: e.target.value })} placeholder="플랫폼 (예: 인스타그램)"
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                <input value={l.url} onChange={(e) => updateLink(i, { url: e.target.value })} placeholder="https://..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                <button type="button" onClick={() => removeLink(i)} className="text-gray-400 hover:text-red-500 px-2">삭제</button>
              </div>
            ))}
            <button type="button" onClick={addLink} className="text-sm font-semibold text-orange-500 hover:text-orange-600">
              + 링크 추가
            </button>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">자주 묻는 질문 (FAQ)</h2>
            {faqList.map((f, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={f.question} onChange={(e) => updateFaq(i, { question: e.target.value })} placeholder="질문"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                  <button type="button" onClick={() => removeFaq(i)} className="text-gray-400 hover:text-red-500 px-2">삭제</button>
                </div>
                <textarea value={f.answer} onChange={(e) => updateFaq(i, { answer: e.target.value })} placeholder="답변" rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none" />
              </div>
            ))}
            <button type="button" onClick={addFaq} className="text-sm font-semibold text-orange-500 hover:text-orange-600">
              + 질문 추가
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      )}
    </div>
  )
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-6 w-6 rounded-full bg-white shadow mt-0.5 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-600 truncate">{value}</p>
    </div>
  )
}

function ImageUploadRow({ label, url, uploading, inputRef, onPick, onRemove }: {
  label: string
  url: string | null
  uploading: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onPick: (file: File) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
        {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-300 text-xs">없음</span>}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onPick(f) }} />
        <div className="flex gap-3">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="text-sm font-semibold text-orange-500 hover:text-orange-600 disabled:opacity-50">
            {uploading ? '업로드 중...' : url ? '변경' : '업로드'}
          </button>
          {url && <button type="button" onClick={onRemove} className="text-sm text-gray-400 hover:text-red-500">삭제</button>}
        </div>
      </div>
    </div>
  )
}
