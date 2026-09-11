/**
 * PWA 설치 조건 충족용 "최소" 서비스워커.
 *
 * 절대 캐싱하지 않는다 — 게임 결과/쿠폰 상태/포인트는 항상 서버에서
 * 실시간으로 받아야 하므로, 여기서 응답을 캐시하면 손님이 오래된 쿠폰
 * 상태·지난 게임 결과를 다시 보게 되는 사고로 이어질 수 있다.
 *
 * install/activate만 처리하고, fetch는 그대로 네트워크로 통과시킨다
 * (일부 구형 브라우저가 "설치 가능" 판정에 fetch 핸들러 존재를 요구하는
 * 경우가 있어 핸들러 자체는 등록하되, 캐시 개입 없이 pass-through만 한다).
 */

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // 캐시 조회/저장 없음 — 항상 네트워크로만 응답한다.
  event.respondWith(fetch(event.request))
})
