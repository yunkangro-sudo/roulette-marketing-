/**
 * GET /api/cron/expiry-reminder
 *
 * Vercel Cron: 매일 KST 10:00 (UTC 01:00) 실행
 * → vercel.json: { "path": "/api/cron/expiry-reminder", "schedule": "0 1 * * *" }
 *
 * 동작:
 *  1. status='issued' | 'pending_verify' 쿠폰 중 만료일까지 정확히 7/3/1일 남은 것 조회
 *  2. message_log에서 같은 쿠폰+단계로 이미 발송한 기록 확인 (중복방지)
 *  3. 8-1 발송규칙(동의/빈도) 통과 시 expiry_reminder 발송 + message_log 기록
 *
 * 보안:
 *  - Authorization: Bearer {CRON_SECRET} 헤더 검증
 *  - Vercel 내부 호출 시에도 동일한 헤더 사용 (vercel.json cron 자동 전송)
 *
 * 주의:
 *  - "나에게 보내기"(talk_message)는 배치에서 사용 불가 (사용자 access_token 필요)
 *  - 실제 발송은 Alimtalk 대행사 연동 후 sendAlimtalk 내부를 채우면 됨
 *  - 현재는 message_log 기록만 남기는 stub 상태
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { checkSendPermission, type AlimtalkPayload } from '@/lib/alimtalk/send'

const DAYS_STAGES = [7, 3, 1] as const

type DayStage = typeof DAYS_STAGES[number]

/** KST 기준 오늘 + N일의 날짜 문자열 (YYYY-MM-DD) */
function kstDatePlusDays(n: number): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)  // UTC → KST
  now.setDate(now.getDate() + n)
  return now.toISOString().slice(0, 10)  // "YYYY-MM-DD"
}

export async function GET(req: NextRequest) {
  // ── 보안 토큰 검증 ──────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const supabase = createServerClient()
  const results: {
    stage: number
    total: number
    sent: number
    skipped_dup: number
    skipped_rule: number
  }[] = []

  for (const days of DAYS_STAGES) {
    const targetDate  = kstDatePlusDays(days)       // 예: "2026-08-20" (D-7 대상)
    const nextDate    = kstDatePlusDays(days + 1)   // 다음날 → 상한 기준

    // ── 1. 만료일이 정확히 N일 후인 유효한 쿠폰 조회 ─────
    // KST 기준 targetDate 당일(00:00 ~ 익일 00:00) 범위로 비교
    const { data: coupons, error: couponErr } = await supabase
      .from('coupons')
      .select('id, store_id, kakao_user_id, amount, valid_until, short_code')
      .in('status', ['issued', 'pending_verify'])
      .gte('valid_until', `${targetDate}T00:00:00+09:00`)
      .lt( 'valid_until', `${nextDate}T00:00:00+09:00`)

    if (couponErr) {
      console.error(`[expiry-reminder] D-${days} 쿠폰 조회 오류:`, couponErr.message)
      results.push({ stage: days, total: 0, sent: 0, skipped_dup: 0, skipped_rule: 0 })
      continue
    }

    const stageResult = { stage: days, total: coupons?.length ?? 0, sent: 0, skipped_dup: 0, skipped_rule: 0 }

    for (const coupon of coupons ?? []) {
      // ── 2. 중복 발송 체크 ─────────────────────────────────
      const { data: existingLog } = await supabase
        .from('message_log')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('days_remaining', days)
        .eq('message_type', 'expiry_reminder')
        .maybeSingle()

      if (existingLog) {
        stageResult.skipped_dup++
        continue
      }

      // ── 3. 8-1 발송규칙 체크 ─────────────────────────────
      const payload: AlimtalkPayload = {
        storeId:     coupon.store_id,
        kakaoUserId: coupon.kakao_user_id,
        messageType: 'expiry_reminder',
        data: {},
      }
      const { allowed: permitted } = await checkSendPermission(payload)

      if (!permitted) {
        stageResult.skipped_rule++
        continue
      }

      // ── 4. 발송 + message_log 기록 ────────────────────────
      // 실제 발송: Alimtalk 대행사 연동 후 sendAlimtalk 내부 채우면 됨
      // 현재: log만 남기는 stub 상태
      const validStr = coupon.valid_until
        ? new Date(coupon.valid_until).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric',
          })
        : ''

      // stub 로그 (실제 발송 없음)
      console.log(
        `[expiry-reminder] D-${days} 발송 시도 → kakao_user_id=${coupon.kakao_user_id}`,
        `| 코드=${coupon.short_code ?? coupon.id.slice(0,8)} | 만료=${validStr}`,
      )

      // message_log INSERT (중복방지 기록)
      const { error: logErr } = await supabase.from('message_log').insert({
        store_id:      coupon.store_id,
        kakao_user_id: coupon.kakao_user_id,
        message_type:  'expiry_reminder',
        sent_at:       new Date().toISOString(),
        coupon_id:     coupon.id,
        days_remaining: days,
      })

      if (logErr) {
        console.error(`[expiry-reminder] message_log 기록 실패:`, logErr.message)
      } else {
        stageResult.sent++
      }
    }

    results.push(stageResult)
  }

  const summary = {
    executed_at: new Date().toISOString(),
    kst_date: kstDatePlusDays(0),
    stages: results,
    total_sent: results.reduce((s, r) => s + r.sent, 0),
    total_skipped_dup: results.reduce((s, r) => s + r.skipped_dup, 0),
    total_skipped_rule: results.reduce((s, r) => s + r.skipped_rule, 0),
  }

  console.log('[expiry-reminder] 완료:', JSON.stringify(summary))
  return NextResponse.json(summary)
}
