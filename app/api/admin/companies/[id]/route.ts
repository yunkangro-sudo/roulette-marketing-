import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/session'

type Params = { params: Promise<{ id: string }> }

/** GET /api/admin/companies/[id] */
export async function GET(_req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const supabase = createServerClient()
  const { data, error } = await supabase.from('store_contracts').select('*').eq('id', id).single()

  if (error || !data) return NextResponse.json({ error: '업체를 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json({ company: data })
}

/** PATCH /api/admin/companies/[id] */
export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (!['agency', 'super_admin'].includes(session.account.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '요청 데이터가 없습니다' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('store_contracts')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: '수정 실패: ' + error.message }, { status: 500 })
  return NextResponse.json({ ok: true, company: data })
}

/**
 * DELETE /api/admin/companies/[id] — 업체 완전 삭제 (Hard Delete, 되돌릴 수 없음)
 *
 * super_admin 전용 (agency는 불가) — 계약/영업 관련 조작(agency)과 데이터 파괴는
 * 권한 수준이 달라야 한다. 안전장치로 요청 본문에 업체명을 정확히 재입력하도록
 * 강제한다(프론트 모달 확인 + 서버 재검증 이중 방어).
 */
export async function DELETE(req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  if (session.account.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 업체를 완전 삭제할 수 있습니다' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const supabase = createServerClient()
  const { data: company, error: findError } = await supabase
    .from('store_contracts')
    .select('store_id, store_name')
    .eq('id', id)
    .single()

  if (findError || !company) return NextResponse.json({ error: '업체를 찾을 수 없습니다' }, { status: 404 })

  if (body?.confirm_store_name !== company.store_name) {
    return NextResponse.json({ error: '업체명이 일치하지 않습니다. 정확히 입력해주세요' }, { status: 400 })
  }

  const { data: result, error: rpcError } = await supabase.rpc('delete_store_completely', {
    p_store_id: company.store_id,
  })

  if (rpcError) return NextResponse.json({ error: '삭제 실패: ' + rpcError.message }, { status: 500 })
  if (!result?.ok) return NextResponse.json({ error: result?.error ?? '삭제 실패' }, { status: 400 })

  // 리워드 이미지(Storage) 정리 — best-effort, 실패해도 DB 삭제 자체는 이미 완료된 상태이므로 막지 않음
  try {
    const { data: files } = await supabase.storage.from('reward-images').list(company.store_id)
    if (files && files.length > 0) {
      await supabase.storage.from('reward-images').remove(files.map((f) => `${company.store_id}/${f.name}`))
    }
  } catch {
    // 이미지 정리 실패는 무시 — DB 데이터는 이미 완전히 삭제됨
  }

  return NextResponse.json({ ok: true })
}
