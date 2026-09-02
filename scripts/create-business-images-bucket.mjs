/**
 * Supabase Storage에 매장 홈페이지(/b/{slug}) 사진 업로드용 "business-images" 버킷을 생성한다.
 * 이미 있으면 조용히 건너뛴다(멱등). reward-images 버킷과 동일한 설계
 * (docs/migrations/040 참고) — public read, 5MB 제한, jpg/png/webp만 허용.
 *
 * 사용법: node scripts/create-business-images-bucket.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const envPath = resolve(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m || process.env[m[1]]) continue
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없습니다.')
  process.exit(1)
}

const BUCKET = 'business-images'

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: existing, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.error('❌ 버킷 목록 조회 실패:', listError.message)
    process.exit(1)
  }

  if (existing?.some((b) => b.name === BUCKET)) {
    console.log(`✅ '${BUCKET}' 버킷이 이미 존재합니다. 건너뜁니다.`)
    return
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  })

  if (createError) {
    console.error('❌ 버킷 생성 실패:', createError.message)
    process.exit(1)
  }

  console.log(`✅ '${BUCKET}' 버킷 생성 완료 (public read, 5MB 제한, jpg/png/webp만 허용)`)
}

main().catch((e) => {
  console.error('❌ 실패:', e.message)
  process.exit(1)
})
