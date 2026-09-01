'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { NAV_HEIGHT_PX, NAV_LINKS, SIGNUP_PATH } from '@/lib/landing-v5/config'

const LOGIN_PATH = '/admin/login'
const AEO_PATH = '/aeo'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  // 패널 열려있는 동안 배경 스크롤 잠금 + ESC로 닫기 (PricingModals의 useModalChrome과 동일한 규칙)
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function close() {
    setOpen(false)
  }

  return (
    <>
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

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="메뉴 열기"
            aria-expanded={open}
            aria-haspopup="dialog"
            className="flex h-10 w-10 items-center justify-center text-dg-ink transition-colors hover:text-dg-green"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* 햄버거 메뉴 — 오른쪽 슬라이드 인 패널 */}
      {open && (
        <div className="fixed inset-0 z-[95]">
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={close}
            className="absolute inset-0 bg-black/45"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="주요 메뉴"
            className="absolute inset-y-0 right-0 flex w-full max-w-[340px] flex-col bg-white shadow-2xl"
            style={{ animation: 'dg-panel-in 0.22s ease-out' }}
          >
            <div
              className="flex shrink-0 items-center justify-between border-b border-dg-line px-5"
              style={{ height: NAV_HEIGHT_PX }}
            >
              <span className="font-han text-[18px] text-dg-ink">메뉴</span>
              <button
                type="button"
                onClick={close}
                aria-label="메뉴 닫기"
                className="flex h-9 w-9 items-center justify-center text-dg-ink-soft transition-colors hover:text-dg-ink"
              >
                <X size={20} />
              </button>
            </div>

            {/* 로그인 / 회원가입 — 정보 메뉴보다 위계 낮게, 상단에 작게 */}
            <div className="flex shrink-0 items-center gap-3 border-b border-dg-line px-5 py-4">
              <Link
                href={LOGIN_PATH}
                onClick={close}
                className="text-[14px] font-semibold text-dg-ink-soft transition-colors hover:text-dg-ink"
              >
                로그인
              </Link>
              <span className="text-dg-line">|</span>
              <Link
                href={SIGNUP_PATH}
                onClick={close}
                className="text-[14px] font-semibold text-dg-ink-soft transition-colors hover:text-dg-ink"
              >
                회원가입
              </Link>
            </div>

            {/* 정보성 메뉴 — 리스트 형태 */}
            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3" aria-label="정보 메뉴">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="rounded-lg px-3 py-3 text-[16px] font-semibold text-dg-ink transition-colors hover:bg-dg-bg"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href={AEO_PATH}
                onClick={close}
                className="rounded-lg px-3 py-3 text-[16px] font-semibold text-dg-ink transition-colors hover:bg-dg-bg"
              >
                AEO 홈페이지 제작
              </Link>
            </nav>

            {/* 상담 신청하기 — 맨 아래, 강조 CTA */}
            <div
              className="shrink-0 border-t border-dg-line p-5"
              style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
            >
              <Link
                href={SIGNUP_PATH}
                onClick={close}
                className="flex h-12 w-full items-center justify-center bg-dg-green text-[15px] font-bold text-dg-ink transition-opacity hover:opacity-90"
                style={{ borderRadius: 6 }}
              >
                상담 신청하기
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
