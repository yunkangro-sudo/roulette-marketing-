import sharp from 'sharp'

const SRC = 'public/characters/bg_default.png'

// 실측한 집게(로드+조인트+프롱) 바운딩 박스
const BBOX = { left: 195, top: 396, width: 212, height: 272 }
// 배경(레일) 그라디언트를 복제할 좌/우 여백 폭
const SAMPLE_PAD = 6

async function main() {
  const img = sharp(SRC)
  const meta = await img.metadata()
  const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true })
  const w = info.width, h = info.height, c = info.channels

  const px = (x, y) => {
    const i = (y * w + x) * c
    return [data[i], data[i + 1], data[i + 2]]
  }

  const { left, top, width, height } = BBOX
  const leftX = left - SAMPLE_PAD
  const rightX = left + width + SAMPLE_PAD

  // 1) 빈 배경(bg_default_empty.png): 집게 영역을 좌우 그라디언트로 채워서 클론
  const patch = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    const gy = top + y
    const L = px(leftX, gy)
    const R = px(rightX, gy)
    for (let x = 0; x < width; x++) {
      const t = x / (width - 1)
      const r = Math.round(L[0] * (1 - t) + R[0] * t)
      const g = Math.round(L[1] * (1 - t) + R[1] * t)
      const b = Math.round(L[2] * (1 - t) + R[2] * t)
      const i = (y * width + x) * 4
      patch[i] = r; patch[i + 1] = g; patch[i + 2] = b; patch[i + 3] = 255
    }
  }
  const patchImg = sharp(patch, { raw: { width, height, channels: 4 } })

  await sharp(SRC)
    .composite([{ input: await patchImg.png().toBuffer(), left, top }])
    .png()
    .toFile('public/characters/bg_default_empty.png')

  // 2) 집게 스프라이트 추출 (알파 채널로 배경 제거)
  const cropRaw = await sharp(SRC).extract(BBOX).raw().toBuffer({ resolveWithObject: true })
  const cw = cropRaw.info.width, ch = cropRaw.info.height, cc = cropRaw.info.channels
  const out = Buffer.alloc(cw * ch * 4)

  // 배경색 추정: 크롭 네 모서리 평균
  const corner = (x, y) => {
    const i = (y * cw + x) * cc
    return [cropRaw.data[i], cropRaw.data[i + 1], cropRaw.data[i + 2]]
  }
  const corners = [corner(0, 0), corner(cw - 1, 0), corner(0, ch - 1), corner(cw - 1, ch - 1)]

  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * cc
      const r = cropRaw.data[i], g = cropRaw.data[i + 1], b = cropRaw.data[i + 2]

      // 금속(금색/흰색) 판정: 채도 높은 골드 또는 밝은 화이트 세라믹 밴드
      const isGold = r > 130 && (r - b) > 45 && (g - b) > 10
      const isWhiteCeramic = r > 200 && g > 195 && b > 175 && Math.abs(r - g) < 25

      let alpha = 0
      if (isGold || isWhiteCeramic) {
        alpha = 255
      } else {
        // 배경 그라디언트와의 색 거리 기반 소프트 알파 (앤티에일리어싱 경계 보존)
        let minDist = Infinity
        for (const c0 of corners) {
          const d = Math.abs(r - c0[0]) + Math.abs(g - c0[1]) + Math.abs(b - c0[2])
          if (d < minDist) minDist = d
        }
        alpha = minDist > 40 ? Math.min(255, Math.round((minDist - 40) * 6)) : 0
      }

      const o = (y * cw + x) * 4
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = alpha
    }
  }

  await sharp(out, { raw: { width: cw, height: ch, channels: 4 } })
    .png()
    .toFile('public/characters/crane_claw_arm.png')

  console.log('BBOX', BBOX, 'imgSize', w, h)
  console.log('done')
}

main()
