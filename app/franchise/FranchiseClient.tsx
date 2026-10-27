'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  Gamepad2,
  Layers,
  Megaphone,
  MapPin,
  Network,
  Repeat,
  Ticket,
  TrendingUp,
  Users,
  Video,
  X,
} from 'lucide-react'
import '@/components/landing-v5/landing-v5.css'
import Navbar from '@/components/landing-v5/Navbar'
import BottomBar from '@/components/landing-v5/BottomBar'
import { Footer } from '@/components/landing-v5/Sections'
import { ContentOpsModal } from '@/components/landing-v5/PricingModals'
import { DEMO_PLAY_URL } from '@/lib/landing-v5/config'

/* ───────────── 컬러 (당근마켓 톤) ───────────── */
const ORANGE = '#FF6F0F'
const ORANGE_DEEP = '#E85D00'
const ORANGE_TINT = '#FFF1E6'
const INK = '#1F1F1F'
const BRAND = '해피 밀키트'

/* ───────────── 데이터 (제안서 PPT 4종 기준) ───────────── */

const GOALS = [
  {
    n: '01',
    icon: Megaphone,
    name: '브랜드 홍보',
    lead: '더 많은 지역 고객에게 브랜드 알리기',
    bullets: ['브랜드 대표 상품과 차별점 강조', '여러 지점의 브랜드 광고를 통합 운영', '브랜드 인지도 확대 캠페인에 활용'],
  },
  {
    n: '02',
    icon: MapPin,
    name: '지점 홍보',
    lead: '가까운 고객을 매장으로 연결하기',
    bullets: ['차도 거리 기준 선택', '도보 시간 기준 선택', '지점별 지역 특성에 맞게 운영'],
    note: '세부 설정 가능 범위는 광고 계정 및 상품 조건에 따릅니다.',
  },
  {
    n: '03',
    icon: TrendingUp,
    name: '매출 확대',
    lead: '상품·할인·쿠폰 혜택을 광고하세요',
    bullets: ['대표 상품 이미지 + 할인 혜택', '쿠폰·이벤트 안내', '매장 방문 또는 구매 행동 유도'],
    note: '실제 광고 성과는 소재·지역·예산 등에 따라 달라집니다.',
  },
  {
    n: '04',
    icon: Building2,
    name: '가맹점 모집',
    lead: '창업 상담 고객을 확보하세요',
    bullets: ['브랜드 경쟁력과 창업 혜택 소개', '가맹 상담 신청 유도', '신청 고객 후속 상담 진행'],
    note: '수익·매출 등은 실제 근거가 있는 정보만 광고에 사용합니다.',
  },
]

const SIX_GOALS = [
  { icon: Megaphone, label: '브랜드 홍보' },
  { icon: MapPin, label: '지점 홍보' },
  { icon: TrendingUp, label: '매출 확대' },
  { icon: Building2, label: '가맹점 모집' },
  { icon: Users, label: '신규 고객 확보' },
  { icon: Repeat, label: '단골 확보' },
]

const BEFORE_AFTER = [
  { before: '지점마다 광고를 따로 하느라 관리 불가', after: '본사 한 곳에서 지점 광고 통합 운영' },
  { before: '가맹 모집은 별도 광고, 별도 비용', after: '같은 광고 안에서 가맹 상담까지 연결' },
  { before: '광고 보고 한 번 오면 끝, 또 오지 않음', after: 'QR 게임·쿠폰으로 단골 전환' },
  { before: '지점별로 뭘 하는지 알 수 없음', after: '지점별 광고·이벤트 현황 한눈에' },
]

const HQ_POINTS = [
  { icon: Layers, title: '여러 지점 광고를 통합 관리', desc: '하나의 캠페인에서 최대 3,000개 지점 광고를 운영할 수 있습니다.' },
  { icon: BarChart3, title: '지점별 예산·입찰가 설정', desc: '본사가 예산을 정하고, 지점마다 입찰가를 세밀하게 조정합니다.' },
  { icon: Network, title: '공통 기준 또는 지점별 맞춤', desc: '본사 공통 소재와 지역 맞춤 운영을 필요에 따라 함께 씁니다.' },
]

const DIFFS = [
  {
    icon: Repeat,
    tag: 'DIFFERENCE 01',
    title: '광고 이후에도 고객과 다시 만나는 구조',
    desc: '광고 노출에서 끝나지 않도록, 게임 참여와 후속 홍보를 연결합니다.',
    steps: ['QR 게임 참여', '단골 등록 유도', '지속적인 고객 소통'],
    foot: '확보한 단골 대상 소식·쿠폰 발행으로 추가 홍보 기회를 넓힙니다.',
    note: '실제 소식·쿠폰 노출 및 알림 범위는 당근의 기능과 운영 정책에 따라 달라질 수 있습니다.',
  },
  {
    icon: Video,
    tag: 'DIFFERENCE 02',
    title: '하나의 콘텐츠를 여러 홍보 접점으로',
    desc: '브랜드 행사와 프로모션 콘텐츠를 제작해 유료 광고부터 추가 홍보까지 다양하게 활용합니다.',
    steps: ['정기 소식 발행', '유료 광고 소재 활용', '당근 스토리 등 추가 노출'],
    foot: '하나의 콘텐츠를 광고와 추가 홍보에 함께 활용해 홍보 기회를 넓힙니다.',
    note: '월 10회 공통 소식 발행은 기존 운영 범위 기준입니다. 쇼츠 제작은 계약 포함 여부를 별도 확인하세요.',
  },
]

const MONTHLY_SERVICES = [
  '당근 브랜드 프로필 통합 관리',
  '브랜드 프로필 바이럴 소식 월 10회 작성·발행',
  '본사 공통 프로모션 및 이벤트 콘텐츠 운영',
  '본사 광고 예산에 따른 광고 집행 및 관리',
  '단골팅 QR 게임 이벤트 연동',
  '지점별 광고 및 이벤트 운영 현황 관리',
]

const PROCESS = [
  { n: '01', title: '본사가 광고 예산 결정', desc: '지점당 월 광고비 3만~10만 원 기준' },
  { n: '02', title: '당근 광고 운영', desc: '브랜드·지역·상품·가맹 모집 홍보' },
  { n: '03', title: '단골팅 게임 이벤트', desc: 'QR 참여와 혜택으로 고객 참여 유도' },
  { n: '04', title: '결과 확인 및 운영 관리', desc: '지점별 광고·이벤트 현황 확인' },
]

