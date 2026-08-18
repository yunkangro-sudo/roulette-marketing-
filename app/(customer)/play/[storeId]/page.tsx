import { createServerClient } from '@/lib/supabase/server'
import PlayFlow from './PlayFlow'
import ResultPreview from '@/components/game/ResultPreview'
import ResultLockedScreen from '@/components/play/ResultLockedScreen'
import FlowPreview from '@/components/play/FlowPreview'
import { safeHttpUrl } from '@/lib/store/profileUrls'

interface Props {
  params: Promise<{ storeId: string }>
  searchParams: Promise<{ claim?: string; preview_result?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { storeId } = await params
  return { title: `당근 인형뽑기 — ${storeId}` }
}

export default async function PlayPage({ params, searchParams }: Props) {
  const { storeId } = await params
  const { claim, preview_result } = await searchParams
  if (preview_result === 'big' || preview_result === 'small' || preview_result === 'miss') {
    return <ResultPreview tier={preview_result} />
  }
  if (preview_result === 'locked') {
    return <ResultLockedScreen storeId={storeId} />
  }
  if (
    preview_result === 'already_participated' ||
    preview_result === 'channel_cta' ||
    preview_result === 'verification'
  ) {
    return <FlowPreview screen={preview_result} storeId={storeId} />
  }
  const supabase = createServerClient()

  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, status')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .maybeSingle()

  const { data: contract } = await supabase
    .from('store_contracts')
    .select('daangn_url, kakao_channel_url')
    .eq('store_id', storeId)
    .maybeSingle()

  const { data: store } = await supabase
    .from('store_settings')
    .select('store_name')
    .eq('store_id', storeId)
    .maybeSingle()

  console.log('[play] storeId:', storeId)
  console.log('[play] event:', event)
  console.log('[play] error:', error)

  return (
    <PlayFlow
      storeId={storeId}
      event={event}
      storeName={store?.store_name ?? null}
      daangnUrl={safeHttpUrl(contract?.daangn_url)}
      kakaoChannelUrl={safeHttpUrl(contract?.kakao_channel_url)}
      resumeClaim={claim === '1'}
    />
  )
}
