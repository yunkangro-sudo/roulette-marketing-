import { createClient } from '@/lib/supabase/client'

/** KST 기준 오늘 날짜 문자열 반환 (YYYY-MM-DD) */
function getKSTDateString(): string {
  const now = new Date()
  // UTC+9 offset
  const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kstDate.toISOString().slice(0, 10)
}

/** 오늘 이미 참여했는지 확인 */
export async function checkAlreadyParticipated(
  storeId: string,
  kakaoUserId: string
): Promise<boolean> {
  const supabase = createClient()
  const today = getKSTDateString()

  const { data, error } = await supabase
    .from('daily_participation_log')
    .select('id')
    .eq('store_id', storeId)
    .eq('kakao_user_id', kakaoUserId)
    .eq('date', today)
    .maybeSingle()

  if (error) throw new Error(`참여 확인 실패: ${error.message}`)
  return data !== null
}

/** 오늘 참여 기록 저장 (중복 시 무시) */
export async function recordParticipation(
  storeId: string,
  kakaoUserId: string
): Promise<void> {
  const supabase = createClient()
  const today = getKSTDateString()

  const { error } = await supabase.from('daily_participation_log').insert([
    { store_id: storeId, kakao_user_id: kakaoUserId, date: today },
  ] as never[])

  // 23505 = unique constraint violation (이미 기록 있음) → 무시
  if (error && error.code !== '23505') {
    throw new Error(`참여 기록 저장 실패: ${error.message}`)
  }
}