/** 지점 수별 요금표. 단골팅 지점당 월 3만 원 + 광고비 지점당 월 2만 원 가정(제안서 기준) */
const PRICE_COLS = [
  { branches: '10개 지점', service: '30만 원', ad: '20만 원', monthly: '50만 원', setup: '50만 원', first: '100만 원' },
  { branches: '20개 지점', service: '60만 원', ad: '40만 원', monthly: '100만 원', setup: '50만 원', first: '150만 원' },
  { branches: '50개 지점', service: '150만 원', ad: '100만 원', monthly: '250만 원', setup: '50만 원', first: '300만 원' },
  { branches: '100개 지점', service: '300만 원', ad: '200만 원', monthly: '500만 원', setup: '50만 원', first: '550만 원', best: true },
]

const PRICE_ROWS: { label: string; key: 'service' | 'ad' | 'monthly' | 'setup' | 'first'; strong?: boolean }[] = [
  { label: '단골팅 이용요금', key: 'service' },
  { label: '당근 광고비', key: 'ad' },
  { label: '월 예상 합계', key: 'monthly', strong: true },
  { label: '최초 운영 세팅비', key: 'setup' },
  { label: '첫 달 예상 합계', key: 'first', strong: true },
]

const FORECAST_FUNNEL = [
  { label: '광고 노출', value: '약 60만~370만 회' },
  { label: '광고 클릭', value: '약 3,900~57,000회' },
  { label: '후속 행동', value: '매장 방문 · 구매 · 가맹 상담 문의' },
]

const FORECAST_EFFECTS = [
  { icon: Megaphone, title: '브랜딩 효과', desc: '지역 고객에게 브랜드와 대표 상품을 반복 노출할 기회' },
  { icon: TrendingUp, title: '판매 촉진 효과', desc: '상품·할인·쿠폰 광고로 지점 방문과 구매 행동 유도' },
  { icon: Users, title: '지점 확보 효과', desc: '창업 혜택과 브랜드 경쟁력을 알리고 상담 신청 유도' },
]

const BRANCH_ROWS = ['강남점', '서초점', '잠실점', '홍대점', '건대점', '분당점', '판교점']

/* ───────────── 훅 · 공통 UI ───────────── */

function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen] as const
}

