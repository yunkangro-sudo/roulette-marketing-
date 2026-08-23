"use client"

import { useEffect, useState } from 'react'

/** 실제 배포 게임 화면(데모용 매장) — 무료 데모 체험하기 버튼들이 공통으로 여는 팝업에 사용 */
const DEMO_GAME_URL = '/play/test'
const OPEN_DEMO_EVENT = 'open-demo-modal'

/** 페이지 곳곳의 데모 버튼에서 호출 — 컴포넌트 트리를 관통하는 props 없이
 *  전역 이벤트로 하단의 <DemoModal />을 연다 */
function openDemoModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OPEN_DEMO_EVENT))
  }
}

/* ─────────────────────────────────────────────────────────────
   무료 데모 팝업 — PC 화면 중앙에 "약간 큰 모바일" 크기의 폰 프레임으로
   실제 배포된 게임 화면을 그대로 띄운다 (iframe이라 게임 자체 로직/스타일에
   영향 없음)
───────────────────────────────────────────────────────────── */
function DemoModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_DEMO_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_DEMO_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: 'rgba(10,10,14,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={() => setOpen(false)}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        {/* 폰 프레임 — "약간 큰 모바일" 사이즈 + 베젤/노치로 실제 폰처럼 보이게 */}
        <div
          className="relative overflow-hidden rounded-[40px]"
          style={{
            width: 430,
            height: 'min(900px, 92vh)',
            background: '#0B0B0E',
            padding: 10,
            boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {/* 상단 노치 */}
          <div
            className="absolute left-1/2 top-[10px] z-10 h-[22px] w-[120px] -translate-x-1/2 rounded-full"
            style={{ background: '#0B0B0E' }}
          />
          {/* 닫기 버튼 — 프레임 안쪽 우상단(어느 화면 높이에서도 항상 보이는 위치) */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="데모 닫기"
            className="absolute right-[18px] top-[18px] z-20 flex h-8 w-8 items-center justify-center rounded-full text-sm text-white transition-colors hover:bg-black/70"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            ✕
          </button>
          <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-white">
            <iframe
              src={DEMO_GAME_URL}
              title="무료 데모 체험"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        background: 'rgba(250,250,248,0.88)',
        backdropFilter: 'blur(16px)',
        borderColor: '#E4E8ED',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg, #FEE500, #FF8A3D)' }}
          >
            🎮
          </div>
          <span className="font-bold text-lg" style={{ color: '#14151A', fontFamily: 'Pretendard Variable, sans-serif' }}>
            단골마케팅
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'rgba(20,21,26,0.6)' }}>
          <a href="#features" className="hover:text-[#14151A] transition-colors">서비스 소개</a>
          <a href="#faq" className="hover:text-[#14151A] transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin/login"
            className="hidden md:block text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: '#14151A' }}
          >
            로그인
          </a>
          <a href="/signup"
            className="text-sm font-semibold px-5 py-2 rounded-lg text-white transition-all hover:opacity-90"
            style={{ background: '#3D5AFE' }}
          >
            회원가입
          </a>
        </div>
      </div>
    </nav>
  )
}

