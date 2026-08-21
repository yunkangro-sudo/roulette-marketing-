'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'form' | 'success'

const BUSINESS_TYPES = [
  '카페·베이커리', '음식점·식당', '주점·바', '미용실·네일',
  '헬스·필라테스', '소매·편의점', '학원·교습소', '기타',
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    storeName:       '',
    ownerName:       '',
    phone:           '',
    email:           '',
    businessType:    '',
    address:         '',
    password:        '',
    passwordConfirm: '',
    message:         '',
  })

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setError('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.storeName.trim() || !form.ownerName.trim() || !form.phone.trim()) {
      setError('업체명, 담당자명, 연락처는 필수 항목입니다.')
      return
    }
    if (!form.email.trim()) {
      setError('로그인에 사용할 이메일을 입력해주세요.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('이메일 형식이 올바르지 않습니다.')
      return
    }
    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상 입력해주세요.')
      return
    }
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? '가입에 실패했습니다. 잠시 후 다시 시도해주세요.')
        return
      }
      setStep('success')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-[#E4E8ED] p-10 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
            ✅
          </div>
          <h1 className="text-2xl font-bold text-[#14151A] mb-2">가입 완료!</h1>
          <p className="text-[#6B7280] text-sm leading-relaxed mb-6">
            <strong className="text-[#14151A]">{form.email}</strong> 계정으로 가입이 완료되었고,<br />
            <strong className="text-[#14151A]">30일 무료 체험</strong>이 자동으로 시작되었습니다.<br />
            지금 바로 이벤트를 만들어보세요.
          </p>
          <button
            onClick={() => router.push('/admin/events')}
            className="block w-full bg-[#3D5AFE] hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all text-sm mb-3"
          >
            지금 바로 시작하기 →
          </button>
          <a href="/"
            className="block w-full text-[#6B7280] hover:text-[#14151A] font-medium py-2 text-sm transition-colors">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* 헤더 */}
      <nav className="border-b bg-white/90 backdrop-blur sticky top-0 z-10" style={{ borderColor: '#E4E8ED' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'linear-gradient(135deg, #FEE500, #FF8A3D)' }}>
              🎮
            </div>
            <span className="font-bold text-[#14151A]">단골마케팅</span>
          </a>
          <a href="/admin/login" className="text-sm text-[#6B7280] hover:text-[#14151A] transition-colors">
            이미 계정이 있으신가요? <span className="font-semibold text-[#3D5AFE]">로그인</span>
          </a>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* 타이틀 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#3D5AFE]/10 text-[#3D5AFE] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            🚀 무료 회원가입
          </div>
          <h1 className="text-3xl font-bold text-[#14151A] mb-3">
            단골 손님을 만드는 첫 걸음
          </h1>
          <p className="text-[#6B7280] text-base leading-relaxed">
            가입 즉시 30일 무료 체험이 시작되고, 바로 이벤트를 만들 수 있어요.<br />
            설치·설정은 언제든 담당자가 무료로 도와드립니다.
          </p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-3xl border border-[#E4E8ED] p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* 업체명 + 업종 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14151A] mb-1.5">
                  업체명 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.storeName}
                  onChange={set('storeName')}
                  placeholder="예: 홍대 카페 봄봄"
                  className="w-full border border-[#E4E8ED] rounded-xl px-4 py-3 text-sm text-[#14151A] focus:outline-none focus:border-[#3D5AFE] focus:ring-2 focus:ring-[#3D5AFE]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14151A] mb-1.5">업종</label>
                <select
                  value={form.businessType}
                  onChange={set('businessType')}
                  className="w-full border border-[#E4E8ED] rounded-xl px-4 py-3 text-sm text-[#14151A] bg-white focus:outline-none focus:border-[#3D5AFE] focus:ring-2 focus:ring-[#3D5AFE]/20 transition-all"
                >
                  <option value="">업종 선택</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 담당자명 + 연락처 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14151A] mb-1.5">
                  담당자명 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.ownerName}
                  onChange={set('ownerName')}
                  placeholder="예: 김사장"
                  className="w-full border border-[#E4E8ED] rounded-xl px-4 py-3 text-sm text-[#14151A] focus:outline-none focus:border-[#3D5AFE] focus:ring-2 focus:ring-[#3D5AFE]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14151A] mb-1.5">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="010-0000-0000"
                  className="w-full border border-[#E4E8ED] rounded-xl px-4 py-3 text-sm text-[#14151A] focus:outline-none focus:border-[#3D5AFE] focus:ring-2 focus:ring-[#3D5AFE]/20 transition-all"
                />
              </div>
            </div>

            {/* 매장 주소 */}
            <div>
              <label className="block text-sm font-semibold text-[#14151A] mb-1.5">매장 주소 (선택)</label>
              <input
                value={form.address}
                onChange={set('address')}
                placeholder="예: 서울시 마포구 와우산로 123"
                className="w-full border border-[#E4E8ED] rounded-xl px-4 py-3 text-sm text-[#14151A] focus:outline-none focus:border-[#3D5AFE] focus:ring-2 focus:ring-[#3D5AFE]/20 transition-all"
              />
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-semibold text-[#14151A] mb-1.5">
                이메일 (로그인 아이디) <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="이메일 주소"
                className="w-full border border-[#E4E8ED] rounded-xl px-4 py-3 text-sm text-[#14151A] focus:outline-none focus:border-[#3D5AFE] focus:ring-2 focus:ring-[#3D5AFE]/20 transition-all"
              />
            </div>

            {/* 비밀번호 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14151A] mb-1.5">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="8자 이상"
                  className="w-full border border-[#E4E8ED] rounded-xl px-4 py-3 text-sm text-[#14151A] focus:outline-none focus:border-[#3D5AFE] focus:ring-2 focus:ring-[#3D5AFE]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14151A] mb-1.5">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={form.passwordConfirm}
                  onChange={set('passwordConfirm')}
                  placeholder="비밀번호 재입력"
                  className="w-full border border-[#E4E8ED] rounded-xl px-4 py-3 text-sm text-[#14151A] focus:outline-none focus:border-[#3D5AFE] focus:ring-2 focus:ring-[#3D5AFE]/20 transition-all"
                />
              </div>
            </div>

            {/* 문의사항 */}
            <div>
              <label className="block text-sm font-semibold text-[#14151A] mb-1.5">문의사항 (선택)</label>
              <textarea
                value={form.message}
                onChange={set('message')}
                rows={3}
                placeholder="궁금하신 점이 있으시면 자유롭게 적어주세요"
                className="w-full border border-[#E4E8ED] rounded-xl px-4 py-3 text-sm text-[#14151A] resize-none focus:outline-none focus:border-[#3D5AFE] focus:ring-2 focus:ring-[#3D5AFE]/20 transition-all"
              />
            </div>

            {/* 에러 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#3D5AFE', boxShadow: '0 4px 16px rgba(61,90,254,0.3)' }}
            >
              {loading ? '가입 처리 중...' : '회원가입'}
            </button>

            <p className="text-center text-xs text-[#9CA3AF]">
              가입 시 <a href="/privacy" className="underline hover:text-[#6B7280]">개인정보처리방침</a>에 동의하는 것으로 간주합니다
            </p>
          </form>
        </div>

        {/* 하단 혜택 요약 */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: '🆓', title: '무료 체험', desc: '30일 무료\n추가 비용 없음' },
            { icon: '⚡', title: '빠른 설치', desc: '가입 즉시\n바로 운영 시작' },
            { icon: '🙋', title: '전담 지원', desc: '담당자 1:1\n직접 컨설팅' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-[#E4E8ED] p-4 text-center shadow-sm">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-sm font-bold text-[#14151A] mb-1">{title}</p>
              <p className="text-xs text-[#9CA3AF] whitespace-pre-line leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* 직접 연락 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#9CA3AF]">
            바로 통화하려면{' '}
            <a href="tel:16883893" className="font-semibold text-[#14151A] hover:text-[#3D5AFE] transition-colors">
              ☎ 1688-3893
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
