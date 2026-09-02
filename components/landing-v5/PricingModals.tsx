'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { BANK_ACCOUNT, PRICING, WELCOME_GIFT_LABEL, formatWon } from '@/lib/landing-v5/config'

type Props = {
  onClose: () => void
}

/** ESC 닫기 + 배경 스크롤 잠금 — DemoModal과 동일한 규칙 */
function useModalChrome(onClose: () => void) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
}

function ModalShell({
  onClose,
  labelId,
  title,
  children,
  closeDisabled = false,
}: {
  onClose: () => void
  labelId: string
  title: string
  children: ReactNode
  closeDisabled?: boolean
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="닫기"
        onClick={closeDisabled ? undefined : onClose}
      />
      <div
        className="relative z-10 max-h-[90dvh] w-full max-w-[420px] overflow-y-auto border border-dg-line bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        style={{ borderRadius: 12 }}
      >
        <div className="flex items-center justify-between border-b border-dg-line px-5 py-4">
          <p id={labelId} className="text-[14px] font-bold text-dg-ink">
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="text-dg-ink-soft transition-colors hover:text-dg-ink disabled:opacity-30"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-dg-ink">
        {label}
        <span className="ml-0.5 text-dg-green-deep">*</span>
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-11 w-full border border-dg-line bg-white px-3 text-[14px] text-dg-ink outline-none transition-colors focus:border-dg-green"
        style={{ borderRadius: 6 }}
      />
    </label>
  )
}

export function BankRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] text-dg-ink-soft">{label}</p>
        <p className="text-[14px] font-semibold text-dg-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="flex h-8 shrink-0 items-center gap-1 border border-dg-line px-2.5 text-[12px] text-dg-ink-soft transition-colors hover:border-dg-green hover:text-dg-green-deep"
        style={{ borderRadius: 4 }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? '복사됨' : '복사'}
      </button>
    </div>
  )
}

type BasicPhase = 'form' | 'submitting' | 'confirmed' | 'gift-loading' | 'gift-result'

/** 베이직 신청 흐름: 폼 → 입금 안내 → 럭키박스 웰컴 기프트(고정 결과, 랜덤 없음). */
export function BasicApplyModal({ onClose }: Props) {
  useModalChrome(onClose)
  const [phase, setPhase] = useState<BasicPhase>('form')
  const [storeName, setStoreName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (phase !== 'gift-loading') return
    const timer = window.setTimeout(() => setPhase('gift-result'), 1200)
    return () => window.clearTimeout(timer)
  }, [phase])

  async function submit() {
    if (!storeName.trim() || !ownerName.trim() || !phone.trim() || !businessType.trim()) {
      setError('매장명, 담당자명, 연락처, 업종을 모두 입력해주세요')
      return
    }
    setError(null)
    setPhase('submitting')
    try {
      const res = await fetch('/api/signup-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          ownerName,
          phone,
          businessType,
          source: 'landing_v5_pricing_basic',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || '신청에 실패했습니다')
      setPhase('confirmed')
    } catch (e) {
      setError(e instanceof Error ? e.message : '신청에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setPhase('form')
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key)
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500)
    })
  }

  const isFormPhase = phase === 'form' || phase === 'submitting'
  const title = isFormPhase ? '베이직 신청' : phase === 'confirmed' ? '신청 완료' : '웰컴 기프트'

  return (
    <ModalShell onClose={onClose} labelId="basic-apply-title" title={title}>
      {isFormPhase && (
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-dg-ink-soft">
            아래 정보만 남겨주시면, 입금 안내를 바로 보여드려요.
          </p>
          <Field label="매장명" value={storeName} onChange={setStoreName} placeholder="예: 단골팅 카페" />
          <Field label="담당자명" value={ownerName} onChange={setOwnerName} placeholder="예: 홍길동" />
          <Field label="연락처" value={phone} onChange={setPhone} placeholder="010-0000-0000" type="tel" />
          <Field label="업종" value={businessType} onChange={setBusinessType} placeholder="예: 카페·디저트" />
          {error && <p className="text-[13px] text-dg-danger">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={phase === 'submitting'}
            className="mt-2 h-12 w-full bg-dg-green text-[15px] font-bold text-dg-ink transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ borderRadius: 6 }}
          >
            {phase === 'submitting' ? '신청 처리 중...' : '신청 완료하기'}
          </button>
        </div>
      )}

      {phase === 'confirmed' && (
        <div>
          <p className="text-[20px] font-bold text-dg-ink">신청이 접수됐어요!</p>
          <p className="mt-1.5 text-[13px] text-dg-ink-soft">아래 계좌로 초기 세팅비를 입금해주세요.</p>

          <div className="mt-4 space-y-3 border border-dg-line bg-dg-bg p-4" style={{ borderRadius: 8 }}>
            <BankRow
              label="은행"
              value={BANK_ACCOUNT.bank}
              copied={copied === 'bank'}
              onCopy={() => copy(BANK_ACCOUNT.bank, 'bank')}
            />
            <BankRow
              label="계좌번호"
              value={BANK_ACCOUNT.account}
              copied={copied === 'account'}
              onCopy={() => copy(BANK_ACCOUNT.account, 'account')}
            />
            <BankRow
              label="예금주"
              value={BANK_ACCOUNT.holder}
              copied={copied === 'holder'}
              onCopy={() => copy(BANK_ACCOUNT.holder, 'holder')}
            />
          </div>

          <p className="mt-4 font-num text-[22px] font-bold text-dg-ink">
            {formatWon(PRICING.basic.setupFee)}
            <span className="ml-1.5 text-[13px] font-normal text-dg-ink-soft">(초기 세팅비, VAT 포함)</span>
          </p>

          <div className="mt-4 space-y-1.5 text-[13px] text-dg-ink-soft">
            <p>
              입금자명은 <b className="font-semibold text-dg-ink">매장명</b>으로 해주세요
            </p>
            <p>
              입금 확인 후 <b className="font-semibold text-dg-ink">24시간 내</b>로 세팅 도와드려요
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPhase('gift-loading')}
            className="mt-6 h-12 w-full bg-dg-ink text-[14px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ borderRadius: 6 }}
          >
            신청 기념으로 럭키박스를 열어보세요!
          </button>
        </div>
      )}

      {phase === 'gift-loading' && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-5 h-12 w-12 animate-spin rounded-full border-2 border-dg-gold/30 border-t-dg-gold" />
          <p className="font-han text-[22px] text-dg-ink">럭키박스를 여는 중...</p>
        </div>
      )}

      {phase === 'gift-result' && (
        <div className="flex flex-col items-center py-4 text-center">
          <p className="text-[13px] font-semibold text-dg-green-deep">웰컴 기프트 도착</p>
          <p className="mt-3 font-han text-[26px] leading-snug text-dg-ink">{WELCOME_GIFT_LABEL}</p>
          <p className="mt-3 text-[12px] leading-relaxed text-dg-ink-soft">
            세팅 완료 후 매장 계정에 자동으로 반영됩니다
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 h-12 w-full border border-dg-ink/20 bg-white text-[14px] font-bold text-dg-ink transition-colors hover:bg-dg-cream"
            style={{ borderRadius: 6 }}
          >
            닫기
          </button>
        </div>
      )}
    </ModalShell>
  )
}

