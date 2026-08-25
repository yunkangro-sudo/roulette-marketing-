/**
 * 이미지들을 브라우저 캐시에 미리 받아둔다 (화면 전환 시 즉시 렌더되도록).
 * <img> 태그를 실제로 그리는 게 아니라 임시 Image 객체로 요청만 보내는 방식이라
 * 화면에는 아무 영향 없이 백그라운드에서 조용히 다운로드된다.
 */
export function preloadImages(srcs: readonly string[]) {
  if (typeof window === 'undefined') return
  for (const src of srcs) {
    const img = new window.Image()
    img.src = src
  }
}
