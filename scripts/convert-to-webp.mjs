import sharp from 'sharp'

/**
 * 런타임(브라우저)에서 실제로 로드되는 PNG들을 WebP로 변환한다.
 * 원본 PNG는 그대로 남겨둔다 (재가공 시 소스로 재사용, 저장소 파일용량은 배포 대역폭과 무관).
 */
const FILES = [
  'bg_default_empty.png',
  'bg_default_blank_sign_trimmed.png',
  'bg_result_spotlight.png',
  'char_result_jackpot.png',
  'char_result_small.png',
  'char_result_miss.png',
  'char_display_mint.png',
  'char_display_lavender.png',
  'char_display_peach.png',
  'char_display_yellow.png',
  'char_display_gold.png',
  'crane_claw_arm.png',
]

const DIR = 'public/characters'

for (const file of FILES) {
  const src = `${DIR}/${file}`
  const out = `${DIR}/${file.replace(/\.png$/, '.webp')}`
  const buf = await sharp(src).webp({ quality: 82 }).toBuffer()
  await sharp(buf).toFile(out)
  console.log(`${file} -> ${out} (${(buf.length / 1024).toFixed(0)}KB)`)
}

console.log('done')
