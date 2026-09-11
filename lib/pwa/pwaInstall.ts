'use client'

/**
 * PWA 설치 준비(서비스워커 등록/manifest 연결/beforeinstallprompt 캡처)를
 * React 컴포넌트 마운트 시점과 완전히 분리해서 "이 모듈이 로드되는 즉시" 실행한다.
 *
 * 왜 분리했는가: 안드로이드 크롬은 페이지가 열리면 설치 가능 여부를 평가해서
 * 조건이 맞는 순간 beforeinstallprompt를 딱 한 번만 쏜다. 만약 이 리스너를
 * "로그인 확인 → /api/me/points 로딩 완료 후"에야 마운트되는 컴포넌트 안에서
 * 걸면, 그 사이 크롬이 이미 이벤트를 쏴버려서 놓치는 경우가 생긴다.
 * 그래서 로그인/데이터 로딩과 무관하게, 페이지 JS가 로드되는 즉시(모듈 최상단)
 * 리스너를 걸고 서비스워커도 등록해버린다.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Listener = () => void

let deferredEvent: BeforeInstallPromptEvent | null = null
let installed = false
let initialized = false
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((fn) => fn())
}

function init() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredEvent = e as BeforeInstallPromptEvent
    notify()
  })

  window.addEventListener('appinstalled', () => {
    installed = true
    deferredEvent = null
    notify()
  })

  // 서비스워커 등록 — PWA 설치 조건 충족용. 캐싱은 절대 하지 않는다(public/sw.js 참고).
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }

  // 매장별 동적 manifest 연결 — store_id별로 이름/시작 URL이 다르므로 정적 manifest 대신
  // API 라우트로 생성한다. URL의 store_id는 React 상태 로딩과 무관하게 즉시 읽을 수 있다.
  const storeId = new URLSearchParams(window.location.search).get('store_id') || ''
  if (storeId && !document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link')
    link.rel = 'manifest'
    link.href = `/api/pwa-manifest?store_id=${encodeURIComponent(storeId)}`
    document.head.appendChild(link)
  }

  // iOS는 홈화면 추가 시 manifest가 아니라 이 메타태그를 참고한다.
  if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
    const metaCapable = document.createElement('meta')
    metaCapable.name = 'apple-mobile-web-app-capable'
    metaCapable.content = 'yes'
    document.head.appendChild(metaCapable)
  }
}

export function getDeferredPrompt() {
  return deferredEvent
}

export function isInstalled() {
  return installed
}

export function subscribe(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** 매장명이 로드되면 iOS 홈화면 타이틀도 매장명으로 갱신한다 (없으면 "단골팅"). */
export function setAppleWebAppTitle(title: string) {
  if (typeof document === 'undefined') return
  let meta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'apple-mobile-web-app-title'
    document.head.appendChild(meta)
  }
  meta.content = title || '단골팅'
}

export async function triggerInstall(): Promise<'accepted' | 'dismissed' | null> {
  if (!deferredEvent) return null
  await deferredEvent.prompt()
  const { outcome } = await deferredEvent.userChoice
  if (outcome === 'accepted') installed = true
  deferredEvent = null
  notify()
  return outcome
}

// 모듈이 import되는 즉시 실행 — 이 파일을 import하는 컴포넌트가 실제로
// 렌더링/마운트되기도 전에(로그인 확인·데이터 로딩 중이라도) 바로 동작한다.
init()
