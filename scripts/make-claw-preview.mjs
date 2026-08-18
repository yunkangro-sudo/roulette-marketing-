import sharp from 'sharp'
import fs from 'fs'

const out = 'docs/design/집게.png'
const bgPath = 'public/characters/bg_claw_machine_empty.png'
const cranePath = 'public/characters/crane_claw_arm.png'
const charPath = 'public/characters/char_display_mint.png'

const CLAW_MIN_X = 580
const CLAW_MAX_X = 872
const CLAW_MIN_Y = 490
const CLAW_MAX_Y = 965
const CLAW_SRC_W = CLAW_MAX_X - CLAW_MIN_X
const CLAW_SRC_H = CLAW_MAX_Y - CLAW_MIN_Y
const GLASS_W = 788 - 160
const REST_X = 480
const CHAR_X = 470
const CHAR_Y = 1100
const CHAR_W = 240
const JOINT_SRC_Y = 627

// 원하는 샘플 역산: 흰 관절 y≈435 (은색 레일에 붙음)
const CLAW_TOP_Y = 370
const CLAW_RATIO = 1 / 4.5

fs.mkdirSync('docs/design', { recursive: true })

const clawW = GLASS_W * CLAW_RATIO
const clawH = clawW * (CLAW_SRC_H / CLAW_SRC_W)
const left = REST_X - clawW / 2

const claw = await sharp(cranePath)
  .extract({ left: CLAW_MIN_X, top: CLAW_MIN_Y, width: CLAW_SRC_W, height: CLAW_SRC_H })
  .resize(Math.round(clawW), Math.round(clawH))
  .toBuffer()

await sharp(bgPath)
  .composite([{ input: claw, left: Math.round(left), top: Math.round(CLAW_TOP_Y) }])
  .png()
  .toFile(out)

const jointY = CLAW_TOP_Y + (JOINT_SRC_Y - CLAW_MIN_Y) * (clawH / CLAW_SRC_H)
console.log(
  JSON.stringify(
    {
      out,
      CLAW_TOP_Y,
      CLAW_RATIO,
      clawW: Math.round(clawW * 10) / 10,
      clawH: Math.round(clawH * 10) / 10,
      left: Math.round(left * 10) / 10,
      jointY: Math.round(jointY * 10) / 10,
      bottom: Math.round((CLAW_TOP_Y + clawH) * 10) / 10,
    },
    null,
    2,
  ),
)