/** 스크롤 진입 시 부드럽게 나타나는 래퍼 */
function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.12)
  return (
    <div
      ref={ref}
      className={`fr-reveal transition-all duration-700 ease-out ${seen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** 숫자 카운트업 (스크롤 진입 시 시작) */
function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.4)
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!seen) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(to)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, to, duration])
  return <span ref={ref}>{v.toLocaleString('ko-KR')}</span>
}

/** 형광펜 강조 */
function Mark({ children, color = ORANGE }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="relative inline"
      style={{ backgroundImage: `linear-gradient(transparent 62%, ${color}33 62%)`, color: ORANGE_DEEP }}
    >
      {children}
    </span>
  )
}

function SectionHead({
  eyebrow,
  title,
  desc,
  light = false,
}: {
  eyebrow: string
  title: ReactNode
  desc?: ReactNode
  light?: boolean
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span
        className="inline-block px-3 py-1 text-[11px] font-extrabold tracking-[0.16em]"
        style={{ borderRadius: 999, background: light ? 'rgba(255,255,255,0.12)' : ORANGE_TINT, color: light ? '#FFB27A' : ORANGE_DEEP }}
      >
        {eyebrow}
      </span>
      <h2 className={`mt-4 text-[28px] leading-[1.3] md:text-[40px] ${light ? 'text-white' : 'text-dg-ink'}`}>{title}</h2>
      {desc && (
        <p className={`mt-4 text-[15px] leading-relaxed md:text-[17px] ${light ? 'text-white/65' : 'text-dg-ink-soft'}`}>{desc}</p>
      )}
    </div>
  )
}

/** 접이식 상세 */
function Fold({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <details className="group border border-dg-line bg-white open:shadow-[0_10px_30px_rgba(31,31,31,0.07)]" style={{ borderRadius: 14 }}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 md:px-7 md:py-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[16px] font-extrabold text-dg-ink md:text-[18px]">{title}</span>
          {sub && <span className="mt-0.5 block text-[13px] text-dg-ink-soft">{sub}</span>}
        </span>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center transition-transform duration-300 group-open:rotate-180"
          style={{ borderRadius: 999, background: ORANGE_TINT, color: ORANGE_DEEP }}
        >
          <ChevronDown size={18} />
        </span>
      </summary>
      <div className="border-t border-dg-line px-5 pb-6 pt-5 md:px-7">{children}</div>
    </details>
  )
}

/* ───────────── 목업 컴포넌트 ───────────── */

/** 당근 앱 느낌의 폰 목업. children = 피드 중간에 끼는 광고 카드 */
function PhoneMock({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <div className="mx-auto w-[220px] shrink-0">
      <div
        className="relative border-[6px] bg-white p-2 shadow-[0_18px_40px_rgba(31,31,31,0.14)]"
        style={{ borderColor: INK, borderRadius: 30 }}
      >
        <div className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-neutral-200" />
        <div className="flex items-center justify-between px-1.5 pb-2">
          <span className="text-[11px] font-extrabold text-dg-ink">서초2동</span>
          <span className="flex gap-1">
            <i className="block h-3 w-3 rounded-full bg-neutral-200" />
            <i className="block h-3 w-3 rounded-full bg-neutral-200" />
          </span>
        </div>
        {/* 피드 */}
        <div className="space-y-2 px-1">
          <FeedSkeleton />
          {children}
          <FeedSkeleton />
        </div>
        <div className="mt-2 flex justify-around border-t border-neutral-100 pt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} className="block h-2.5 w-2.5 rounded-full" style={{ background: i === 0 ? ORANGE : '#E5E5E5' }} />
          ))}
        </div>
      </div>
      {caption && <p className="mt-3 text-center text-[11.5px] text-dg-ink-soft/80">{caption}</p>}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="flex gap-2">
      <i className="block h-11 w-11 shrink-0 rounded-lg bg-neutral-100" />
      <div className="flex-1 space-y-1.5 pt-1">
        <i className="block h-2 w-4/5 rounded bg-neutral-100" />
        <i className="block h-2 w-1/2 rounded bg-neutral-100" />
        <i className="block h-2 w-1/3 rounded bg-neutral-100" />
      </div>
    </div>
  )
}

/** 피드 속 광고 카드 */
function AdCard({ emoji, title, sub, cta }: { emoji: string; title: string; sub: string; cta: string }) {
  return (
    <div
      className="fr-ad-glow relative bg-white p-2"
      style={{ borderRadius: 12, border: `2px solid ${ORANGE}`, boxShadow: `0 6px 18px ${ORANGE}33` }}
    >
      <div className="flex gap-2">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center text-[24px]"
          style={{ borderRadius: 8, background: ORANGE_TINT }}
        >
          {emoji}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold leading-snug text-dg-ink">{title}</p>
          <p className="mt-0.5 text-[10px] text-dg-ink-soft">
            {sub} · <span style={{ color: ORANGE_DEEP }}>광고</span>
          </p>
        </div>
      </div>
      <p className="mt-1.5 text-right text-[10px] font-bold" style={{ color: ORANGE_DEEP }}>
        {cta} &gt;
      </p>
    </div>
  )
}

/** 연출 ① — 100개 지점을 한 화면에서 설정 */
function AdminMock() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3)
  return (
    <div ref={ref} className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      {/* 지도 카드 */}
      <div className="border border-dg-line bg-white p-5 shadow-[0_14px_36px_rgba(31,31,31,0.08)]" style={{ borderRadius: 20 }}>
        <p className="text-[14px] font-extrabold text-dg-ink">지역 범위</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['차도 거리 기준', '도보 시간 기준'].map((t, i) => (
            <span
              key={t}
              className="px-3 py-1.5 text-[12px] font-bold"
              style={{
                borderRadius: 999,
                background: i === 1 ? ORANGE : '#F4F4F4',
                color: i === 1 ? '#fff' : '#666',
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          {['20분', '30분', '40분'].map((t) => (
            <span
              key={t}
              className="px-3 py-1 text-[12px] font-bold"
              style={{ borderRadius: 999, background: t === '30분' ? INK : '#F4F4F4', color: t === '30분' ? '#fff' : '#666' }}
            >
              {t}
            </span>
          ))}
        </div>
        {/* 지도 */}
        <div
          className="relative mt-4 h-[210px] overflow-hidden"
          style={{
            borderRadius: 14,
            background:
              'repeating-linear-gradient(0deg, transparent 0 34px, #00000008 34px 35px), repeating-linear-gradient(90deg, transparent 0 34px, #00000008 34px 35px), #F6F1E8',
          }}
        >
          <div
            className={`absolute left-1/2 top-1/2 h-[150px] w-[190px] -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${seen ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
            style={{
              borderRadius: '46% 54% 50% 50% / 55% 45% 55% 45%',
              background: `${ORANGE}40`,
              border: `2px solid ${ORANGE}`,
            }}
          />
          <span className="fr-ping absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: ORANGE }} />
          <MapPin
            size={26}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[85%]"
            style={{ color: ORANGE_DEEP }}
            fill="#fff"
          />
          <span
            className="absolute left-3 top-3 bg-white px-2.5 py-1 text-[11px] font-extrabold shadow"
            style={{ borderRadius: 8, color: ORANGE_DEEP }}
          >
            도보 30분 반경 · 예시
          </span>
        </div>
      </div>

      {/* 지점 리스트 카드 */}
      <div className="border border-dg-line bg-white p-5 shadow-[0_14px_36px_rgba(31,31,31,0.08)]" style={{ borderRadius: 20 }}>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-extrabold text-dg-ink">광고그룹 설정</p>
          <span className="px-2.5 py-1 text-[11px] font-extrabold text-white" style={{ borderRadius: 999, background: ORANGE }}>
            대상 지점 100개
          </span>
        </div>
        <div className="mt-3 overflow-hidden border border-dg-line" style={{ borderRadius: 12 }}>
          <div className="grid grid-cols-[28px_1fr_70px_80px] bg-neutral-50 px-3 py-2 text-[11px] font-bold text-dg-ink-soft">
            <span />
            <span>지점</span>
            <span>범위</span>
            <span className="text-right">일 예산</span>
          </div>
          {BRANCH_ROWS.map((b, i) => (
            <div
              key={b}
              className="grid grid-cols-[28px_1fr_70px_80px] items-center border-t border-dg-line px-3 py-2 text-[12.5px]"
              style={{ background: seen ? ORANGE_TINT : '#fff', transition: `background 0.4s ease ${i * 160}ms` }}
            >
              <span
                className="flex h-4 w-4 items-center justify-center"
                style={{
                  borderRadius: 4,
                  background: seen ? ORANGE : '#E5E5E5',
                  transition: `background 0.3s ease ${i * 160}ms`,
                }}
              >
                <Check size={11} color="#fff" strokeWidth={3} />
              </span>
              <span className="font-bold text-dg-ink">해피 밀키트 {b}</span>
              <span className="text-dg-ink-soft">도보 30분</span>
              <span className="font-num text-right text-dg-ink">지점별 설정</span>
            </div>
          ))}
          <div className="border-t border-dg-line bg-neutral-50 px-3 py-2 text-center text-[11.5px] font-bold text-dg-ink-soft">
            … 외 93개 지점 · 한 번에 적용
          </div>
        </div>
        <p className="mt-3 text-[11.5px] text-dg-ink-soft/80">※ 이해를 돕기 위한 예시 화면입니다.</p>
      </div>
    </div>
  )
}

/** 연출 ③ — 가맹 문의가 자동으로 쌓이는 3단계 */
function LeadFlowMock() {
  const steps = [
    {
      label: '1. 광고를 봅니다',
      body: (
        <AdCard emoji="🏪" title={`${BRAND} 가맹점 모집`} sub="냉동 밀키트 유통" cta="상담 신청" />
      ),
    },
    {
      label: '2. 번호는 자동 입력',
      body: (
        <div className="space-y-2 px-1 pt-1">
          <p className="text-[11px] font-extrabold text-dg-ink">신청 정보를 확인해 주세요</p>
          <div className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[10.5px] text-dg-ink-soft">핸드폰 번호</div>
          <div className="font-num rounded-lg border px-2 py-1.5 text-[11px] font-bold" style={{ borderColor: ORANGE, background: ORANGE_TINT, color: ORANGE_DEEP }}>
            010-1234-5678
          </div>
          <div className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[10.5px] text-dg-ink-soft">이름</div>
          <div className="mt-2 py-2 text-center text-[11px] font-extrabold text-white" style={{ borderRadius: 8, background: ORANGE }}>
            동의하고 신청 완료하기
          </div>
        </div>
      ),
    },
    {
      label: '3. 신청 끝',
      body: (
        <div className="flex flex-col items-center px-1 py-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: ORANGE }}>
            <Check size={26} strokeWidth={3} />
          </span>
          <p className="mt-3 text-[12px] font-extrabold text-dg-ink">신청이 완료되었어요!</p>
          <p className="mt-1 text-[10px] leading-relaxed text-dg-ink-soft">1~2일 내 담당자가 연락드려요</p>
        </div>
      ),
    },
  ]
  return (
    <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center md:gap-3">
      {steps.map((s, i) => (
        <div key={s.label} className="flex flex-col items-center md:flex-row md:items-center">
          <div>
            <p
              className="mx-auto mb-3 w-fit px-3 py-1.5 text-[12px] font-extrabold text-white"
              style={{ borderRadius: 999, background: ORANGE }}
            >
              {s.label}
            </p>
            <PhoneMock>{s.body}</PhoneMock>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="mt-6 hidden md:block" size={30} style={{ color: ORANGE }} strokeWidth={2.5} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ───────────── 페이지 ───────────── */

export default function FranchiseClient() {
  const [consultOpen, setConsultOpen] = useState(false)
  const openConsult = () => setConsultOpen(true)

  return (
    <div className="landing-v5 min-h-screen">
      <style>{`
        @keyframes fr-shine { 0% { transform: translateX(-120%) skewX(-20deg); } 60%,100% { transform: translateX(260%) skewX(-20deg); } }
        @keyframes fr-ping { 0% { box-shadow: 0 0 0 0 ${ORANGE}99; } 100% { box-shadow: 0 0 0 22px ${ORANGE}00; } }
        @keyframes fr-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes fr-glow { 0%,100% { box-shadow: 0 6px 18px ${ORANGE}33; } 50% { box-shadow: 0 6px 26px ${ORANGE}88; } }
        .fr-cta { position: relative; overflow: hidden; }
        .fr-cta::after { content: ''; position: absolute; inset: 0; width: 40%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent); animation: fr-shine 3.2s ease-in-out infinite; }
        .fr-ping { animation: fr-ping 1.8s ease-out infinite; }
        .fr-float { animation: fr-float 4.5s ease-in-out infinite; }
        .fr-ad-glow { animation: fr-glow 2.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .fr-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          .fr-cta::after, .fr-ping, .fr-float, .fr-ad-glow { animation: none !important; }
        }
      `}</style>

      <Navbar />
      <main className="pt-16">
        {/* 1. HERO — 이미지 한 장으로 이해시키기 */}
        <section className="relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${ORANGE_TINT} 0%, #fff 100%)` }}>
          <div className="mx-auto max-w-5xl px-4 pb-14 pt-6 md:pb-20 md:pt-10">
            <h1 className="sr-only">당근 하나로, 전국의 모든 지점이 더 크게 성장합니다 — 당근 프랜차이즈 마케팅</h1>
            <Reveal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/franchise/hero.png"
                alt="당근 하나로 전국의 모든 지점이 더 크게 성장합니다. 당근 광고 × 단골팅 프랜차이즈 통합 마케팅 솔루션"
                width={1024}
                height={575}
                fetchPriority="high"
                className="w-full shadow-[0_24px_60px_rgba(255,111,15,0.22)]"
                style={{ borderRadius: 20 }}
              />
            </Reveal>

            <Reveal delay={150} className="mt-10 text-center">
              <p className="text-[24px] font-extrabold leading-snug text-dg-ink md:text-[40px]">
                지점 100개 광고, <Mark>이제 본사 한 곳에서 끝.</Mark>
              </p>
              <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-dg-ink-soft md:text-[17px]">
                당근에 광고하고, 단골팅 게임으로 손님을 다시 오게 만듭니다.
              </p>

              <div className="mx-auto mt-7 grid max-w-2xl grid-cols-3 gap-2 md:gap-3">
                {[
                  { k: '최대 3,000개', v: '지점 한 번에 운영' },
                  { k: '월 30,000원', v: '지점당 이용요금' },
                  { k: '광고→게임→단골', v: '재방문까지 연결' },
                ].map((b) => (
                  <div
                    key={b.k}
                    className="border bg-white px-2 py-3 md:px-4 md:py-4"
                    style={{ borderRadius: 14, borderColor: `${ORANGE}55` }}
                  >
                    <p className="text-[13px] font-extrabold leading-tight md:text-[18px]" style={{ color: ORANGE_DEEP }}>
                      {b.k}
                    </p>
                    <p className="mt-1 text-[11px] text-dg-ink-soft md:text-[13px]">{b.v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={openConsult}
                  className="fr-cta group flex h-14 w-full items-center justify-center gap-2 px-9 text-[16px] font-extrabold text-white transition-transform hover:-translate-y-0.5 sm:w-auto"
                  style={{ borderRadius: 10, background: ORANGE, boxShadow: `0 12px 28px ${ORANGE}59` }}
                >
                  도입 상담 신청
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href={DEMO_PLAY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-14 w-full items-center justify-center gap-2 border-2 bg-white px-9 text-[16px] font-extrabold transition-colors hover:bg-[#FFF1E6] sm:w-auto"
                  style={{ borderRadius: 10, borderColor: ORANGE, color: ORANGE_DEEP }}
                >
                  <Gamepad2 size={19} />
                  게임 직접 체험하기
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 2. 병목 → 해결 */}
        <section className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-5">
            <Reveal>
              <SectionHead
                eyebrow="PROBLEM → SOLUTION"
                title={
                  <>
                    프랜차이즈 마케팅,
                    <br />
                    <Mark>이래서 막혀 있었죠?</Mark>
                  </>
                }
                desc="본사 대표님들이 가장 많이 말씀하시는 4가지 고민을 한 번에 풀어드립니다."
              />
            </Reveal>

            <div className="mt-12 space-y-3">
              {BEFORE_AFTER.map((r, i) => (
                <Reveal key={r.before} delay={i * 90}>
                  <div className="grid items-stretch gap-2 md:grid-cols-[1fr_44px_1fr] md:gap-0">
                    <div
                      className="flex items-center gap-3 border border-dg-line bg-neutral-50 px-5 py-4 md:py-5"
                      style={{ borderRadius: 14 }}
                    >
                      <X size={20} className="shrink-0 text-neutral-400" strokeWidth={2.5} />
                      <span className="text-[14.5px] font-semibold text-neutral-500 md:text-[16px]">{r.before}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <ArrowRight size={22} className="rotate-90 md:rotate-0" style={{ color: ORANGE }} strokeWidth={2.75} />
                    </div>
                    <div
                      className="flex items-center gap-3 px-5 py-4 md:py-5"
                      style={{ borderRadius: 14, background: ORANGE_TINT, border: `2px solid ${ORANGE}` }}
                    >
                      <Check size={22} className="shrink-0" style={{ color: ORANGE }} strokeWidth={3} />
                      <span className="text-[15px] font-extrabold text-dg-ink md:text-[17px]">{r.after}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 3. 지점 100개를 한 화면에서 (연출 ①) */}
        <section className="py-20 md:py-28" style={{ background: ORANGE_TINT }}>
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <SectionHead
                eyebrow="ONE DASHBOARD"
                title={
                  <>
                    지점 100개 광고,
                    <br />
                    <Mark>화면 하나로 끝</Mark>
                  </>
                }
                desc="최대 3,000개 지점을 하나의 캠페인에 연결해 한 번에 운영합니다. 반경은 걸어서 몇 분, 차로 몇 km까지 지점별로 정할 수 있어요."
              />
            </Reveal>
            <div className="mt-12">
              <AdminMock />
            </div>

            {/* 본사 통합 운영 포인트 */}
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {HQ_POINTS.map((p, i) => (
                <Reveal key={p.title} delay={i * 100}>
                  <div className="h-full bg-white p-6" style={{ borderRadius: 16 }}>
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                      style={{ background: ORANGE }}
                    >
                      <p.icon size={20} strokeWidth={2} />
                    </span>
                    <h3 className="mt-4 text-[17px] text-dg-ink">{p.title}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-dg-ink-soft">{p.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <p className="mt-4 text-center text-[11.5px] text-dg-ink-soft/80">
              ※ 최대 운영 지점 수는 당근 공식 자료의 적용 조건을 확인해 표기했습니다. 세부 설정 가능 범위는 광고 계정 및 상품 조건에 따릅니다.
            </p>
          </div>
        </section>

        {/* 4. 큰 숫자 3개 */}
        <section className="py-20 text-white md:py-28" style={{ background: INK }}>
          <div className="mx-auto max-w-5xl px-5">
            <Reveal>
              <SectionHead
                light
                eyebrow="BY THE NUMBERS"
                title={
                  <>
                    숫자로 보면,
                    <br />이렇게 <span style={{ color: ORANGE }}>간단합니다</span>
                  </>
                }
              />
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                { to: 3000, unit: '개', label: '한 번에 운영하는 지점 수', note: '당근 공식 안내 기준 최대' },
                { to: 30000, unit: '원', label: '지점당 월 이용요금', note: '단골팅 서비스 + 광고 운영대행 · 부가세 별도' },
                { to: 10, unit: '회', label: '본사 공통 소식, 매월 발행', note: '등록된 지점에 동일하게 노출' },
              ].map((n, i) => (
                <Reveal key={n.label} delay={i * 120}>
                  <div
                    className="h-full border px-6 py-8 text-center"
                    style={{ borderRadius: 20, borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
                  >
                    <p className="font-num text-[44px] font-bold leading-none md:text-[54px]" style={{ color: ORANGE }}>
                      <CountUp to={n.to} />
                      <span className="ml-1 text-[22px] text-white">{n.unit}</span>
                    </p>
                    <p className="mt-4 text-[16px] font-extrabold text-white">{n.label}</p>
                    <p className="mt-1.5 text-[12.5px] text-white/50">{n.note}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 5. 내 광고가 이렇게 뜹니다 (연출 ②) + 6가지 목표 */}
        <section className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <SectionHead
                eyebrow="HOW YOUR AD LOOKS"
                title={
                  <>
                    같은 광고 자리,
                    <br />
                    <Mark>목적은 3가지</Mark>
                  </>
                }
                desc={`당근 피드 속 ${BRAND} 광고는 이렇게 보입니다. 팔고, 불러오고, 가맹점까지 모읍니다.`}
              />
            </Reveal>

            <div className="-mx-5 mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 md:mx-0 md:justify-center md:overflow-visible md:px-0">
              {[
                {
                  tag: '매출 확대',
                  ad: <AdCard emoji="🥩" title={`[${BRAND}] 냉동 고기 밀키트 오늘만 할인`} sub="서초동" cta="구매하기" />,
                },
                {
                  tag: '쿠폰 · 방문',
                  ad: <AdCard emoji="🎁" title="게임하고 첫 구매 쿠폰 받으세요" sub={BRAND} cta="참여하기" />,
                },
                {
                  tag: '가맹점 모집',
                  ad: <AdCard emoji="🏪" title={`${BRAND} 가맹점 모집, 창업 상담 받으세요`} sub="냉동 밀키트 유통" cta="상담 신청" />,
                },
              ].map((p, i) => (
                <div key={p.tag} className="snap-center">
                  <span
                    className="mx-auto mb-3 block w-fit px-3.5 py-1.5 text-[13px] font-extrabold text-white"
                    style={{ borderRadius: 999, background: ORANGE }}
                  >
                    {i + 1}. {p.tag}
                  </span>
                  <div className={i === 1 ? 'fr-float' : ''}>
                    <PhoneMock caption="예시 화면">{p.ad}</PhoneMock>
                  </div>
                </div>
              ))}
            </div>

            {/* 6가지 한 번에 */}
            <div className="mt-16">
              <p className="text-center text-[18px] font-extrabold text-dg-ink md:text-[22px]">
                <Mark>당근 하나로 6가지 성장</Mark>을 한 번에
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-6">
                {SIX_GOALS.map((g, i) => (
                  <Reveal key={g.label} delay={i * 70}>
                    <div className="flex flex-col items-center gap-2 py-2">
                      <span
                        className="flex h-14 w-14 items-center justify-center rounded-full md:h-16 md:w-16"
                        style={{ background: ORANGE_TINT, color: ORANGE }}
                      >
                        <g.icon size={26} strokeWidth={1.9} />
                      </span>
                      <span className="text-[12.5px] font-bold text-dg-ink md:text-[14px]">{g.label}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. 단골팅 연결 — 광고 → 게임 → 쿠폰 → 재방문 */}
        <section className="py-20 md:py-28" style={{ background: ORANGE_TINT }}>
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <SectionHead
                eyebrow="DANGOLTING"
                title={
                  <>
                    광고로 데려오고,
                    <br />
                    <Mark>게임으로 다시 오게 합니다</Mark>
                  </>
                }
                desc="광고만 하면 한 번 오고 끝입니다. 단골팅 QR 게임과 쿠폰이 붙으면 재방문까지 이어집니다."
              />
            </Reveal>
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Megaphone, title: '광고 유입', desc: '당근에서 매장·브랜드를 발견' },
                { icon: Gamepad2, title: '게임 참여', desc: 'QR로 인형뽑기 이벤트 참여' },
                { icon: Ticket, title: '쿠폰 혜택', desc: '브랜드 정책에 맞는 혜택 안내' },
                { icon: BarChart3, title: '성과 확인', desc: '게임·쿠폰 관련 데이터 확인' },
              ].map((s, i) => (
                <Reveal key={s.title} delay={i * 110}>
                  <div className="relative h-full bg-white p-6" style={{ borderRadius: 16 }}>
                    <div className="flex items-center justify-between">
                      <span className="font-num text-[13px] font-bold" style={{ color: ORANGE }}>
                        0{i + 1}
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: ORANGE }}>
                        <s.icon size={18} strokeWidth={2} />
                      </span>
                    </div>
                    <h3 className="mt-4 text-[18px] text-dg-ink">{s.title}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-dg-ink-soft">{s.desc}</p>
                    {i < 3 && (
                      <ArrowRight
                        size={22}
                        className="absolute -right-3.5 top-1/2 z-10 hidden -translate-y-1/2 lg:block"
                        style={{ color: ORANGE }}
                        strokeWidth={3}
                      />
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
              <a
                href={DEMO_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="fr-cta flex h-14 w-full items-center justify-center gap-2 px-9 text-[16px] font-extrabold text-white sm:w-auto"
                style={{ borderRadius: 10, background: INK }}
              >
                <Gamepad2 size={19} />
                게임 직접 체험하기
              </a>
              <span className="font-num text-[12px] text-dg-ink-soft">dgting.co.kr/play/ca-01</span>
            </div>
          </div>
        </section>

        {/* 7. 가맹 문의 자동 수집 (연출 ③) */}
        <section className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-5">
            <Reveal>
              <SectionHead
                eyebrow="FRANCHISE LEADS"
                title={
                  <>
                    가맹 문의가
                    <br />
                    <Mark>자동으로 쌓입니다</Mark>
                  </>
                }
                desc="광고 보고 → 번호 확인 → 상담 신청 끝. 손님은 번호를 직접 입력하지 않아도 됩니다."
              />
            </Reveal>
            <div className="mt-12">
              <LeadFlowMock />
            </div>
            <p className="mt-8 text-center text-[11.5px] text-dg-ink-soft/80">
              ※ 이해를 돕기 위한 예시 화면입니다. 리드폼은 객관식·주관식 질문, 필수/선택 응답, 개인정보 동의 단계를 구성할 수 있습니다.
            </p>
          </div>
        </section>

        {/* 8. 요금 */}
        <section className="py-20 md:py-28" style={{ background: ORANGE_TINT }}>
          <div className="mx-auto max-w-4xl px-5">
            <Reveal>
              <SectionHead
                eyebrow="PRICING"
                title={
                  <>
                    100개 지점이어도
                    <br />
                    <Mark>월 500만 원대로 시작</Mark>
                  </>
                }
                desc="단골팅 지점당 월 30,000원 + 당근 광고비(지점당 월 2만 원 가정). 부가세 별도."
              />
            </Reveal>

            <div className="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
              <div className="bg-white p-6 text-center" style={{ borderRadius: 18 }}>
                <p className="text-[13px] font-bold text-dg-ink-soft">단골팅 이용요금</p>
                <p className="font-num mt-2 text-[34px] font-bold" style={{ color: ORANGE }}>
                  30,000원
                </p>
                <p className="mt-1 text-[13px] text-dg-ink-soft">지점당 / 월</p>
              </div>
              <div className="bg-white p-6 text-center" style={{ borderRadius: 18 }}>
                <p className="text-[13px] font-bold text-dg-ink-soft">초기 운영 세팅비</p>
                <p className="font-num mt-2 text-[34px] font-bold" style={{ color: ORANGE }}>
                  500,000원
                </p>
                <p className="mt-1 text-[13px] text-dg-ink-soft">브랜드 전체 · 최초 1회</p>
              </div>
            </div>

            <div className="mt-6">
              <Fold title="지점 수별 요금표 보기" sub="10 · 20 · 50 · 100개 지점 기준">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-dg-line">
                        <th className="py-3 pr-3 text-[13px] font-bold text-dg-ink-soft">비용 항목</th>
                        {PRICE_COLS.map((c) => (
                          <th
                            key={c.branches}
                            className="px-3 py-3 text-right text-[13px] font-bold"
                            style={{ color: c.best ? ORANGE_DEEP : INK }}
                          >
                            {c.branches}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PRICE_ROWS.map((r) => (
                        <tr key={r.key} className="border-b border-dg-line/60" style={{ background: r.strong ? ORANGE_TINT : undefined }}>
                          <td className={`py-3.5 pr-3 pl-2 text-[14px] ${r.strong ? 'font-extrabold' : ''} text-dg-ink`}>{r.label}</td>
                          {PRICE_COLS.map((c) => (
                            <td
                              key={c.branches}
                              className={`font-num whitespace-nowrap px-3 py-3.5 text-right text-[14px] text-dg-ink ${r.strong ? 'font-bold' : ''}`}
                            >
                              {c[r.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-dg-ink-soft/80">
                  ※ 최초 세팅비는 브랜드 전체 최초 1회입니다. 실제 광고비는 본사 예산과 운영 조건에 따라 달라질 수 있습니다. 광고비·부가세 별도.
                </p>
              </Fold>
            </div>
          </div>
        </section>

        {/* 9. 더 알아보기 (접이식) */}
        <section className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-4xl px-5">
            <Reveal>
              <SectionHead eyebrow="MORE DETAILS" title="더 자세히 알고 싶으신가요?" desc="궁금한 항목만 펼쳐서 확인하세요." />
            </Reveal>

            <div className="mt-10 space-y-3">
              <Fold title="4가지 성장 목표 자세히" sub="브랜드 홍보 · 지점 홍보 · 매출 확대 · 가맹점 모집">
                <div className="grid gap-4 sm:grid-cols-2">
                  {GOALS.map((g) => (
                    <div key={g.n} className="border border-dg-line p-5" style={{ borderRadius: 12 }}>
                      <div className="flex items-center justify-between">
                        <span className="font-num text-[14px] font-bold" style={{ color: ORANGE }}>
                          {g.n}
                        </span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: ORANGE_TINT, color: ORANGE }}>
                          <g.icon size={17} strokeWidth={1.9} />
                        </span>
                      </div>
                      <h3 className="mt-3 text-[17px] text-dg-ink">{g.name}</h3>
                      <p className="mt-1 text-[13.5px] text-dg-ink-soft">{g.lead}</p>
                      <ul className="mt-3 space-y-2">
                        {g.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-2 text-[13.5px] text-dg-ink">
                            <Check size={14} className="mt-1 shrink-0" style={{ color: ORANGE }} strokeWidth={3} />
                            {b}
                          </li>
                        ))}
                      </ul>
                      {g.note && <p className="mt-3 text-[11.5px] leading-relaxed text-dg-ink-soft/70">※ {g.note}</p>}
                    </div>
                  ))}
                </div>
              </Fold>

              <Fold title="이렇게 운영됩니다" sub="운영 4단계 + 월간 운영 서비스 6가지">
                <ol className="grid gap-3 sm:grid-cols-2">
                  {PROCESS.map((p) => (
                    <li key={p.n} className="border border-dg-line p-4" style={{ borderRadius: 12 }}>
                      <span className="font-num text-[13px] font-bold" style={{ color: ORANGE }}>
                        {p.n}
                      </span>
                      <p className="mt-1 text-[15px] font-extrabold text-dg-ink">{p.title}</p>
                      <p className="mt-1 text-[13px] text-dg-ink-soft">{p.desc}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 text-[15px] font-extrabold text-dg-ink">월간 운영 서비스 6가지</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {MONTHLY_SERVICES.map((s, i) => (
                    <li key={s} className="flex items-center gap-3 px-4 py-3 text-[13.5px] font-semibold text-dg-ink" style={{ borderRadius: 10, background: ORANGE_TINT }}>
                      <span className="font-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: ORANGE }}>
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[12px] text-dg-ink-soft/80">※ 월 10회 소식은 본사 공통 콘텐츠로, 등록된 지점에 동일하게 노출됩니다.</p>
              </Fold>

              <Fold title="광고 이후에도 다시 만나는 구조" sub="단골팅만의 차별점 2가지">
                <div className="grid gap-4 md:grid-cols-2">
                  {DIFFS.map((d) => (
                    <div key={d.tag} className="border border-dg-line p-5" style={{ borderRadius: 12 }}>
                      <div className="flex items-center justify-between">
                        <span className="font-num text-[11px] font-bold tracking-[0.14em]" style={{ color: ORANGE_DEEP }}>
                          {d.tag}
                        </span>
                        <d.icon size={18} style={{ color: ORANGE }} strokeWidth={1.9} />
                      </div>
                      <h3 className="mt-3 text-[17px] leading-snug text-dg-ink">{d.title}</h3>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-dg-ink-soft">{d.desc}</p>
                      <ol className="mt-3 space-y-1.5">
                        {d.steps.map((s, i) => (
                          <li key={s} className="flex items-center gap-2.5 text-[13.5px] text-dg-ink">
                            <span className="font-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: ORANGE }}>
                              {i + 1}
                            </span>
                            {s}
                          </li>
                        ))}
                      </ol>
                      <p className="mt-3 border-t border-dg-line pt-3 text-[13px] font-bold text-dg-ink">{d.foot}</p>
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-dg-ink-soft/70">※ {d.note}</p>
                    </div>
                  ))}
                </div>
              </Fold>

              <Fold title="100개 지점 광고 효과 예상" sub="노출·클릭 추정치와 클릭당 250원 계산 예시">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { k: '월 광고 예산', v: '300만~1,000만 원', s: '본사 결정 예산' },
                    { k: '예상 노출', v: '약 60만~370만 회', s: '업종 참고치 환산' },
                    { k: '예상 클릭', v: '약 3,900~57,000회', s: '업종 참고치 환산' },
                    { k: '대상 규모', v: '100개 지점', s: '본사 통합 운영' },
                  ].map((x) => (
                    <div key={x.k} className="border border-dg-line p-3 text-center" style={{ borderRadius: 12 }}>
                      <p className="text-[12px] font-semibold text-dg-ink-soft">{x.k}</p>
                      <p className="font-num mt-1.5 text-[14px] font-bold leading-snug text-dg-ink">{x.v}</p>
                      <p className="mt-1 text-[11px] text-dg-ink-soft/70">{x.s}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-5" style={{ borderRadius: 12, background: ORANGE_TINT }}>
                  <p className="text-center text-[14px] font-extrabold text-dg-ink">예상 광고 퍼널 · 지점당 월 3만~10만 원 기준</p>
                  <div className="mt-4 space-y-2">
                    {FORECAST_FUNNEL.map((f, i) => (
                      <div
                        key={f.label}
                        className="mx-auto flex items-center justify-between gap-3 bg-white px-4 py-3 text-[13.5px]"
                        style={{ borderRadius: 8, width: `${100 - i * 8}%` }}
                      >
                        <span className="font-bold text-dg-ink">{f.label}</span>
                        <span className="font-num text-right text-[13px] font-bold" style={{ color: ORANGE_DEEP }}>
                          {f.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {FORECAST_EFFECTS.map((e) => (
                    <div key={e.title} className="border border-dg-line p-4" style={{ borderRadius: 12 }}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: ORANGE_TINT, color: ORANGE }}>
                        <e.icon size={17} strokeWidth={1.9} />
                      </span>
                      <p className="mt-2 text-[15px] font-extrabold text-dg-ink">{e.title}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-dg-ink-soft">{e.desc}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-[14px] font-extrabold text-dg-ink">클릭당 약 250원 기준, 이렇게 계산해요</p>
                <p className="mt-1 text-[12.5px] text-dg-ink-soft">예상 클릭 수 = 광고비 ÷ 250원 (평균 CPC 250원 가정)</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[400px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-dg-line">
                        <th className="py-2.5 pr-3 text-[13px] font-bold text-dg-ink-soft">구분</th>
                        <th className="px-3 py-2.5 text-right text-[13px] font-bold text-dg-ink">월 1만 원 예시</th>
                        <th className="py-2.5 pl-3 text-right text-[13px] font-bold" style={{ color: ORANGE_DEEP }}>
                          20개 지점 × 월 2만 원
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['월 광고비', '10,000원', '400,000원'],
                        ['월 조회수', '약 3,000회', '약 60,000회'],
                        ['예상 클릭 수', '약 40회', '약 1,600회'],
                      ].map(([a, b, c]) => (
                        <tr key={a} className="border-b border-dg-line/60">
                          <td className="py-3 pr-3 text-[13.5px] font-semibold text-dg-ink">{a}</td>
                          <td className="font-num px-3 py-3 text-right text-[13.5px] text-dg-ink">{b}</td>
                          <td className="font-num py-3 pl-3 text-right text-[13.5px] font-bold text-dg-ink">{c}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-[11.5px] leading-relaxed text-dg-ink-soft/70">
                  ※ 월 1만 원은 클릭당 비용을 이해하기 위한 계산 예시이며, 실제 광고 집행 최소 예산은 지점당 월 2만 원입니다. 노출·클릭은 과거 공유된
                  업종별 참고 범위를 예산에 비례해 환산한 추정치이며, 업종·지역·소재·입찰 조건에 따라 실제 결과가 달라집니다. 매출·방문·가맹 계약 수는
                  전환율 데이터가 없어 수치로 단정하지 않았습니다.
                </p>
              </Fold>

              <Fold title="100개 지점 통합 운영 견적 요약" sub="지점당 월 3만 원 + 광고비 협의 (부가세 별도)">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-5" style={{ borderRadius: 12, background: ORANGE_TINT }}>
                    <p className="text-[13px] text-dg-ink-soft">단골팅 이용요금</p>
                    <p className="font-num mt-1 text-[24px] font-bold" style={{ color: ORANGE_DEEP }}>
                      지점당 월 3만 원
                    </p>
                    <p className="mt-1 text-[12px] text-dg-ink-soft">부가세 별도 · 브랜드 전체 최초 세팅비 50만 원 (1회)</p>
                  </div>
                  <div className="p-5" style={{ borderRadius: 12, background: ORANGE_TINT }}>
                    <p className="text-[13px] text-dg-ink-soft">+ 당근 광고비</p>
                    <p className="font-num mt-1 text-[24px] font-bold" style={{ color: ORANGE_DEEP }}>
                      지점당 월 3만 원~ 협의
                    </p>
                    <p className="mt-1 text-[12px] text-dg-ink-soft">본사 예산에 맞춰 결정 · 견적 유효기간 발행일로부터 30일</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openConsult}
                  className="mt-5 flex h-11 items-center justify-center gap-2 px-6 text-[14px] font-extrabold text-white"
                  style={{ borderRadius: 8, background: ORANGE }}
                >
                  우리 브랜드 맞춤 견적 받기
                  <ArrowRight size={15} />
                </button>
              </Fold>
            </div>
          </div>
        </section>

        {/* 10. CTA */}
        <section className="relative overflow-hidden py-20 text-center text-white md:py-28" style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_DEEP} 100%)` }}>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: '#FFD2A8' }}
          />
          <div className="relative mx-auto max-w-2xl px-5">
            <p className="text-[12px] font-extrabold tracking-[0.18em] text-white/80">LET&apos;S TALK</p>
            <h2 className="mt-3 text-[28px] leading-[1.3] text-white md:text-[42px]">
              우리 브랜드 지점 광고,
              <br />
              지금 한 곳에서 시작하세요
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/85 md:text-[17px]">
              브랜드명과 연락처만 남겨주시면, 지점 수와 예산에 맞춰 담당자가 연락드립니다.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={openConsult}
                className="fr-cta flex h-14 w-full items-center justify-center gap-2 bg-white px-10 text-[16px] font-extrabold transition-transform hover:-translate-y-0.5 sm:w-auto"
                style={{ borderRadius: 10, color: ORANGE_DEEP, boxShadow: '0 14px 30px rgba(0,0,0,0.18)' }}
              >
                <ClipboardList size={18} />
                도입 상담 신청
              </button>
              <a
                href="tel:16883893"
                className="flex h-14 w-full items-center justify-center border-2 border-white/70 px-10 text-[16px] font-extrabold text-white transition-colors hover:bg-white/10 sm:w-auto"
                style={{ borderRadius: 10 }}
              >
                1688-3893 전화 상담
              </a>
            </div>
            <p className="mt-6 text-[12px] text-white/70">아크웍스 | 당근 광고 × 단골팅 | 광고비·부가세 별도</p>
          </div>
        </section>
      </main>
      <Footer />
      <BottomBar />

      {consultOpen && (
        <ContentOpsModal
          onClose={() => setConsultOpen(false)}
          source="landing_v5_franchise"
          title="당근 프랜차이즈 마케팅 상담"
          description="브랜드 정보를 남겨주시면, 담당자가 지점 수와 예산에 맞춰 상담을 위해 연락드려요."
          nameLabel="브랜드명"
          namePlaceholder="예: 해피 밀키트"
        />
      )}
    </div>
  )
}
