'use client'

import { useState } from 'react'

type Step = 'form' | 'success'

const BUSINESS_TYPES = [
  '카페·베이커리', '음식점·식당', '주점·바', '미용실·네일',
  '헬스·필라테스', '소매·편의점', '학원·교습소', '기타',
]

export default function SignupPage() {
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    storeName:    '',
    ownerName:    '',
    phone:        '',
    email:        '',
    businessType: '',
    message:      '',
  })

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setError('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.storeName || !form.ownerName || !form.phone) {
      setError('업체명, 담당자명, 연락처는 필수 항목입니다.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/signup-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? '신청에 실패했습니다. 잠시 후 다시 시도해주세요.')
      } else {
        setStep('success')
      }
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
          <h1 className="text-2xl font-bold text-[#14151A] mb-2">신청 완료!</h1>
          <p className="text-[#6B7280] text-sm leading-relaxed mb-6">
            신청해 주셔서 감사합니다.<br />
            <strong className="text-[#14151A]">영업일 기준 24시간 내</strong> 담당자가 연락드립니다.<br />
            급하신 경우 아래로 직접 연락해 주세요.
          </p>
          <div className="bg-[#F4F6F8] rounded-xl px-5 py-4 text-sm text-[#14151A] mb-6 space-y-1">
            <p>📞 <a href="tel:16883893" className="font-semibold hover:text-blue-600">1688-3893</a></p>
            <p>✉️ <a href="mailto:cola1won@naver.com" className="font-semibold hover:text-blue-600">cola1won@naver.com</a></p>
          </div>
          <a href="/"
            className="block w-full bg-[#3D5AFE] hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all text-sm">
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
            🚀 무료 체험 신청
          </div>
          <h1 className="text-3xl font-bold text-[#14151A] mb-3">
            단골 손님을 만드는 첫 걸음
          </h1>
          <p className="text-[#6B7280] text-base leading-relaxed">
            정보를 입력하시면 담당자가 직접 연락드립니다.<br />
            설치·설정까지 무료로 도와드립니다.
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

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-semibold text-[#14151A] mb-1.5">이메일 (선택)</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="이메일 주소"
                className="w-full border border-[#E4E8ED] rounded-xl px-4 py-3 text-sm text-[#14151A] focus:outline-none focus:border-[#3D5AFE] focus:ring-2 focus:ring-[#3D5AFE]/20 transition-all"
              />
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
              {loading ? '신청 중...' : '무료 체험 신청하기 →'}
            </button>

            <p className="text-center text-xs text-[#9CA3AF]">
              신청 시 <a href="/privacy" className="underline hover:text-[#6B7280]">개인정보처리방침</a>에 동의하는 것으로 간주합니다
            </p>
          </form>
        </div>

        {/* 하단 혜택 요약 */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: '🆓', title: '무료 체험', desc: '30일 무료\n추가 비용 없음' },
            { icon: '⚡', title: '빠른 설치', desc: '당일 설정\n바로 운영 시작' },
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