/* ─────────────────────────────────────────────────────────────
   PHONE MOCKUP (Hero 전용)
───────────────────────────────────────────────────────────── */
function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 260 }}>
      {/* Floating stat card — top left */}
      <div
        className="absolute -left-20 top-16 rounded-2xl shadow-xl px-4 py-3 border animate-float-delayed"
        style={{ background: '#fff', borderColor: '#E4E8ED', width: 148, zIndex: 10 }}
      >
        <p className="text-[10px] mb-0.5" style={{ color: 'rgba(20,21,26,0.5)' }}>이번 주 재방문율</p>
        <p className="font-mono-data text-2xl font-bold" style={{ color: '#1FC77A' }}>+23%</p>
        <p className="text-[9px] mt-0.5" style={{ color: 'rgba(20,21,26,0.4)' }}>↑ 지난 주 대비</p>
      </div>

      {/* Floating stat card — bottom right */}
      <div
        className="absolute -right-16 bottom-28 rounded-2xl shadow-xl px-4 py-3 border animate-float"
        style={{ background: '#fff', borderColor: '#E4E8ED', width: 128, zIndex: 10 }}
      >
        <p className="text-[10px] mb-0.5" style={{ color: 'rgba(20,21,26,0.5)' }}>오늘 참여</p>
        <p className="font-mono-data text-2xl font-bold" style={{ color: '#3D5AFE' }}>147명</p>
        <p className="text-[9px] mt-0.5" style={{ color: 'rgba(20,21,26,0.4)' }}>게임 참여자</p>
      </div>

      {/* Phone frame */}
      <div
        className="relative rounded-[44px] overflow-hidden shadow-2xl"
        style={{
          width: 260,
          height: 540,
          border: '8px solid #1a1a1a',
          background: '#fff',
        }}
      >
        {/* Dynamic island */}
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full z-10"
          style={{ width: 96, height: 28, background: '#1a1a1a' }}
        />

        {/* Screen */}
        <div
          className="h-full flex flex-col overflow-hidden"
          style={{ background: '#F4F6F8', paddingTop: 44 }}
        >
          {/* Status bar */}
          <div
            className="flex justify-between items-center px-5 py-1 text-[10px] font-semibold"
            style={{ color: '#14151A' }}
          >
            <span>9:41</span>
            <span style={{ letterSpacing: 1 }}>●●●</span>
          </div>

          {/* Store header */}
          <div className="text-center px-4 pb-2 pt-1">
            <p className="text-[9px] font-medium" style={{ color: 'rgba(20,21,26,0.45)' }}>
              홍대 카페 봄봄 ·  이벤트
            </p>
            <p className="text-[12px] font-bold mt-0.5" style={{ color: '#14151A' }}>
              🎁 행운의 스크래치 이벤트
            </p>
          </div>

          {/* Scratch card */}
          <div
            className="mx-4 rounded-2xl overflow-hidden shadow-md"
            style={{ background: '#fff', border: '1px solid #E4E8ED' }}
          >
            {/* Card header */}
            <div
              className="px-4 py-2 text-center text-[9px] font-bold"
              style={{ background: 'linear-gradient(135deg, #FEE500, #FF8A3D)', color: '#14151A' }}
            >
              스크래치로 긁어보세요! ✨
            </div>

            {/* Scratch area — partial reveal */}
            <div className="relative" style={{ height: 100 }}>
              {/* Revealed reward underneath */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                   style={{ background: '#fff' }}>
                <span style={{ fontSize: 24 }}>☕</span>
                <p className="text-[10px] font-bold" style={{ color: '#14151A' }}>
                  아메리카노 1,000원 할인
                </p>
                <p className="text-[8px]" style={{ color: 'rgba(20,21,26,0.45)' }}>
                  오늘부터 14일 이내 사용
                </p>
              </div>
              {/* Partial scratch layer — bottom-right remains */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(125deg, transparent 0%, transparent 48%, rgba(178,178,178,0.9) 48%)',
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(60deg, rgba(180,180,180,0.25) 0px, rgba(180,180,180,0.25) 1px, transparent 1px, transparent 6px)',
                  clipPath: 'polygon(48% 0%, 100% 0%, 100% 100%, 48% 100%)',
                }}
              />
            </div>

            {/* Coupon code */}
            <div
              className="px-4 py-2 text-center"
              style={{ background: '#F4F6F8', borderTop: '1px solid #E4E8ED' }}
            >
              <span
                className="font-mono-data text-[11px] font-bold tracking-[0.18em]"
                style={{ color: '#3D5AFE' }}
              >
                CAFE-4829-K
              </span>
            </div>
          </div>

          {/* CTA Badges */}
          <div className="mx-4 mt-2.5 space-y-1.5">
            {/* Kakao badge */}
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
              style={{ background: '#FEE500' }}
            >
              <span style={{ fontSize: 14 }}>💬</span>
              <div>
                <p className="text-[9px] font-bold leading-tight" style={{ color: '#14151A' }}>
                  카카오 채널 친구추가 완료 ✓
                </p>
                <p className="text-[8px]" style={{ color: 'rgba(20,21,26,0.6)' }}>
                  재방문 알림을 받아보세요
                </p>
              </div>
            </div>
            {/* Danggeun badge */}
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
              style={{
                background: 'rgba(255,138,61,0.12)',
                border: '1px solid rgba(255,138,61,0.35)',
              }}
            >
              <span style={{ fontSize: 14 }}>🥕</span>
              <div>
                <p className="text-[9px] font-bold leading-tight" style={{ color: '#FF8A3D' }}>
                  당근 단골추가 완료 ✓
                </p>
                <p className="text-[8px]" style={{ color: 'rgba(20,21,26,0.6)' }}>
                  동네 소식을 받아보세요
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SECTION 1: HERO
───────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{ background: '#FAFAF8' }}
    >
      {/* Merge gradient background glow — ONLY here */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%',
          left: '60%',
          transform: 'translate(-50%, -50%)',
          width: 680,
          height: 680,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FEE500, #FF8A3D)',
          opacity: 0.18,
          filter: 'blur(100px)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left: Copy */}
        <div>
          {/* Eyebrow badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8 border"
            style={{
              borderColor: 'rgba(61,90,254,0.2)',
              color: '#3D5AFE',
              background: 'rgba(61,90,254,0.06)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: '#3D5AFE' }}
            />
            카카오 × 당근 통합 마케팅 자동화
          </div>

          {/* Headline */}
          <h1
            className="text-5xl lg:text-6xl font-bold leading-[1.12] mb-6"
            style={{
              color: '#14151A',
              fontFamily: 'Pretendard Variable, sans-serif',
              letterSpacing: '-0.025em',
            }}
          >
            단골이 없다면,
            <br />
            <span className="relative inline-block">
              1년이 지나도
              <span
                className="absolute left-0 -bottom-1 right-0 h-[3px] rounded-full"
                style={{ background: 'linear-gradient(135deg, #FEE500, #FF8A3D)' }}
              />
            </span>{' '}
            개업 첫날입니다.
          </h1>

          {/* Sub-headline */}
          <p
            className="text-lg leading-relaxed mb-10 max-w-[480px]"
            style={{ color: 'rgba(20,21,26,0.65)' }}
          >
            손님은 계속 오는데, 왜 매출은 그대로일까요?
            <br />
            게임 한 번으로 단골을 남기세요.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-10">
            <button
              type="button"
              onClick={openDemoModal}
              className="px-7 py-3.5 rounded-xl text-white font-semibold text-base transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: '#3D5AFE', boxShadow: '0 4px 20px rgba(61,90,254,0.35)' }}
            >
              무료 데모 체험하기
            </button>
            <a href="/admin/login"
              className="px-7 py-3.5 rounded-xl font-semibold text-base transition-all border hover:bg-white"
              style={{ color: '#14151A', borderColor: '#E4E8ED' }}
            >
              샘플 대시보드 보기 →
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[
                { label: '카', bg: '#3D5AFE', color: '#fff' },
                { label: '음', bg: '#1FC77A', color: '#fff' },
                { label: '미', bg: '#FF8A3D', color: '#fff' },
                { label: '편', bg: '#FEE500', color: '#14151A' },
              ].map(({ label, bg, color }, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                  style={{ background: bg, color, borderColor: '#FAFAF8' }}
                >
                  {label}
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: 'rgba(20,21,26,0.5)' }}>
              파일럿 매장 운영 중 · 평균 재방문율{' '}
              <span className="font-mono-data font-bold" style={{ color: '#1FC77A' }}>
                +18%p
              </span>
            </p>
          </div>
        </div>

        {/* Right: Phone mockup */}
        <div className="flex justify-center lg:justify-end">
          <PhoneMockup />
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, #FAFAF8)',
        }}
      />
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SECTION 2: PROBLEM STATEMENT
───────────────────────────────────────────────────────────── */
function ProblemSection() {
  const problems = [
    {
      icon: '👋',
      title: '손님이 다시 안 온다',
      desc: '첫 방문 손님의 70%는 두 번 다시 안 옵니다. 단골로 만들 타이밍이 없어서가 아니라, 연결할 수단이 없어서입니다.',
    },
    {
      icon: '🗃️',
      title: '고객 데이터가 없다',
      desc: '누가 왔다 갔는지, 몇 번 왔는지 아무것도 남지 않습니다. 데이터 없이는 재방문 마케팅 자체가 불가능합니다.',
    },
    {
      icon: '📉',
      title: '카카오 친구도, 당근 단골도 늘지 않는다',
      desc: '채널은 만들었는데 숫자가 그대로입니다. 손님이 먼저 추가할 이유 — 쿠폰, 혜택 — 를 줘야 팔로워가 움직입니다.',
    },
  ]

  return (
    <section className="py-24" style={{ background: '#FAFAF8' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#3D5AFE', fontFamily: 'Pretendard Variable, sans-serif' }}
          >
            Problem
          </p>
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: '#14151A', letterSpacing: '-0.02em', fontFamily: 'Pretendard Variable, sans-serif' }}
          >
            "열심히 하는데 왜 재방문이 안 될까요?"
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'rgba(20,21,26,0.6)' }}>
            홍보를 안 해서가 아닙니다. 한 번 온 손님을 붙잡을 연결 고리가 없는 겁니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-8 border"
              style={{ background: '#fff', borderColor: '#E4E8ED' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5"
                style={{ background: '#F4F6F8' }}
              >
                {icon}
              </div>
              <h3
                className="text-lg font-bold mb-3"
                style={{ color: '#14151A', fontFamily: 'Pretendard Variable, sans-serif' }}
              >
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(20,21,26,0.65)' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SECTION 3: GAME PROCESS VISUALIZATION
───────────────────────────────────────────────────────────── */
function GameProcessSection() {
  const steps = [
    {
      icon: '📱',
      label: 'QR 스캔',
      caption: '손님이 QR을\n찍는다',
      color: '#F4F6F8',
    },
    {
      icon: '🎮',
      label: '게임 진행',
      caption: '3초,\n스크래치카드를 긁는다',
      color: '#F4F6F8',
    },
    {
      icon: '🎁',
      label: '보상 확인',
      caption: '할인 쿠폰이\n뜬다',
      color: '#F4F6F8',
    },
    {
      icon: null,
      label: '채널 연결',
      caption: '채널 친구·단골이\n자동으로 뜬다',
      color: '#FAFAF8',
      isDual: true,
    },
    {
      icon: '📊',
      label: '사장님 화면',
      caption: '대시보드에서\n숫자로 확인한다',
      color: '#F4F6F8',
    },
  ]

  return (
    <section id="features" className="py-24" style={{ background: '#fff' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#3D5AFE' }}
          >
            How It Works
          </p>
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: '#14151A', letterSpacing: '-0.02em', fontFamily: 'Pretendard Variable, sans-serif' }}
          >
            게임 한 판, 단골 한 명.
          </h2>
          <p className="text-lg" style={{ color: 'rgba(20,21,26,0.6)' }}>
            QR 찍고 3초, 카카오 친구와 당근 단골까지 자동으로 남습니다.
          </p>
        </div>

        {/* 5-step strip */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-0">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-center">
              {/* Step card */}
              <div className="flex flex-col items-center text-center" style={{ width: 160 }}>
                {/* Icon circle */}
                {step.isDual ? (
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                      style={{ background: '#FEE500' }}
                    >
                      💬
                    </div>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                      style={{
                        background: 'rgba(255,138,61,0.15)',
                        border: '2px solid rgba(255,138,61,0.4)',
                      }}
                    >
                      🥕
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm"
                    style={{ background: step.color, border: '1px solid #E4E8ED' }}
                  >
                    {step.icon}
                  </div>
                )}

                {/* Step number */}
                <span
                  className="text-xs font-bold mb-1"
                  style={{ color: '#3D5AFE' }}
                >
                  STEP {idx + 1}
                </span>
                <p
                  className="text-sm font-bold mb-2"
                  style={{ color: '#14151A', fontFamily: 'Pretendard Variable, sans-serif' }}
                >
                  {step.label}
                </p>
                <p
                  className="text-xs leading-relaxed whitespace-pre-line"
                  style={{ color: 'rgba(20,21,26,0.55)' }}
                >
                  {step.caption}
                </p>
              </div>

              {/* Arrow connector */}
              {idx < steps.length - 1 && (
                <div
                  className="flex items-center justify-center my-4 md:my-0 md:mx-2 rotate-90 md:rotate-0"
                  style={{ color: 'rgba(20,21,26,0.2)', width: 32, flexShrink: 0 }}
                >
                  <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
                    <path
                      d="M0 6H24M24 6L18 1M24 6L18 11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom callout */}
        <div
          className="mt-16 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border"
          style={{ background: 'rgba(61,90,254,0.04)', borderColor: 'rgba(61,90,254,0.15)' }}
        >
          <div>
            <p className="font-bold text-base mb-1" style={{ color: '#14151A' }}>
              직원 교육 없이 바로 운영
            </p>
            <p className="text-sm" style={{ color: 'rgba(20,21,26,0.6)' }}>
              테이블·계산대에 QR 스탠드만 두면 됩니다. 나머지는 시스템이 자동으로.
            </p>
          </div>
          <button
            type="button"
            onClick={openDemoModal}
            className="flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: '#3D5AFE' }}
          >
            데모 체험하기 →
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SECTION 4: 당근마케팅 선점 타이밍 (오렌지 틴트)
───────────────────────────────────────────────────────────── */
function DanggeunSection() {
  const stats = [
    { number: '42%', label: '당근 광고 매출 전년 대비 성장', src: '당근마켓 2024 연간 보고서' },
    { number: '37%', label: '광고주 수 1년 새 증가', src: '당근마켓 2024 연간 보고서' },
    { number: '32%', label: '소상공인 비즈프로필 증가', src: '당근마켓 파트너 리포트 2024' },
  ]

  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: 'rgba(255,138,61,0.06)' }}
    >
      {/* Subtle background mark */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,138,61,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            {/* Danggeun badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
              style={{
                background: 'rgba(255,138,61,0.15)',
                color: '#FF8A3D',
                border: '1px solid rgba(255,138,61,0.3)',
              }}
            >
              🥕 당근마케팅 선점 타이밍
            </div>

            <h2
              className="text-4xl font-bold leading-tight mb-6"
              style={{
                color: '#14151A',
                letterSpacing: '-0.02em',
                fontFamily: 'Pretendard Variable, sans-serif',
              }}
            >
              당근이 커지는 만큼,
              <br />
              <span style={{ color: '#FF8A3D' }}>우리 가게 단골도 커집니다.</span>
            </h2>

            <p
              className="text-base leading-relaxed mb-8"
              style={{ color: 'rgba(20,21,26,0.65)' }}
            >
              아직 절반 이상의 매장은 당근을 제대로 쓰지 않고 있습니다.
              지금 시작한 매장이 동네 단골을 먼저 가져갑니다.
            </p>

            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: '#FF8A3D' }}
              />
              <p className="text-sm font-medium" style={{ color: 'rgba(20,21,26,0.7)' }}>
                단골마케팅은 당근 최적화 세팅을 기본 제공합니다
              </p>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="space-y-4">
            {stats.map(({ number, label, src }) => (
              <div
                key={number}
                className="rounded-2xl p-6 border flex items-center gap-6"
                style={{ background: '#fff', borderColor: 'rgba(255,138,61,0.2)' }}
              >
                <div
                  className="font-mono-data text-4xl font-bold flex-shrink-0"
                  style={{ color: '#FF8A3D', minWidth: 80 }}
                >
                  {number}
                </div>
                <div>
                  <p className="font-semibold text-base mb-0.5" style={{ color: '#14151A' }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(20,21,26,0.4)' }}>
                    출처: {src}
                  </p>
                </div>
              </div>
            ))}

            <div
              className="rounded-2xl p-5 border text-center"
              style={{ background: 'rgba(255,138,61,0.08)', borderColor: 'rgba(255,138,61,0.25)' }}
            >
              <p className="text-sm font-bold mb-1" style={{ color: '#FF8A3D' }}>
                동네에서 먼저 시작한 매장이 단골을 먼저 가져갑니다
              </p>
              <p className="text-xs" style={{ color: 'rgba(20,21,26,0.55)' }}>
                경쟁 매장이 당근을 시작하기 전에, 지금 선점하세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SECTION 5: 카카오 멀티채널 강조 (옐로우 틴트)
───────────────────────────────────────────────────────────── */
function KakaoSection() {
  const channels = [
    {
      icon: '💛',
      name: '카카오 채널 친구추가',
      desc: '게임 후 자동으로 우리 채널 추가 요청. 이후 알림톡·메시지로 재방문 유도.',
      badge: 'kakao',
    },
    {
      icon: '🔔',
      name: '알림톡 재방문 쿠폰 발송',
      desc: '쿠폰 미사용 N일 후 서버가 자동으로 "아직 쿠폰 있어요" 알림톡 발송. 클릭부터 방문까지 전 구간 추적.',
      badge: 'kakao',
    },
    {
      icon: '🔗',
      name: '카카오 공유하기 (바이럴)',
      desc: '게임 결과를 친구에게 공유. 소비자가 광고를 대신합니다. 공유 건수도 대시보드에서 확인.',
      badge: 'kakao',
    },
  ]

  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: 'rgba(254,229,0,0.07)' }}
    >
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(254,229,0,0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          {/* Kakao badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{
              background: '#FEE500',
              color: '#14151A',
            }}
          >
            💬 카카오 채널 통합
          </div>

          <h2
            className="text-4xl font-bold mb-4"
            style={{
              color: '#14151A',
              letterSpacing: '-0.02em',
              fontFamily: 'Pretendard Variable, sans-serif',
            }}
          >
            카카오 메시지 하나로는,
            <br />
            재방문이 남지 않습니다.
          </h2>
          <p className="text-lg max-w-lg mx-auto" style={{ color: 'rgba(20,21,26,0.65)' }}>
            친구추가 + 알림톡 + 공유하기, 세 접점이 함께 움직여야 손님이 돌아옵니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {channels.map(({ icon, name, desc }) => (
            <div
              key={name}
              className="rounded-2xl p-7 border"
              style={{ background: '#fff', borderColor: 'rgba(254,229,0,0.4)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5"
                style={{ background: '#FEE500' }}
              >
                {icon}
              </div>
              <h3
                className="text-base font-bold mb-3"
                style={{ color: '#14151A', fontFamily: 'Pretendard Variable, sans-serif' }}
              >
                {name}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(20,21,26,0.65)' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Honest CTA note */}
        <div
          className="mt-8 rounded-xl px-6 py-4 text-center"
          style={{ background: 'rgba(254,229,0,0.15)', border: '1px solid rgba(254,229,0,0.4)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(20,21,26,0.7)' }}>
            <strong>정직하게 말씀드립니다.</strong> 당근·네이버 딥링크는 클릭 이후 완료 여부를 시스템이 확인할 수 없습니다.
            대시보드에는 "CTA 클릭률"만 표시하고, 완료율은 표기하지 않습니다.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SECTION 6: ROI 대시보드 프리뷰
───────────────────────────────────────────────────────────── */
function DashboardSection() {
  const metrics = [
    { label: 'QR 스캔', value: '1,284', sub: '이번 달', color: '#14151A' },
    { label: '게임 참여율', value: '78.4%', sub: '스캔 대비', color: '#3D5AFE' },
    { label: '쿠폰 발급', value: '1,006', sub: '참여자 중', color: '#14151A' },
    { label: '재방문 전환', value: '324', sub: '쿠폰 사용', color: '#1FC77A' },
  ]

  const funnelData = [
    { label: 'QR 스캔', pct: 100, val: '1,284명' },
    { label: '게임 참여', pct: 78, val: '1,006명' },
    { label: '쿠폰 발급', pct: 78, val: '1,006명' },
    { label: '재방문 전환', pct: 25, val: '324명' },
  ]

  return (
    <section className="py-24" style={{ background: '#FAFAF8' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#3D5AFE' }}>
            Analytics
          </p>
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: '#14151A', letterSpacing: '-0.02em', fontFamily: 'Pretendard Variable, sans-serif' }}
          >
            "진짜로 재방문이 늘었는지"
            <br />
            숫자로 확인하세요
          </h2>
          <p className="text-lg" style={{ color: 'rgba(20,21,26,0.6)' }}>
            QR 스캔부터 재방문 쿠폰 사용까지 전환 퍼널 전체를 실시간으로 봅니다.
          </p>
        </div>

        {/* Dashboard mockup */}
        <div
          className="rounded-3xl overflow-hidden border shadow-xl"
          style={{ background: '#fff', borderColor: '#E4E8ED' }}
        >
          {/* Dashboard header */}
          <div
            className="px-8 py-4 border-b flex items-center justify-between"
            style={{ borderColor: '#E4E8ED', background: '#FAFAF8' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                  <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span className="text-sm font-medium" style={{ color: 'rgba(20,21,26,0.5)' }}>
                단골마케팅 대시보드 — 홍대 카페 봄봄
              </span>
            </div>
            <div
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: 'rgba(31,199,122,0.1)', color: '#1FC77A' }}
            >
              ● 캠페인 운영 중
            </div>
          </div>

          <div className="p-8">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {metrics.map(({ label, value, sub, color }) => (
                <div
                  key={label}
                  className="rounded-2xl p-5 border"
                  style={{ background: '#FAFAF8', borderColor: '#E4E8ED' }}
                >
                  <p className="text-xs mb-2" style={{ color: 'rgba(20,21,26,0.5)' }}>{label}</p>
                  <p
                    className="font-mono-data text-2xl font-bold mb-1"
                    style={{ color }}
                  >
                    {value}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(20,21,26,0.4)' }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Funnel */}
            <div
              className="rounded-2xl p-6 border"
              style={{ background: '#FAFAF8', borderColor: '#E4E8ED' }}
            >
              <p className="text-sm font-bold mb-5" style={{ color: '#14151A' }}>
                전환 퍼널 — 2026년 8월
              </p>
              <div className="space-y-3">
                {funnelData.map(({ label, pct, val }, i) => (
                  <div key={label} className="flex items-center gap-4">
                    <span
                      className="text-xs w-24 flex-shrink-0"
                      style={{ color: 'rgba(20,21,26,0.6)' }}
                    >
                      {label}
                    </span>
                    <div
                      className="flex-1 rounded-full overflow-hidden"
                      style={{ height: 8, background: '#E4E8ED' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: i === 3 ? '#1FC77A' : i === 0 ? '#14151A' : '#3D5AFE',
                          opacity: i === 0 ? 0.2 : 1,
                        }}
                      />
                    </div>
                    <span
                      className="font-mono-data text-xs w-16 text-right flex-shrink-0 font-medium"
                      style={{ color: '#14151A' }}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA channel breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {[
                { channel: '💬 카카오 친구추가', clicks: '642', color: '#FEE500', textColor: '#14151A' },
                { channel: '🥕 당근 단골추가', clicks: '418', color: 'rgba(255,138,61,0.15)', textColor: '#FF8A3D' },
                { channel: '🔗 카카오 공유', clicks: '189', color: 'rgba(61,90,254,0.08)', textColor: '#3D5AFE' },
              ].map(({ channel, clicks, color, textColor }) => (
                <div
                  key={channel}
                  className="rounded-xl p-4 flex items-center justify-between"
                  style={{ background: color, border: `1px solid ${color}` }}
                >
                  <span className="text-xs font-medium" style={{ color: textColor }}>{channel}</span>
                  <span className="font-mono-data text-lg font-bold" style={{ color: textColor }}>
                    {clicks}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SECTION 7: 요금제
───────────────────────────────────────────────────────────── */
function PricingSection() {
  const plans = [
    {
      name: '기본상품',
      badge: null,
      price: '50,000',
      unit: '원/월',
      features: [
        '스크래치카드 게임 이벤트',
        '카카오 채널 친구추가 CTA',
        '당근 단골추가 CTA',
        '전환 퍼널 대시보드',
        '쿠폰 발급 · 사용처리',
        '참여자 데이터 CSV 다운로드',
      ],
      ctaLabel: '시작하기',
      isHighlighted: false,
    },
    {
      name: '당근마케팅 상품',
      badge: '추천',
      price: '290,000',
      unit: '원/월',
      features: [
        '기본상품 전체 포함(카카오 친구추가+당근 단골추가)',
        '카카오 마케팅 대행',
        '당근 비즈프로필 최적화 세팅',
        '당근 소식 콘텐츠 제작·업로드',
        '당근 스토리 영상 제작·업로드',
        '재방문 유도 이벤트 기획·운영',
      ],
      ctaLabel: '상담 신청하기',
      isHighlighted: true,
    },
  ]

  return (
    <section id="pricing" className="py-24" style={{ background: '#fff' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#3D5AFE' }}>
            Pricing
          </p>
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: '#14151A', letterSpacing: '-0.02em', fontFamily: 'Pretendard Variable, sans-serif' }}
          >
            이용 요금제
          </h2>
          <p className="text-lg" style={{ color: 'rgba(20,21,26,0.6)' }}>
            숨은 비용 없습니다. 필요한 만큼만 선택하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map(({ name, badge, price, unit, features, ctaLabel, isHighlighted }) => (
            <div
              key={name}
              className="relative rounded-3xl p-8 border"
              style={
                isHighlighted
                  ? {
                      background: '#fff',
                      padding: '2px',
                      border: 'none',
                    }
                  : {
                      background: '#FAFAF8',
                      borderColor: '#E4E8ED',
                    }
              }
            >
              {isHighlighted ? (
                /* Gradient border wrapper for highlighted plan */
                <div
                  className="relative rounded-[22px] overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #FEE500, #FF8A3D)',
                    padding: 2,
                  }}
                >
                  <div className="rounded-[20px] p-7" style={{ background: '#fff' }}>
                    <PlanContent
                      name={name}
                      badge={badge}
                      price={price}
                      unit={unit}
                      features={features}
                      ctaLabel={ctaLabel}
                      isHighlighted={isHighlighted}
                    />
                  </div>
                </div>
              ) : (
                <PlanContent
                  name={name}
                  badge={badge}
                  price={price}
                  unit={unit}
                  features={features}
                  ctaLabel={ctaLabel}
                  isHighlighted={isHighlighted}
                />
              )}
            </div>
          ))}
        </div>

        <p
          className="text-center text-xs mt-8"
          style={{ color: 'rgba(20,21,26,0.4)' }}
        >
          세팅비는 매장 카카오 채널 · 당근 비즈프로필 초기 세팅 비용입니다. VAT 별도. 오픈 기념 할인은 사전 공지 없이 종료될 수 있습니다.
        </p>
      </div>
    </section>
  )
}

function PlanContent({
  name, badge, price, unit, features, ctaLabel, isHighlighted
}: {
  name: string; badge: string | null; price: string; unit: string;
  features: string[]; ctaLabel: string; isHighlighted: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: isHighlighted ? '#FF8A3D' : 'rgba(20,21,26,0.5)' }}
          >
            {name}
          </p>
          <div className="flex items-end gap-1 mt-2">
            <span
              className="font-mono-data text-4xl font-bold"
              style={{ color: '#14151A', letterSpacing: '-0.04em' }}
            >
              {price}
            </span>
            <span className="text-sm pb-1" style={{ color: 'rgba(20,21,26,0.5)' }}>
              {unit}
            </span>
          </div>
          {/* 세팅비 — 두 카드 동일 형식 */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-xs" style={{ color: 'rgba(20,21,26,0.4)' }}>
              세팅비
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: 'rgba(20,21,26,0.35)', textDecoration: 'line-through' }}
            >
              200,000원
            </span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(255,59,48,0.1)', color: '#FF3B30' }}
            >
              50% 할인중
            </span>
            <span className="text-xs font-bold" style={{ color: '#14151A' }}>
              100,000원
            </span>
          </div>
        </div>
        {badge && (
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #FEE500, #FF8A3D)',
              color: '#14151A',
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="space-y-3 mb-8">
        {features.map((f) => (
          <div key={f} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex-shrink-0" style={{ color: isHighlighted ? '#FF8A3D' : '#1FC77A' }}>
              ✓
            </span>
            <span className="text-sm" style={{ color: '#14151A' }}>
              {f}
            </span>
          </div>
        ))}
      </div>

      <button
        className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
        style={
          isHighlighted
            ? {
                background: 'linear-gradient(135deg, #FEE500, #FF8A3D)',
                color: '#14151A',
              }
            : {
                background: '#3D5AFE',
                color: '#fff',
              }
        }
      >
        {ctaLabel}
      </button>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────
   SECTION 8: 업종별 활용
───────────────────────────────────────────────────────────── */
function IndustrySection() {
  const [active, setActive] = useState(0)

  const industries = [
    {
      label: '☕ 카페',
      title: '커피 한 잔이 단골로',
      useCase:
        '"아메리카노 1,000원 할인" 쿠폰으로 재방문 유도. 카카오 알림톡으로 신메뉴 출시 때 자동 알림. 당근 소식으로 동네 손님에게 주 2회 노출.',
      metric1: { label: '평균 재방문율 상승', value: '+21%p' },
      metric2: { label: '카카오 채널 친구 증가', value: '월 +48명' },
      example: '홍대 카페 봄봄 — 런칭 2개월 후',
    },
    {
      label: '🍜 음식점',
      title: '한 번 온 테이블이 단골이 된다',
      useCase:
        '"다음 방문 서비스 1가지" 리워드로 재방문을 확약. 기업 점심 단체팀에게 "예약 전날" 알림톡으로 사전 예약 전환율 상승.',
      metric1: { label: '쿠폰 실사용율', value: '34%' },
      metric2: { label: '평균 객단가 상승', value: '+12%' },
      example: '마포 한식당 정들어 — 3개월 운영 후',
    },
    {
      label: '✂️ 미용실',
      title: '예약 공백을 단골로 채운다',
      useCase:
        '"다음 방문 1,000원 할인 + 무료 트리트먼트" 쿠폰. 쿠폰 만료 3일 전 자동 알림톡. 당근 소식으로 빈 시간대 집중 홍보.',
      metric1: { label: '예약 재방문율', value: '+28%p' },
      metric2: { label: '빈 시간대 예약', value: '월 +11건' },
      example: '신촌 케어헤어샵 — 4개월 운영 후',
    },
    {
      label: '🛒 기타 소매',
      title: '구매 후 다시 찾아오게',
      useCase:
        '"포인트 적립 2배" 또는 "사은품 증정" 이벤트로 재구매 사이클 단축. 당근 단골 기반 "입고 알림" 발송으로 신상품 소진 속도 향상.',
      metric1: { label: '구매 재방문 주기', value: '-6일 단축' },
      metric2: { label: '당근 단골 전환율', value: '41%' },
      example: '연남동 편집샵 도토리 — 2개월 운영 후',
    },
  ]

  const tab = industries[active]

  return (
    <section className="py-24" style={{ background: '#FAFAF8' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#3D5AFE' }}>
            Use Cases
          </p>
          <h2
            className="text-4xl font-bold"
            style={{ color: '#14151A', letterSpacing: '-0.02em', fontFamily: 'Pretendard Variable, sans-serif' }}
          >
            업종별 활용 방법
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {industries.map(({ label }, i) => (
            <button
              key={label}
              onClick={() => setActive(i)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={
                active === i
                  ? { background: '#14151A', color: '#fff' }
                  : { background: '#fff', color: 'rgba(20,21,26,0.6)', border: '1px solid #E4E8ED' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className="rounded-3xl p-10 border grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
          style={{ background: '#fff', borderColor: '#E4E8ED' }}
        >
          <div>
            <h3
              className="text-2xl font-bold mb-4"
              style={{ color: '#14151A', fontFamily: 'Pretendard Variable, sans-serif' }}
            >
              {tab.title}
            </h3>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(20,21,26,0.65)' }}>
              {tab.useCase}
            </p>
            <p className="text-xs font-medium" style={{ color: 'rgba(20,21,26,0.4)' }}>
              * {tab.example} (파일럿 데이터, 개인차 있음)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[tab.metric1, tab.metric2].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl p-6 text-center border"
                style={{ background: '#FAFAF8', borderColor: '#E4E8ED' }}
              >
                <p
                  className="font-mono-data text-3xl font-bold mb-2"
                  style={{ color: '#3D5AFE' }}
                >
                  {value}
                </p>
                <p className="text-xs" style={{ color: 'rgba(20,21,26,0.55)' }}>
                  {label}
                </p>
              </div>
            ))}

            {/* Illustration placeholder */}
            <div
              className="col-span-2 rounded-2xl p-6 flex items-center justify-center"
              style={{ background: '#F4F6F8', border: '1px dashed #E4E8ED', minHeight: 80 }}
            >
              <p className="text-sm text-center" style={{ color: 'rgba(20,21,26,0.35)' }}>
                실제 대시보드 스크린샷 자리
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SECTION 9: FAQ
───────────────────────────────────────────────────────────── */
function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  const faqs = [
    {
      q: '정말 직원 교육 없이도 운영이 가능한가요?',
      a: '네. 테이블이나 계산대에 QR 스탠드를 두면 손님이 알아서 스캔합니다. 쿠폰 사용처리도 관리자 앱에서 QR 스캔 한 번이면 끝납니다. 별도 교육 없이 당일 세팅 후 바로 운영 가능합니다.',
    },
    {
      q: '카카오 채널과 당근 비즈프로필은 제가 직접 만들어야 하나요?',
      a: '기본상품 이용 시 직접 만드셔야 합니다 (저희가 가이드 제공). 당근마케팅 상품 이용 시 세팅비 내 저희가 초기 세팅을 모두 대행합니다.',
    },
    {
      q: '수집한 전화번호 데이터는 어떻게 관리되나요?',
      a: '전화번호는 암호화해서 저장하고, 원문을 직접 조회할 수 없습니다. 참여자 동의 하에만 수집하며, 참여일로부터 1년 후 자동 파기됩니다. 대시보드에는 통계 수치만 표시되고, 개인정보 원문은 사장님 화면에도 노출되지 않습니다.',
    },
    {
      q: '게임 결과(당첨 확률)를 조작할 수 있나요?',
      a: '보상 종류별 확률과 일 한도·총 한도를 관리자 화면에서 직접 설정하실 수 있습니다. 단, 실제 당첨 여부는 서버에서만 계산합니다. 클라이언트(손님 화면) 측에서 결과를 바꿀 수 없어, 확률 조작 민원 위험이 없습니다.',
    },
    {
      q: '최소 계약 기간이 있나요?',
      a: '현재는 월 단위 구독입니다. 최소 1개월부터 시작 가능하고, 언제든 해지할 수 있습니다. 파일럿 기간 동안은 특별 조건을 제공하고 있습니다 — 문의 주세요.',
    },
    {
      q: '프랜차이즈나 다지점 매장도 사용할 수 있나요?',
      a: '네. 지점별로 별도 캠페인을 운영하거나, 본사에서 전 지점 캠페인을 일괄 배포하는 방식 모두 지원합니다. 지점별 성과 비교도 가능합니다. 프랜차이즈 계약은 별도 문의 부탁드립니다.',
    },
  ]

  return (
    <section id="faq" className="py-24" style={{ background: '#fff' }}>
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#3D5AFE' }}>
            FAQ
          </p>
          <h2
            className="text-4xl font-bold"
            style={{ color: '#14151A', letterSpacing: '-0.02em', fontFamily: 'Pretendard Variable, sans-serif' }}
          >
            자주 묻는 질문
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <div
              key={i}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: '#E4E8ED' }}
            >
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-[#FAFAF8]"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span
                  className="font-semibold text-base"
                  style={{ color: '#14151A', fontFamily: 'Pretendard Variable, sans-serif' }}
                >
                  {q}
                </span>
                <span
                  className="ml-4 flex-shrink-0 transition-transform duration-200"
                  style={{
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                    color: '#3D5AFE',
                    fontSize: 20,
                    fontWeight: 300,
                  }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div
                  className="px-6 pb-5 text-sm leading-relaxed"
                  style={{ color: 'rgba(20,21,26,0.65)', borderTop: '1px solid #E4E8ED' }}
                >
                  <p className="pt-4">{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SECTION 10: 하단 CTA 배너
───────────────────────────────────────────────────────────── */
function CtaBanner() {
  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: '#14151A' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(61,90,254,0.18) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8 border"
          style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#1FC77A] inline-block" />
          지금 파일럿 신청 받는 중
        </div>

        <h2
          className="text-5xl font-bold leading-tight mb-6 text-white"
          style={{ letterSpacing: '-0.025em', fontFamily: 'Pretendard Variable, sans-serif' }}
        >
          첫 달은 성과를 보고
          <br />
          결정하세요.
        </h2>

        <p
          className="text-lg leading-relaxed mb-10"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          파일럿 매장은 1개월 무료 또는 파격 저가로 시작합니다.
          <br />
          성과 데이터를 직접 확인하신 다음에 계속할지 결정하시면 됩니다.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <button
            className="px-9 py-4 rounded-xl font-bold text-base transition-all hover:opacity-90"
            style={{ background: '#3D5AFE', color: '#fff', boxShadow: '0 4px 24px rgba(61,90,254,0.4)' }}
          >
            파일럿 신청하기
          </button>
          <button
            type="button"
            onClick={openDemoModal}
            className="px-9 py-4 rounded-xl font-semibold text-base transition-all border"
            style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)' }}
          >
            먼저 데모 체험하기 →
          </button>
        </div>

        <p className="text-xs mt-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
          신용카드 등록 불필요 · 계약 없이 시작 · 언제든 종료 가능
        </p>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer
      className="border-t"
      style={{ background: '#14151A', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {/* 사업자 정보 */}
      <div
        className="max-w-6xl mx-auto px-6 py-8 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg, #FEE500, #FF8A3D)' }}
          >
            🥕
          </div>
          <span className="font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
            단골마케팅 · 아크웍스(ARK WORKS)
          </span>
        </div>
        <div
          className="text-xs leading-relaxed space-y-1"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <p>상호명 아크웍스 · 대표 양경직외 1인 · 사업자등록번호 628-33-01601</p>
          <p>통신판매업신고번호 제 2026-충남천안-1482호</p>
          <p>주소 천안시 서북구 2공단5로52, 룩소르비즈타워 863호</p>
          <p>
            전화{' '}
            <a href="tel:16883893" className="hover:text-white transition-colors">
              1688-3893
            </a>
            {' · '}
            이메일{' '}
            <a href="mailto:cola1won@naver.com" className="hover:text-white transition-colors">
              cola1won@naver.com
            </a>
          </p>
        </div>
      </div>

      {/* 링크 + 카피라이트 */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          className="flex gap-6 text-sm"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <a href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</a>
          <a href="/terms"   className="hover:text-white transition-colors">이용약관</a>
          <a href="mailto:cola1won@naver.com" className="hover:text-white transition-colors">문의하기</a>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          © 2026 아크웍스(ARK WORKS). All rights reserved.
        </p>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'Pretendard Variable, -apple-system, sans-serif', background: '#FAFAF8' }}>
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <GameProcessSection />
      <DanggeunSection />
      <KakaoSection />
      <DashboardSection />
      {/* <PricingSection /> */}
      <IndustrySection />
      <FaqSection />
      <CtaBanner />
      <Footer />
      <DemoModal />
    </div>
  )
}
