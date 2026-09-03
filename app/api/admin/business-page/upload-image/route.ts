import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'
import { canAccessHomepageFeature } from '@/lib/admin/storeAddons'

/**
 * 매장 홈페이지(/b/{slug}) 사진 업로드 API — reward-catalog/upload-image와 동일 패턴
 * (리사이즈 + WebP 변환 + Storage 업로드). 삭제 API는 두지 않음 — business_media는
 * POST /api/admin/business-page 저장 시 전체 교체(delete+insert)되므로, Storage의
 * 이전 파일은 정기적으로 안 쓰는 파일 정리가 필요하면 별도 스크립트로 처리한다.
 */

const BUCKET = 'business-images'
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_DIMENSION = 1600

function resolveStoreId(account: { role: string; storeId: string | null }, provided: string | null): string | null {
  if (account.role === 'advertiser') return account.storeId
  return provided
}

export async function POST(req: Request) {
  const account = await requireAdminAuth()
  if (account.role === 'staff') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: '요청 형식이 올바르지 않습니다' }, { status: 400 })

  const file = formData.get('file')
  const storeId = resolveStoreId(account, formData.get('store_id')?.toString() ?? null)

  if (!storeId) return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })
  if (!(await canAccessHomepageFeature(account, storeId))) {
    return NextResponse.json({ error: '이 기능은 아직 활성화되지 않았어요. 담당자에게 문의해주세요.' }, { status: 403 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 })
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'jpg, png, webp 형식의 이미지만 업로드할 수 있어요' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '이미지는 5MB 이하만 업로드할 수 있어요' }, { status: 400 })
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer())

  let outputBuffer: Buffer
  try {
    outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    return NextResponse.json({ error: '이미지 파일을 처리할 수 없어요. 다른 파일로 시도해주세요' }, { status: 400 })
  }

  const path = `${storeId}/${randomUUID()}.webp`
  const supabase = createServerClient()
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, outputBuffer, { contentType: 'image/webp', upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: '업로드 실패: ' + uploadError.message }, { status: 500 })
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ ok: true, url: publicUrlData.publicUrl })
}
