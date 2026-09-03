import { createServerClient } from '@/lib/supabase/server'
import PlayFlow from './PlayFlow'
import ResultPreview from '@/components/game/ResultPreview'
import ResultLockedScreen from '@/components/play/ResultLockedScreen'
import FlowPreview from '@/components/play/FlowPreview'
import DeviceFrame from '@/components/play/DeviceFrame'
import { safeHttpUrl } from '@/lib/store/profileUrls'
import { getSubscriptionStatus } from '@/lib/admin/subscription'

interface Props {
  params: Promise<{ storeId: string }>
  searchParams: Promise<{ claim?: string; preview_result?: string; auth_error?: string; source?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { storeId } = await params
  return { title: `당근 인형뽑기 — ${storeId}` }
}

export default async function PlayPage({ params, searchParams }: Props) {
  const { storeId } = await params
  const { claim, preview_result, auth_error, source } = await searchParams
  if (preview_result === 'big' || preview_result === 'small' || preview_result === 'miss') {
    return <DeviceFrame><ResultPreview tier={preview_result} /></DeviceFrame>
  }
  if (preview_result === 'locked') {
    return <DeviceFrame><ResultLockedScreen storeId={storeId} /></DeviceFrame>
  }
  if (
    preview_result === 'already_participated' ||
    preview_result === 'channel_cta' ||
    preview_result === 'verification'
  ) {
    return <DeviceFrame><FlowPreview screen={preview_result} storeId={storeId} /></DeviceFrame>
  }
  const supabase = createServerClient()

  // 이용기간 유예(7일) 초과 시 손님 화면도 "이벤트 없음"으로 자연스럽게 전환한다 —
  // events row 자체는 건드리지 않고, 조회 자체를 건너뛰어 PlayFlow의 기존 !event
  // 분기("현재 진행중인 이벤트가 없어요")를 그대로 재사용한다. 정상/유예 기간에는
  // 손님 경험에 아무 영향 없음. 승인대기(subscriptions row 없음)는 애초에 관리자에서
  // 이벤트를 만들 수 없으므로 별도 분기 없이도 자연히 이벤트가 없다.
  const subscription = await getSubscriptionStatus(storeId)
  const isAccessBlocked = subscription.status === 'expired'

  const { data: event, error } = isAccessBlocked
    ? { data: null, error: null }
    : await supabase
        .from('events')
        .select('id, name, status, challenge_frequency')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .maybeSingle()

  // 업체명은 store_contracts(관리자 "업체 정보" 화면에서 실제로 입력·관리되는 테이블)가 정답 소스다.
  // store_settings.store_name은 광고비/객단가 설정용 레거시 컬럼이라 실제 매장 대부분 비어있어서
  // 손님 화면에 store_id 원본값("chj-001" 등)이 그대로 노출되는 버그의 원인이었다.
  const { data: contract } = await supabase
    .from('store_contracts')
    .select('store_name, daangn_url, kakao_channel_url')
    .eq('store_id', storeId)
    .maybeSingle()

  console.log('[play] storeId:', storeId)
  console.log('[play] event:', event)
  console.log('[play] error:', error)

  return (
    <DeviceFrame>
      <PlayFlow
        storeId={storeId}
        event={event}
        storeName={contract?.store_name ?? null}
        daangnUrl={safeHttpUrl(contract?.daangn_url)}
        kakaoChannelUrl={safeHttpUrl(contract?.kakao_channel_url)}
        resumeClaim={claim === '1'}
        authError={auth_error === '1'}
        entrySource={source === 'online' ? 'online_page' : 'qr_instore'}
      />
    </DeviceFrame>
  )
}
