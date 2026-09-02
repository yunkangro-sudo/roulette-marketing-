import { createServerClient } from '@/lib/supabase/server'

/**
 * 영업 시연용 샘플(데모) 매장인지 확인.
 *
 * 알림톡(lib/alimtalk/send.ts)과 카카오 "나에게 보내기"(lib/kakao/meMessage.ts)는
 * 각각 동의 레코드/access_token이 없으면 이미 발송이 막히는 구조라 가짜 손님에게
 * 실제 메시지가 나갈 위험은 원래도 없다. 다만 실수로라도 실제 발송 경로를 타는 걸
 * 막기 위한 이중 방어용 체크.
 */
export async function isDemoStore(storeId: string): Promise<boolean> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('store_contracts')
    .select('is_demo')
    .eq('store_id', storeId)
    .maybeSingle()
  return data?.is_demo === true
}
