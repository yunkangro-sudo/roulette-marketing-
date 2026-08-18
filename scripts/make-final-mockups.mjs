import sharp from 'sharp'
import fs from 'fs'

fs.mkdirSync('docs/design', { recursive: true })

const W = 941
const H = 1672
const TOP_PAD = 190
const BOTTOM_PAD = 260
const CANVAS_H = H + TOP_PAD + BOTTOM_PAD

const BG_TOP = '#e2c6a7'
const BG_BOTTOM = '#ede0c8'

const escape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const FONT_STYLE = `text { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; }`

function canvasBg() {
  return Buffer.from(`
<svg width="${W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BG_TOP}" />
      <stop offset="1" stop-color="${BG_BOTTOM}" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="${CANVAS_H}" fill="url(#bg)" />
</svg>`)
}

function overlay(children) {
  return Buffer.from(`
<svg width="${W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
  <style>${FONT_STYLE}</style>
  ${children}
</svg>`)
}

function button(cx, cy, w, h, label) {
  const x = cx - w / 2
  const y = cy - h / 2
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#f97316" />
  <text x="${cx}" y="${cy + 10}" font-size="32" font-weight="700" fill="#ffffff" text-anchor="middle">${escape(label)}</text>`
}

const machine = await sharp('public/characters/bg_default.png').toBuffer()

// 화면 1: 게임 시작화면(랜딩) — 상단 이벤트명, 하단 CTA + 안내 문구
const landingTop = overlay(`
  <text x="${W - 46}" y="56" font-size="22" fill="#222222" fill-opacity="0.72" text-anchor="end">내 쿠폰보관</text>
  <text x="${W / 2}" y="90" font-size="38" font-weight="700" fill="#222222" text-anchor="middle" letter-spacing="-0.5">8월 여름맞이 당근뽑기 이벤트 🥕</text>
  <text x="${W / 2}" y="140" font-size="26" fill="#222222" fill-opacity="0.55" text-anchor="middle">로그인 없이 바로 도전해 보세요!</text>
`)

const landingBottom = overlay(`
  ${button(W / 2, TOP_PAD + H + 110, 600, 96, '뽑기 시작')}
  <text x="${W / 2}" y="${TOP_PAD + H + 190}" font-size="22" fill="#222222" fill-opacity="0.45" text-anchor="middle">1일 1회 응모 가능</text>
`)

await sharp(canvasBg())
  .composite([
    { input: machine, left: 0, top: TOP_PAD },
    { input: landingTop, left: 0, top: 0 },
    { input: landingBottom, left: 0, top: 0 },
  ])
  .png()
  .toFile('docs/design/01_게임시작화면.png')

// 화면 2: 뽑기 시작 버튼이 보이는 플레이 화면 — 드래그 안내 + 좌우 화살표 + CTA
const playTop = overlay(`
  <text x="${W / 2}" y="100" font-size="24" fill="#222222" fill-opacity="0.5" text-anchor="middle">← 드래그해서 위치 조정 후 손 떼기 →</text>
`)

const playArrows = overlay(`
  <text x="210" y="${TOP_PAD + 400}" font-size="48" font-weight="900" fill="#00C7A7" text-anchor="middle">◀</text>
  <text x="${W - 210}" y="${TOP_PAD + 400}" font-size="48" font-weight="900" fill="#00C7A7" text-anchor="middle">▶</text>
`)

const playBottom = overlay(button(W / 2, TOP_PAD + H + 130, 600, 96, '뽑기 시작'))

await sharp(canvasBg())
  .composite([
    { input: machine, left: 0, top: TOP_PAD },
    { input: playTop, left: 0, top: 0 },
    { input: playArrows, left: 0, top: 0 },
    { input: playBottom, left: 0, top: 0 },
  ])
  .png()
  .toFile('docs/design/02_뽑기시작화면.png')

console.log('done', { W, CANVAS_H })
