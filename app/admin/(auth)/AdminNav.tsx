'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AdminSessionData } from '@/lib/admin/session'

const ROLE_LABEL: Record<string, string> = {
  advertiser: '광고주',
  staff: '직원',
  agency: '에이전시',
  super_admin: '슈퍼관리자',
}

export default function AdminNav({ account }: { account: NonNullable<AdminSessionData['account']> }) {
  const router = useRouter()
  const { role } = account

  const isAgencyOrSuper = role === 'super_admin' || role === 'agency'
  const isAdvertiser    = role === 'advertiser'

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <span className="text-lg font-bold text-gray-900 shrink-0">🥕 단골마케팅</span>

          {/* ── super_admin / agency: 6개 메뉴 ── */}
          {isAgencyOrSuper && (
            <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-600">
              <Link href="/admin/dashboard"      className="hover:text-orange-500 transition-colors">전체 대시보드</Link>
              <Link href="/admin/companies"      className="hover:text-orange-500 transition-colors">업체 리스트</Link>
              <Link href="/admin/events"         className="hover:text-orange-500 transition-colors">이벤트 관리</Link>
              <Link href="/admin/report"         className="hover:text-orange-500 transition-colors">성과 리포트</Link>
              <Link href="/admin/loyalty-settings"  className="hover:text-orange-500 transition-colors">포인트 정책</Link>
              <Link href="/admin/reward-catalog" className="hover:text-orange-500 transition-colors">리워드 관리</Link>
            </div>
          )}

          {/* ── advertiser: 6개 메뉴 ── */}
          {isAdvertiser && (
            <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-600">
              <Link href="/admin/events"            className="hover:text-orange-500 transition-colors">이벤트 관리</Link>
              <Link href="/admin/report"            className="hover:text-orange-500 transition-colors">성과 리포트</Link>
              <Link href="/admin/loyalty-settings"  className="hover:text-orange-500 transition-colors">포인트 정책</Link>
              <Link href="/admin/reward-catalog"    className="hover:text-orange-500 transition-colors">리워드 관리</Link>
              <Link href="/admin/coupons/issue"     className="hover:text-orange-500 transition-colors">쿠폰 발급</Link>
              <Link href="/staff"
                className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1 rounded-lg font-semibold transition-colors">
                계산대 →
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">{ROLE_LABEL[role] ?? role}</p>
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{account.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  )
}
