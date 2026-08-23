import sharp from 'sharp'

// 실제 프로덕션 에셋을 그대로 사용해 "수정될 화면" 완성 목업만 생성한다.
// 코드는 건드리지 않고, 미리보기 이미지 파일만 만든다.

const SRC = 'public/characters/bg_default.png' // 크레인 포함된 기본 배경(대기 상태)
const OUT = 'scripts/_mockup_play_screen.png'

const meta = await sharp(SRC).metadata()
const W = meta.width // 941
const H = meta.height // 1672

// 상단 순수 여백만 살짝 트리밍(명판/프레임 구조는 그대로 유지) — 요청: "상단 여백 살짝 줄이기"
const TOP_TRIM = 55
const newH = H - TOP_TRIM

// 원본 좌표(트리밍 반영 전) — 기존 코드 상수와 동일
const SIGN_LEFT = 40, SIGN_RIGHT = 908, SIGN_TOP = 98, SIGN_BOTTOM = 315
// 트리밍 반영한 새 좌표
const signTop = SIGN_TOP - TOP_TRIM
const signBottom = SIGN_BOTTOM - TOP_TRIM
const signLeft = SIGN_LEFT
const signWidth = SIGN_RIGHT - SIGN_LEFT
const signHeight = signBottom - signTop

// 버튼 폭은 참고 이미지에서 실측한 값 유지, 높이는 동일하게 유지
const BTN_LEFT = 168
const BTN_RIGHT = 770
const BTN_HEIGHT = 121

// 세로 위치는 "프레임 하단 골드 테두리 끝(GLASS_BOTTOM)"과 "하단 굵은 금색 트림 시작(TRIM_TOP)"
// 사이의 순수 크림색 여백 한가운데로 재계산 — 실측 좌표(원본 941x1672 기준)
const HOUSING_BLANK_TOP = 1370
const HOUSING_BLANK_BOTTOM = 1530
const housingCenter = (HOUSING_BLANK_TOP + HOUSING_BLANK_BOTTOM) / 2

const btnLeft = BTN_LEFT
const btnWidth = BTN_RIGHT - BTN_LEFT
const btnHeight = BTN_HEIGHT
const btnTop = housingCenter - btnHeight / 2 - TOP_TRIM
const btnRadius = 22

const storeName = '8월 테스트 매장'

const svg = `
<svg width="${W}" height="${newH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="signGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EFDDC2" />
      <stop offset="55%" stop-color="#E7CB9C" />
      <stop offset="100%" stop-color="#D6AC72" />
    </linearGradient>
  </defs>

  <!-- 명판 위 예시 텍스트를 가리고 실제 매장명 표시 -->
  <rect x="${signLeft}" y="${signTop}" width="${signWidth}" height="${signHeight}" fill="url(#signGrad)" />
  <text
    x="${signLeft + signWidth / 2}"
    y="${signTop + signHeight / 2}"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="'Malgun Gothic','Apple SD Gothic Neo',sans-serif"
    font-size="56"
    font-weight="800"
    letter-spacing="2"
    fill="#3A2A18"
  >${storeName}</text>

  <!-- 뽑기 시작 버튼 — 참고 이미지와 동일한 위치/크기로 오버레이 -->
  <rect x="${btnLeft}" y="${btnTop}" width="${btnWidth}" height="${btnHeight}" rx="${btnRadius}" fill="#00C7A7" />
  <text
    x="${W / 2}"
    y="${btnTop + btnHeight / 2}"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="'Malgun Gothic','Apple SD Gothic Neo',sans-serif"
    font-size="40"
    font-weight="800"
    fill="#FFFFFF"
  >뽑기 시작</text>
</svg>
`

await sharp(SRC)
  .extract({ left: 0, top: TOP_TRIM, width: W, height: newH })
  .composite([{ input: Buffer.from(svg) }])
  .png()
  .toFile(OUT)

console.log('done', OUT, W, newH)