type ContentOpsPhase = 'form' | 'submitting' | 'done'

/** "당근 콘텐츠 성장 운영" 상담 신청 — 즉시 결제가 아닌 리드 수집이라
 *  베이직 신청과 동일한 signup_inquiries 테이블을 쓰되 source로 구분한다. */
export function ContentOpsModal({ onClose }: Props) {
  useModalChrome(onClose)
  const [phase, setPhase] = useState<ContentOpsPhase>('form')
  const [storeName, setStoreName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!storeName.trim() || !ownerName.trim() || !phone.trim()) {
      setError('매장명, 담당자명, 연락처를 모두 입력해주세요')
      return
    }
    setError(null)
    setPhase('submitting')
    try {
      const res = await fetch('/api/signup-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          ownerName,
          phone,
          source: 'landing_v5_pricing_content_ops',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || '신청에 실패했습니다')
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : '신청에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setPhase('form')
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      labelId="content-ops-title"
      title={phase === 'done' ? '상담 신청 완료' : '콘텐츠 운영 상담'}
    >
      {phase !== 'done' ? (
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-dg-ink-soft">
            매장 정보를 남겨주시면, 담당자가 콘텐츠 운영 상담을 위해 연락드려요.
          </p>
          <Field label="매장명" value={storeName} onChange={setStoreName} placeholder="예: 단골팅 카페" />
          <Field label="담당자명" value={ownerName} onChange={setOwnerName} placeholder="예: 홍길동" />
          <Field label="연락처" value={phone} onChange={setPhone} placeholder="010-0000-0000" type="tel" />
          {error && <p className="text-[13px] text-dg-danger">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={phase === 'submitting'}
            className="mt-2 h-12 w-full border border-dg-ink bg-white text-[15px] font-bold text-dg-ink transition-colors hover:bg-dg-cream disabled:opacity-60"
            style={{ borderRadius: 6 }}
          >
            {phase === 'submitting' ? '접수 중...' : '상담 신청하기'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-4 text-center">
          <p className="text-[18px] font-bold text-dg-ink">상담 신청이 접수됐어요!</p>
          <p className="mt-2 text-[13px] text-dg-ink-soft">담당자가 확인 후 빠르게 연락드릴게요.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 h-12 w-full border border-dg-ink/20 bg-white text-[14px] font-bold text-dg-ink transition-colors hover:bg-dg-cream"
            style={{ borderRadius: 6 }}
          >
            닫기
          </button>
        </div>
      )}
    </ModalShell>
  )
}

type HomepagePhase = 'form' | 'submitting' | 'done'

/** "우리 매장 홈페이지" 제작 상담 신청 — 콘텐츠 운영 상담과 동일하게 즉시 결제가 아닌
 *  리드 수집이라 signup_inquiries를 재사용하고 source로만 구분한다. */
export function HomepageServiceModal({ onClose }: Props) {
  useModalChrome(onClose)
  const [phase, setPhase] = useState<HomepagePhase>('form')
  const [storeName, setStoreName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!storeName.trim() || !ownerName.trim() || !phone.trim()) {
      setError('매장명, 담당자명, 연락처를 모두 입력해주세요')
      return
    }
    setError(null)
    setPhase('submitting')
    try {
      const res = await fetch('/api/signup-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          ownerName,
          phone,
          source: 'landing_v5_pricing_homepage',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || '신청에 실패했습니다')
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : '신청에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setPhase('form')
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      labelId="homepage-service-title"
      title={phase === 'done' ? '상담 신청 완료' : '홈페이지 제작 상담'}
    >
      {phase !== 'done' ? (
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-dg-ink-soft">
            매장 정보를 남겨주시면, 담당자가 홈페이지 제작 상담을 위해 연락드려요.
          </p>
          <Field label="매장명" value={storeName} onChange={setStoreName} placeholder="예: 단골팅 카페" />
          <Field label="담당자명" value={ownerName} onChange={setOwnerName} placeholder="예: 홍길동" />
          <Field label="연락처" value={phone} onChange={setPhone} placeholder="010-0000-0000" type="tel" />
          {error && <p className="text-[13px] text-dg-danger">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={phase === 'submitting'}
            className="mt-2 h-12 w-full border border-dg-ink bg-white text-[15px] font-bold text-dg-ink transition-colors hover:bg-dg-cream disabled:opacity-60"
            style={{ borderRadius: 6 }}
          >
            {phase === 'submitting' ? '접수 중...' : '상담 신청하기'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-4 text-center">
          <p className="text-[18px] font-bold text-dg-ink">상담 신청이 접수됐어요!</p>
          <p className="mt-2 text-[13px] text-dg-ink-soft">담당자가 확인 후 빠르게 연락드릴게요.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 h-12 w-full border border-dg-ink/20 bg-white text-[14px] font-bold text-dg-ink transition-colors hover:bg-dg-cream"
            style={{ borderRadius: 6 }}
          >
            닫기
          </button>
        </div>
      )}
    </ModalShell>
  )
}

type AeoPhase = 'form' | 'submitting' | 'done'

/** AEO마케팅(준비중) 출시 알림 대기자 등록 — 결제 의사 없는 리드라 별도 테이블(aeo_waitlist)로 분리. */
export function AeoWaitlistModal({ onClose }: Props) {
  useModalChrome(onClose)
  const [phase, setPhase] = useState<AeoPhase>('form')
  const [storeName, setStoreName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!storeName.trim() || !phone.trim()) {
      setError('매장명과 연락처를 입력해주세요')
      return
    }
    setError(null)
    setPhase('submitting')
    try {
      const res = await fetch('/api/aeo-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName, phone }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || '신청에 실패했습니다')
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : '신청에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setPhase('form')
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      labelId="aeo-waitlist-title"
      title={phase === 'done' ? '알림 신청 완료' : 'AEO마케팅 출시 알림'}
    >
      {phase !== 'done' ? (
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-dg-ink-soft">
            출시하면 가장 먼저 알려드릴게요. 결제 없이 알림만 등록됩니다.
          </p>
          <Field label="매장명" value={storeName} onChange={setStoreName} placeholder="예: 단골팅 카페" />
          <Field label="연락처" value={phone} onChange={setPhone} placeholder="010-0000-0000" type="tel" />
          {error && <p className="text-[13px] text-dg-danger">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={phase === 'submitting'}
            className="mt-2 h-12 w-full border border-dg-ink bg-white text-[15px] font-bold text-dg-ink transition-colors hover:bg-dg-cream disabled:opacity-60"
            style={{ borderRadius: 6 }}
          >
            {phase === 'submitting' ? '등록 중...' : '알림 신청하기'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-4 text-center">
          <p className="text-[18px] font-bold text-dg-ink">출시하면 가장 먼저 알려드릴게요</p>
          <p className="mt-2 text-[13px] text-dg-ink-soft">AEO마케팅 출시 소식을 문자로 안내드립니다.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 h-12 w-full border border-dg-ink/20 bg-white text-[14px] font-bold text-dg-ink transition-colors hover:bg-dg-cream"
            style={{ borderRadius: 6 }}
          >
            닫기
          </button>
        </div>
      )}
    </ModalShell>
  )
}
