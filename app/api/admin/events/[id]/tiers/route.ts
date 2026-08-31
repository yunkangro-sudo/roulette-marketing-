import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminSession, getAllowedStoreId } from '@/lib/admin/session'
import { normalizeProbabilities, UNLIMITED_TIER_QUANTITY } from '@/lib/game-engine/probability'

type Params = { params: Promise<{ id: string }> }
type PrizeTierMode = 'quantity' | 'percent'

interface TierInput {
  /** 없으면 신규 등록 */
  id?: string
  label: string
  amount: number
  /** percent 모드에서는 선택값 — 비우면 재고 무제한(UNLIMITED_TIER_QUANTITY) */
  total_quantity?: number
  /** percent 모드에서만 사용 — 관리자가 직접 입력한 확률(%) */
  probability_percent?: number
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
 * 경품 티어 일괄 수정 — 등급명 · 금액 · 총수량 수정 + 티어 추가/삭제
 *
 * body: {
 *   tiers: [{ id?, label, amount, total_quantity, requires_verification? }, ...]  ← 저장 후 남아있어야 할 전체 티어 목록 (id 없으면 신규)
 *   deleted_tier_ids?: string[]  ← 삭제할 기존 티어 id 목록
 * }
 *
 * - 기존 티어의 총수량은 이미 지급된 수량(total_quantity - remaining_quantity)보다 적게 설정할 수 없음
 * - 삭제는 쿠폰(coupons)이 티어를 외래키로 참조하지 않아 이미 지급된 쿠폰에는 영향 없음
 * - 이벤트에는 최소 1개의 티어가 남아있어야 함
 * - 확률은 이벤트의 "하루 예상 참여자 수" × "노출 기간"을 기준으로 저장 후 남는 전체 티어를 다시 정규화해서 계산
 */
export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession()
  if (!session.account) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { id: eventId } = await params
  const body = await req.json().catch(() => null)
  const tiersInput: TierInput[] = Array.isArray(body?.tiers) ? body.tiers : []
  const deletedTierIds: string[] = Array.isArray(body?.deleted_tier_ids) ? body.deleted_tier_ids : []

