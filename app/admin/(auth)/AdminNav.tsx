'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { AdminSessionData } from '@/lib/admin/session'

const ROLE_LABEL: Record<string, string> = {
  advertiser: '광고주',
  staff: '직원',
  agency: '에이전시',
  super_admin: '슈퍼관리자',
}

type NavLink = { href: string; label: string; highlight?: boolean }

export default function AdminNav({
  account,
  homepageFeatureEnabled,
}: {
  account: NonNullable<AdminSessionData['account']>
  /** 광고주(대리접속 포함) 전용 — 매장 홈페이지 유료 기능이 켜져 있어야 메뉴에 노출된다 */
  homepageFeatureEnabled?: boolean
}) {
  const router = useRouter()
  const { role } = account
  const [menuOpen, setMenuOpen] = useState(false)

  const isAgencyOrSuper = role === 'super_admin' || role === 'agency'
  const isAdvertiser    = role === 'advertiser'
  const impersonation   = account.impersonation
  const cornerLabel     = impersonation ? '대리접속 중' : (ROLE_LABEL[role] ?? role)
  const cornerName      = impersonation ? impersonation.storeName : account.email
  const homeHref        = isAgencyOrSuper ? '/admin/super/dashboard' : '/admin/dashboard'

  const links: NavLink[] = isAgencyOrSuper
    ? [
        { href: '/admin/super/dashboard',     label: '전체 대시보드' },
        { href: '/admin/companies',           label: '업체 리스트' },
        { href: '/admin/super/subscriptions', label: '업체 구독관리' },
        { href: '/admin/super/demo-stores',   label: '샘플 레퍼런스' },
      ]
    : isAdvertiser
    ? [
        { href: '/admin/dashboard',         label: '대시보드' },
        { href: '/admin/company',           label: '업체 정보' },
        { href: '/admin/events',            label: '이벤트 관리' },
        { href: '/admin/members',           label: '회원 관리' },
        { href: '/admin/report',            label: '성과 리포트' },
        { href: '/admin/loyalty-settings',  label: '포인트 정책' },
        { href: '/admin/reward-catalog',    label: '리워드 관리' },
        { href: '/admin/coupons',           label: '쿠폰 관리' },
        // 매장 홈페이지는 유료 애드온 — 슈퍼관리자가 켜주기 전까지 메뉴 자체를 숨긴다
        ...(homepageFeatureEnabled ? [{ href: '/admin/business-page', label: '매장 홈페이지' }] : []),
        { href: '/staff',                   label: '계산대 →', highlight: true },
      ]
    : []

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  function handleLinkClick() {
    setMenuOpen(false)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-5">
          <Link href={homeHref} className="shrink-0 flex items-center" aria-label="관리자 첫 화면으로 이동">
            <Image src="/logo.png" alt="단골팅" width={945} height={487} priority className="h-7 w-auto" />
          </Link>

          {/* ── 데스크톱 메뉴 (640px 이상) ── */}
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-600">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={link.highlight
                  ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1 rounded-lg font-semibold transition-colors'
                  : 'hover:text-orange-500 transition-colors'}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">{cornerLabel}</p>
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{cornerName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            로그아웃
          </button>

          {/* ── 모바일 햄버거 버튼 (640px 미만) ── */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="메뉴 열기"
            aria-expanded={menuOpen}
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── 모바일 드로어 메뉴 ── */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
          <div className="px-1 pb-2 mb-1 border-b border-gray-100">
            <p className="text-xs text-gray-500">{cornerLabel}</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{cornerName}</p>
          </div>

          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={handleLinkClick}
              className={link.highlight
                ? 'block bg-orange-50 text-orange-600 px-3 py-3 rounded-lg font-semibold text-base active:bg-orange-100 transition-colors'
                : 'block px-3 py-3 rounded-lg text-base font-medium text-gray-700 active:bg-gray-100 transition-colors'}
            >
              {link.label}
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-3 rounded-lg text-base font-medium text-red-600 active:bg-red-50 transition-colors"
          >
            로그아웃
          </button>
        </div>
      )}
    </nav>
  )
}
