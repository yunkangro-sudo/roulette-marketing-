/**
 * activity_log 공용 기록 유틸리티
 *
 * ── Silent Fail 원칙 ──────────────────────────────────────────
 * 이 함수가 실패해도 절대 예외를 던지지 않는다.
 * 호출부에서 await 없이 fire-and-forget으로 사용해도 된다.
 * 단, 실패 시 console.error로 로그는 남긴다.
 *
 * ── Phase 2 예정 사용처 ──────────────────────────────────────
 * - 코호트 리텐션 분석 (첫 방문 후 N일 내 재방문율)
 * - 재방문 주기 분포 분석
 * - Win-back 대상 세그먼트 추출 (마지막 game_complete 기준)
 * - 이벤트별 전환율 퍼널 (game_start → game_complete → coupon_used)
 */

import { createServerClient } from '@/lib/supabase/server'

export type ActivityEventType =
  | 'game_start'
  | 'game_complete'
  | 'coupon_used'
  | 'reward_redeemed'
  | 'point_earned'
  | 'purchase'       // 온라인 확장 대비 — 로직 미구현
  | 'visit_checkin'  // 온라인 확장 대비 — 로직 미구현
  | 'kakao_login'    // 카카오 로그인 성공 (신규가입/재방문 로그인 모두 포함)
  | 'daangn_click'   // "당근에서 단골 추가하기" 버튼 클릭 (클릭 기준, 실제 단골등록 확정 아님)

export type ActivityRefType = 'game' | 'coupon' | 'reward' | 'point_ledger'

export interface ActivityLogParams {
  storeId:     string
  kakaoUserId: string
  eventType:   ActivityEventType
  refId?:      string
  refType?:    ActivityRefType
  occurredAt?: Date
}

/**
 * activity_log에 단건 기록
 * silent fail — 실패해도 예외 없이 로그만 출력
 */
export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from('activity_log').insert({
      store_id:      params.storeId,
      kakao_user_id: params.kakaoUserId,
      event_type:    params.eventType,
      ref_id:        params.refId    ?? null,
      ref_type:      params.refType  ?? null,
      occurred_at:   (params.occurredAt ?? new Date()).toISOString(),
    })

    if (error) {
      console.error(`[activity_log] INSERT 실패 (${params.eventType}):`, error.message)
    }
  } catch (err) {
    // DB 연결 오류 등 예외 상황도 조용히 처리
    console.error(`[activity_log] 예외 발생 (${params.eventType}):`, err)
  }
}
