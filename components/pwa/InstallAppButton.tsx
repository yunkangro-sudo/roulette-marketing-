'use client'

import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { getDeferredPrompt, isInstalled, subscribe, setAppleWebAppTitle, triggerInstall } from '@/lib/pwa/pwaInstall'

type Platform = 'android' | 'ios' | 'other'
type GuideKind = 'ios' | 'in-app' | null

interface Props {
  storeId: string
  storeName: string
}

/**
 * "내 쿠폰함 — 홈화면에 추가" 버튼.
 *
 * 서비스워커 등록/manifest 연결/beforeinstallprompt 캡처는 이 컴포넌트의 마운트
 * 시점(로그인 확인·데이터 로딩 이후)과 무관하게 `lib/pwa/pwaInstall.ts`에서 페이지
 * 로드 즉시 처리된다 — 여기서는 그 결과 상태를 구독해서 UI만 그린다.
 *
 * - 안드로이드(크롬 등): 캡처된 이벤트가 있을 때만 노출, 클릭 시 표준 설치창.
 *   이벤트가 안 잡히면(설치 조건 미충족 등) 버튼을 아예 숨긴다.
 * - iOS(사파리): 자동 설치 API가 없어서 "공유 → 홈 화면에 추가" 안내 팝업을 보여준다.
 *   이미 홈화면 앱으로 실행 중(navigator.standalone)이면 버튼을 숨긴다.
 * - 카카오톡 등 인앱 브라우저: beforeinstallprompt/공유시트 자체가 없거나 동작하지 않으므로,
 *   "다른 브라우저로 열기"부터 안내하는 별도 팝업을 보여준다.
 * - PC 등 그 외 환경: 버튼을 숨긴다.
 */
export default function InstallAppButton({ storeId, storeName }: Props) {
  const [platform, setPlatform] = useState<Platform>('other')
  const [isInApp, setIsInApp] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [hasPrompt, setHasPrompt] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [guide, setGuide] = useState<GuideKind>(null)

  useEffect(() => {
    const ua = window.navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    const android = /Android/.test(ua)
    setPlatform(ios ? 'ios' : android ? 'android' : 'other')

    // 카카오톡/인스타그램/라인/네이버 등 인앱 브라우저 — beforeinstallprompt·공유시트가
    // 정상 동작하지 않는 경우가 많아 "다른 브라우저로 열기"부터 안내해야 한다.
    setIsInApp(/KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER\(/i.test(ua))

    const standaloneIOS = (window.navigator as unknown as { standalone?: boolean }).standalone === true
    const standaloneDisplay = window.matchMedia?.('(display-mode: standalone)').matches ?? false
    setIsStandalone(standaloneIOS || standaloneDisplay)
  }, [])

  // storeId/storeName은 API 로딩 후에야 확정되므로, iOS 홈화면 타이틀만 보강한다
  // (manifest·서비스워커·이벤트 캡처는 이미 더 이전 시점에 pwaInstall.ts가 처리함).
  useEffect(() => {
    if (storeName) setAppleWebAppTitle(storeName)
  }, [storeId, storeName])

  useEffect(() => {
    setHasPrompt(!!getDeferredPrompt())
    setInstalled(isInstalled())
    return subscribe(() => {
      setHasPrompt(!!getDeferredPrompt())
      setInstalled(isInstalled())
    })
  }, [])

  const handleClick = useCallback(async () => {
    if (isInApp) {
      setGuide('in-app')
      return
    }
    if (platform === 'android' && hasPrompt) {
      await triggerInstall()
      return
    }
    if (platform === 'ios') {
      setGuide('ios')
    }
  }, [isInApp, platform, hasPrompt])

  if (isStandalone || installed) return null
  // 인앱 브라우저는 항상 노출(어떤 상황이든 안내가 필요), 그 외엔 실제 설치 가능성에 따라 노출
  const visible = isInApp || (platform === 'android' && hasPrompt) || platform === 'ios'
  if (!visible) return null

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#00C7A7] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#00B399]"
      >
        <span aria-hidden>📲</span>
        <span>홈화면에 추가</span>
      </button>

      {guide === 'ios' && <IOSGuideModal onClose={() => setGuide(null)} />}
      {guide === 'in-app' && <InAppGuideModal onClose={() => setGuide(null)} />}
    </>
  )
}

function ModalShell({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-[#222222]/6 py-3 text-sm font-bold text-[#222222]/60 transition-colors hover:bg-[#222222]/10"
        >
          닫기
        </button>
      </div>
    </div>
  )
}

function IOSGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose}>
      <h3 className="text-lg font-black text-[#222222]">홈 화면에 추가하기</h3>
      <p className="mt-1 text-sm text-[#222222]/50">아이폰은 아래 2단계만 따라해주세요</p>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#EFE6D6]/60 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
          <span aria-hidden>⬆️</span>
        </span>
        <p className="text-sm text-[#222222]/80">
          <span className="font-bold">1.</span> 사파리 하단(또는 상단)의{' '}
          <span className="font-bold text-[#00947A]">공유 버튼</span>을 눌러주세요
        </p>
      </div>

      <div className="mt-2 flex items-center gap-3 rounded-xl bg-[#EFE6D6]/60 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
          <span aria-hidden>➕</span>
        </span>
        <p className="text-sm text-[#222222]/80">
          <span className="font-bold">2.</span> 메뉴에서{' '}
          <span className="font-bold text-[#00947A]">&quot;홈 화면에 추가&quot;</span>를 선택해주세요
        </p>
      </div>

      <p className="mt-3 text-center text-xs text-[#222222]/35">
        ※ 반드시 사파리(Safari)에서 열어야 표시됩니다
      </p>
    </ModalShell>
  )
}

function InAppGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose}>
      <h3 className="text-lg font-black text-[#222222]">다른 브라우저로 열어주세요</h3>
      <p className="mt-1 text-sm text-[#222222]/50">
        지금 사용 중인 앱 내부 화면에서는 홈 화면 추가가 되지 않아요
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#EFE6D6]/60 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
          <span aria-hidden>⋮</span>
        </span>
        <p className="text-sm text-[#222222]/80">
          오른쪽 위(또는 아래) <span className="font-bold text-[#00947A]">메뉴 버튼</span>을 눌러{' '}
          <span className="font-bold text-[#00947A]">&quot;다른 브라우저로 열기&quot;</span>를 선택해주세요
        </p>
      </div>

      <p className="mt-3 text-center text-xs text-[#222222]/35">
        사파리 또는 크롬으로 열린 뒤, &quot;홈화면에 추가&quot; 버튼을 다시 눌러주세요
      </p>
    </ModalShell>
  )
}