  if (tiersInput.length === 0) {
    return NextResponse.json({ error: '경품 티어는 최소 1개 이상 있어야 합니다' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, store_id, expected_daily_participants, display_start_date, display_end_date, prize_tier_mode')
    .eq('id', eventId)
    .single()

  if (!event) {
    return NextResponse.json({ error: '이벤트를 찾을 수 없습니다' }, { status: 404 })
  }

  // body.prize_tier_mode가 오면 이 저장 시점에 모드를 바꾸는 것으로 간주
  const prizeTierMode: PrizeTierMode = body?.prize_tier_mode === 'percent' || body?.prize_tier_mode === 'quantity'
    ? body.prize_tier_mode
    : ((event.prize_tier_mode as PrizeTierMode) ?? 'quantity')

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

  // ── 삭제 대상 검증 ───────────────────────────────────────────
  for (const delId of deletedTierIds) {
    if (!existingMap.has(delId)) {
      return NextResponse.json({ error: '알 수 없는 삭제 대상 티어가 포함되어 있습니다' }, { status: 400 })
    }
    if (tiersInput.some((t) => t.id === delId)) {
      return NextResponse.json({ error: '같은 티어를 수정과 삭제로 동시에 요청할 수 없습니다' }, { status: 400 })
    }
  }

  // ── 입력값 검증 (수정 대상 + 신규 등록 공통) ────────────────
  for (const t of tiersInput) {
    if (t.id && !existingMap.has(t.id)) {
      return NextResponse.json({ error: '알 수 없는 티어가 포함되어 있습니다' }, { status: 400 })
    }
    if (!t.label?.trim()) {
      return NextResponse.json({ error: '모든 티어의 등급명을 입력해주세요' }, { status: 400 })
    }
    if (t.amount === undefined || t.amount === null || Number(t.amount) < 0) {
      return NextResponse.json({ error: '금액을 올바르게 입력해주세요 (꽝은 0)' }, { status: 400 })
    }
    if (prizeTierMode === 'percent') {
      const p = Number(t.probability_percent)
      if (Number.isNaN(p) || p < 0 || p > 100) {
        return NextResponse.json({ error: '모든 티어의 확률(%)을 0~100 사이로 입력해주세요' }, { status: 400 })
      }
      // 수량은 선택 — 입력했으면 1 이상의 정수여야 함 (재고 안전장치용)
      if (t.total_quantity !== undefined && t.total_quantity !== null && Number(t.total_quantity) !== 0) {
        if (!Number.isInteger(Number(t.total_quantity)) || Number(t.total_quantity) <= 0) {
          return NextResponse.json({ error: '수량을 입력하는 경우 1 이상의 정수여야 합니다' }, { status: 400 })
        }
      }
    } else {
      if (!Number.isInteger(Number(t.total_quantity)) || Number(t.total_quantity) <= 0) {
        return NextResponse.json({ error: '수량은 1 이상의 정수여야 합니다' }, { status: 400 })
      }
    }
  }

  /** percent 모드에서 수량 미입력 시 "무제한"으로 취급할 실제 저장값 */
  function resolveQuantity(t: TierInput): number {
    if (prizeTierMode === 'percent') {
      return t.total_quantity && Number(t.total_quantity) > 0 ? Number(t.total_quantity) : UNLIMITED_TIER_QUANTITY
    }
    return Number(t.total_quantity)
  }

  // 기존 티어는 이미 지급된 수량보다 적게 설정하지 못하도록 방지
  for (const t of tiersInput) {
    if (!t.id) continue
    const existing = existingMap.get(t.id)!
    const issued = existing.total_quantity - existing.remaining_quantity
    if (resolveQuantity(t) < issued) {
      return NextResponse.json(
        { error: `"${t.label}" 티어는 이미 ${issued}개가 지급되어 그보다 적은 수량으로 설정할 수 없습니다` },
        { status: 400 }
      )
    }
  }

  // ── 확률 재계산 (삭제 후 남는 전체 티어 기준) ─────────────────
  let probabilities: number[]
  if (prizeTierMode === 'percent') {
    probabilities = normalizeProbabilities(tiersInput.map((t) => Number(t.probability_percent) || 0))
  } else {
    let totalParticipants = 0
    if (event.expected_daily_participants && event.display_start_date && event.display_end_date) {
      const start = new Date(event.display_start_date)
      const end = new Date(event.display_end_date)
      const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
      totalParticipants = event.expected_daily_participants * days
    }
    probabilities = calcProbabilities(tiersInput.map((t) => Number(t.total_quantity)), totalParticipants)
  }

  // 이 요청으로 모드가 바뀌었으면 events.prize_tier_mode도 갱신
  if (prizeTierMode !== event.prize_tier_mode) {
    const { error: modeError } = await supabase
      .from('events')
      .update({ prize_tier_mode: prizeTierMode })
      .eq('id', eventId)
    if (modeError) console.warn('prize_tier_mode 갱신 실패:', modeError.message)
  }

  // ── 수정 / 신규 등록 처리 ─────────────────────────────────────
  const updated: Array<{
    id: string; total_quantity: number; remaining_quantity: number; computed_probability: number; is_new: boolean
  }> = []

  for (let i = 0; i < tiersInput.length; i++) {
    const t = tiersInput[i]

    if (t.id) {
      // 기존 티어 수정
      const existing = existingMap.get(t.id)!
      const issued = existing.total_quantity - existing.remaining_quantity
      const newTotal = resolveQuantity(t)
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
        if (logError) console.warn('tier_quantity_changes 기록 실패:', logError.message)
      }

      updated.push({ id: t.id, total_quantity: newTotal, remaining_quantity: newRemaining, computed_probability: probabilities[i], is_new: false })
    } else {
      // 신규 티어 등록
      const newTotal = resolveQuantity(t)
      const { data: inserted, error: insertError } = await supabase
        .from('prize_tiers')
        .insert({
          event_id: eventId,
          label: t.label.trim(),
          amount: Number(t.amount),
          total_quantity: newTotal,
          remaining_quantity: newTotal,
          computed_probability: probabilities[i],
          requires_verification: t.requires_verification ?? false,
        })
        .select('id')
        .single()

      if (insertError || !inserted) {
        return NextResponse.json({ error: `"${t.label}" 신규 등록 실패: ${insertError?.message ?? '알 수 없는 오류'}` }, { status: 500 })
      }

      const { error: logError } = await supabase.from('tier_quantity_changes').insert({
        prize_tier_id: inserted.id,
        event_id: eventId,
        store_id: event.store_id,
        changed_by: session.account.id,
        previous_quantity: 0,
        new_quantity: newTotal,
      })
      if (logError) console.warn('tier_quantity_changes 기록 실패:', logError.message)

      updated.push({ id: inserted.id, total_quantity: newTotal, remaining_quantity: newTotal, computed_probability: probabilities[i], is_new: true })
    }
  }

  // ── 삭제 처리 (쿠폰은 티어를 참조하지 않으므로 안전) ───────────
  if (deletedTierIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('prize_tiers')
      .delete()
      .eq('event_id', eventId)
      .in('id', deletedTierIds)

    if (deleteError) {
      return NextResponse.json({ error: '티어 삭제 실패: ' + deleteError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, tiers: updated, deleted_tier_ids: deletedTierIds, prize_tier_mode: prizeTierMode })
}
