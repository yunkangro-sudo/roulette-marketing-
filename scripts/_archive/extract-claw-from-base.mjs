import sharp from 'sharp'

const srcPath = 'public/characters/기본화면.png'
const outPath = 'public/characters/crane_claw_arm.png'
const previewPath = 'docs/design/claw_extract_preview.png'
const spritePath = 'docs/design/claw_sprite.png'

const IMG_W = 941
const IMG_H = 1672
const X0 = 180
const X1 = 420
const Y0 = 310
const Y1 = 560

const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({
  resolveWithObject: true,
})
const c = info.channels
const mask = new Uint8Array(IMG_W * IMG_H)

const isGold = (r, g, b) => r > 140 && g > 85 && b < 145 && r - b > 35 && r >= g - 5

for (let y = Y0; y <= Y1; y++) {
  for (let x = X0; x <= X1; x++) {
    const i = (y * IMG_W + x) * c
    if (isGold(data[i], data[i + 1], data[i + 2])) mask[y * IMG_W + x] = 1
  }
}

// 금색 주변 4px 팽창 → 흰 관절·가장자리 포함
for (let pass = 0; pass < 4; pass++) {
  const next = mask.slice()
  for (let y = Y0; y <= Y1; y++) {
    for (let x = X0; x <= X1; x++) {
      if (mask[y * IMG_W + x]) continue
      let n = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy
          const nx = x + dx
          if (ny < Y0 || ny > Y1 || nx < X0 || nx > X1) continue
          if (mask[ny * IMG_W + nx]) n++
        }
      }
      if (n >= 2) next[y * IMG_W + x] = 1
    }
  }
  mask.set(next)
}

const out = Buffer.alloc(IMG_W * IMG_H * 4)
let minX = IMG_W
let minY = IMG_H
let maxX = 0
let maxY = 0
let count = 0

for (let y = Y0; y <= Y1; y++) {
  for (let x = X0; x <= X1; x++) {
    if (!mask[y * IMG_W + x]) continue
    const i = (y * IMG_W + x) * c
    out[i] = data[i]
    out[i + 1] = data[i + 1]
    out[i + 2] = data[i + 2]
    out[i + 3] = 255
    count++
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
}

const pad = 6
minX = Math.max(0, minX - pad)
minY = Math.max(0, minY - pad)
maxX = Math.min(IMG_W - 1, maxX + pad)
maxY = Math.min(IMG_H - 1, maxY + pad)

await sharp(out, { raw: { width: IMG_W, height: IMG_H, channels: 4 } })
  .png()
  .toFile(outPath)

await sharp(outPath)
  .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
  .png()
  .toFile(spritePath)

const bg = await sharp('public/characters/기본화면01.png').ensureAlpha().toBuffer()
await sharp(bg)
  .composite([{ input: outPath, left: 0, top: 0 }])
  .png()
  .toFile(previewPath)

console.log(
  JSON.stringify(
    {
      count,
      CLAW_MIN_X: minX,
      CLAW_MAX_X: maxX,
      CLAW_MIN_Y: minY,
      CLAW_MAX_Y: maxY,
      CLAW_SRC_W: maxX - minX + 1,
      CLAW_SRC_H: maxY - minY + 1,
      REST_X: Math.round((minX + maxX) / 2),
      CLAW_TOP_Y: minY,
    },
    null,
    2,
  ),
)
