'use client'

import Link from 'next/link'
import { NAV_HEIGHT_PX, NAV_LINKS, SIGNUP_PATH } from '@/lib/landing-v5/config'

export default function Navbar() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-dg-line/80"
      style={{
        height: NAV_HEIGHT_PX,
        background: 'rgba(250, 247, 240, 0.78)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">
        <a href="#top" className="font-han text-[22px] text-dg-ink">
          단골<span className="text-dg-green">팅</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="주요 메뉴">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] text-dg-ink-soft transition-colors hover:text-dg-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link
          href={SIGNUP_PATH}
          className="border border-dg-ink bg-white px-3.5 py-2 text-[13px] font-semibold text-dg-ink transition-colors hover:bg-dg-ink hover:text-white md:px-4"
          style={{ borderRadius: 4 }}
        >
          상담 신청하기
        </Link>
      </div>
    </header>
  )
}
