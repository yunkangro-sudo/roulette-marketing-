import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin/session'

/**
 * 리워드 이미지 업로드/정리 API.
 *
 * POST   — 파일을 받아 검증 → 리사이즈(최대 1200px) → WebP 변환 → Storage 업로드 → 공개 URL 반환.
 *          원본을 그대로 저장하지 않는 이유는 게임 이미지 최적화 작업(scripts/convert-to-webp.mjs)과
 *          동일 — 광고주가 스마트폰으로 찍은 원본은 용량이 커서 그대로 두면 로딩 문제가 재발한다.
 * DELETE — 리워드 수정/삭제로 더 이상 쓰이지 않게 된 이전 이미지 파일을 Storage에서 정리한다.
 *          (호출부: RewardCatalogClient.tsx가 PATCH 저장 성공 "이후"에만 호출 — 저장 전에 지우면
 *          사용자가 수정을 취소했을 때 이미 저장된 이미지가 사라지는 사고가 나기 때문.)
 *
 * 권한: 다른 reward-catalog API와 동일하게 staff만 차단, advertiser는 본인 storeId로 고정.
 * Storage 자체엔 쓰기 정책을 두지 않았다(docs/migrations/040 참고) — 이 API가 유일한 쓰기 경로다.
 */

const BUCKET = 'reward-images'
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_DIMENSION = 1200

function resolveStoreId(account: { role: string; storeId: string | null }, provided: string | null): string | null {
  if (account.role === 'advertiser') return account.storeId
  return provided
}

function publicUrlPrefix(): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`
}

/** 우리 reward-images 버킷 소속 URL이면 내부 경로를 반환. 외부 URL(레거시 수동입력 등)이면 null */
function extractStoragePath(url: string): string | null {
  const prefix = publicUrlPrefix()
  if (!url.startsWith(prefix)) return null
  return url.slice(prefix.length)
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
      .rotate() // 스마트폰 사진의 EXIF 방향 정보를 실제 픽셀에 반영 (회전되어 저장되는 문제 방지)
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

/** DELETE — body: { url, store_id } — 우리 버킷 소속이 아니거나 이미 없는 파일이면 조용히 성공 처리(soft) */
export async function DELETE(req: Request) {
  const account = await requireAdminAuth()
  if (account.role === 'staff') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const url = body?.url as string | undefined
  if (!url) return NextResponse.json({ ok: true })

  const path = extractStoragePath(url)
  if (!path) return NextResponse.json({ ok: true }) // 외부 URL(레거시 수동입력) — 건드리지 않음

  const storeId = resolveStoreId(account, body?.store_id ?? null)
  if (storeId && !path.startsWith(`${storeId}/`)) {
    // advertiser가 자기 매장 경로가 아닌 파일을 지우려는 경우 — 조용히 무시
    return NextResponse.json({ ok: true })
  }

  const supabase = createServerClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    // 삭제 실패해도 호출부(리워드 저장) 흐름을 막지 않는다 — 안 쓰는 파일이 남는 것은
    // 나중에 정리 가능한 문제고, 저장 자체가 실패한 것처럼 보이면 더 큰 혼란을 준다.
    console.error('[reward-catalog/upload-image] 이전 이미지 삭제 실패:', error.message)
  }
  return NextResponse.json({ ok: true })
}
