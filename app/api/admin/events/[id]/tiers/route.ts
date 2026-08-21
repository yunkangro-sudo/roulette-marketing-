import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession, getAllowedStoreId } from '@/lib/admin/session'

type Params = { params: Promise<{ id: string }> }

interface TierInput {
  id: string
  label: string
  amount: number
  total_quantity: number
  requires_verification?: boolean
}

/** 새 이벤트 등록과 동일한 공식: 티어별 수량 비율을 정규화해 합계 100%로 맞춘다 */
function calcProbabilities(quantities: number[], totalParticipants: number): number[] {
  if (totalParticipants <= 0) return quantities.map(() => 0)
  const raw = quantities.map((q) => (q / totalParticipants) * 100)
  const sum = raw.reduce((a, b) => a + b, 0)
  if (sum <= 0) return quantities.map(() => 0)
  return raw.map((p) => Math.round((p / sum) * 100 * 10) / 10)
}

/**
 * PATCH /api/admin/events/[id]/tiers
 * 경품 티어 일괄 수정 (등급명 · 금액 · 총수량 자유 수정)
 *
 * body: { tiers: [{ id, label, amount, total_quantity, requires_verification? }] }
 *
 * - 총수량은 이미 지급된 수량(total_quantity - remaining_quantity)보다 적게 설정할 수 없음
 * - 확률은 이벤트의 "하루 예상 참여자 수" × "노출 기간"을 기준으로 전체 티어를 다시 정규화해서 저장
 */
export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { id: eventId } = await params
  const body = await req.json().catch(() => null)
  const tiersInput: TierInput[] = Array.isArray(body?.tiers) ? body.tiers : []

  if (tiersInput.length === 0) {
    return NextResponse.json({ error: '수정할 티어 정보가 없습니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, store_id, expected_daily_participants, display_start_date, display_end_date')
    .eq('id', eventId)
    .single()

  if (!event) {
    return NextResponse.json({ error: '이벤트를 찾을 수 없습니다' }, { status: 404 })
  }

  const allowedStoreId = getAllowedStoreId(session.account)
  if (allowedStoreId && event.store_id !== allowedStoreId) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { data: existingTiers } = await supabase
    .from('prize_tiers')
    .select('id, total_quantity, remaining_quantity')
    .eq('event_id', eventId)

  if (!existingTiers || existingTiers.length === 0) {
    return NextResponse.json({ error: '경품 티어를 찾을 수 없습니다' }, { status: 404 })
  }

  const existingMap = new Map(existingTiers.map((t) => [t.id, t]))

  // ── 입력값 검증 ──────────────────────────────────────────────
  for (const t of tiersInput) {
    if (!existingMap.has(t.id)) {
      return NextResponse.json({ error: '알 수 없는 티어가 포함되어 있습니다' }, { status: 400 })
    }
    if (!t.label?.trim()) {
      return NextResponse.json({ error: '모든 티어의 등급명을 입력해주세요' }, { status: 400 })
    }
    if (t.amount === undefined || t.amount === null || Number(t.amount) < 0) {
      return NextResponse.json({ error: '금액을 올바르게 입력해주세요 (꽝은 0)' }, { status: 400 })
    }
    if (!Number.isInteger(Number(t.total_quantity)) || Number(t.total_quantity) <= 0) {
      return NextResponse.json({ error: '수량은 1 이상의 정수여야 합니다' }, { status: 400 })
    }
  }

  // 이미 지급된 수량보다 적게 설정하지 못하도록 방지
  for (const t of tiersInput) {
    const existing = existingMap.get(t.id)!
    const issued = existing.total_quantity - existing.remaining_quantity
    if (Number(t.total_quantity) < issued) {
      return NextResponse.json(
        { error: `"${t.label}" 티어는 이미 ${issued}개가 지급되어 그보다 적은 수량으로 설정할 수 없습니다` },
        { status: 400 }
      )
    }
  }

  // ── 확률 재계산 (전체 티어 기준) ──────────────────────────────
  let totalParticipants = 0
  if (event.expected_daily_participants && event.display_start_date && event.display_end_date) {
    const start = new Date(event.display_start_date)
    const end = new Date(event.display_end_date)
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
    totalParticipants = event.expected_daily_participants * days
  }
  const probabilities = calcProbabilities(tiersInput.map((t) => Number(t.total_quantity)), totalParticipants)

  // ── 업데이트 + 이력 기록 ──────────────────────────────────────
  const updated: Array<{
    id: string; total_quantity: number; remaining_quantity: number; computed_probability: number
  }> = []

  for (let i = 0; i < tiersInput.length; i++) {
    const t = tiersInput[i]
    const existing = existingMap.get(t.id)!
    const issued = existing.total_quantity - existing.remaining_quantity
    const newTotal = Number(t.total_quantity)
    const newRemaining = newTotal - issued

    const { error: updateError } = await supabase
      .from('prize_tiers')
      .update({
        label: t.label.trim(),
        amount: Number(t.amount),
        total_quantity: newTotal,
        remaining_quantity: newRemaining,
        computed_probability: probabilities[i],
        ...(t.requires_verification !== undefined ? { requires_verification: t.requires_verification } : {}),
      })
      .eq('id', t.id)

    if (updateError) {
      return NextResponse.json({ error: `"${t.label}" 저장 실패: ${updateError.message}` }, { status: 500 })
    }

    if (newTotal !== existing.total_quantity) {
      const { error: logError } = await supabase.from('tier_quantity_changes').insert({
        prize_tier_id: t.id,
        event_id: eventId,
        store_id: event.store_id,
        changed_by: session.account.id,
        previous_quantity: existing.total_quantity,
        new_quantity: newTotal,
      })
      if (logError) {
        // 이력 기록 실패는 치명적이지 않으므로 경고만 (롤백 안 함)
        console.warn('tier_quantity_changes 기록 실패:', logError.message)
      }
    }

    updated.push({
      id: t.id,
      total_quantity: newTotal,
      remaining_quantity: newRemaining,
      computed_probability: probabilities[i],
    })
  }

  return NextResponse.json({ ok: true, tiers: updated })
}
