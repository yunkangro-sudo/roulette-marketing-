import sharp from 'sharp'

// 랜딩 화면 배경(bg_default_blank_sign.png) 상단의 순수 여백만 살짝 잘라내
// "화면이 모바일 화면보다 길다" 문제를 추가로 개선한다.
// 명판/캐비닛 구조는 그대로 유지하고, 이미지 그 자체의 빈 위쪽 마진만 제거.

const SRC = 'public/characters/bg_default_blank_sign.png'
const OUT = 'public/characters/bg_default_blank_sign_trimmed.png'
const TOP_TRIM = 60

const meta = await sharp(SRC).metadata()
const W = meta.width
const H = meta.height
const newH = H - TOP_TRIM

await sharp(SRC)
  .extract({ left: 0, top: TOP_TRIM, width: W, height: newH })
  .png()
  .toFile(OUT)

console.log('done', OUT, W, newH, 'trimmed', TOP_TRIM)
