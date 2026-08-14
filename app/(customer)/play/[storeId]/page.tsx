import { createServerClient } from '@/lib/supabase/server'
import PlayFlow from './PlayFlow'
import { safeHttpUrl } from '@/lib/store/profileUrls'

interface Props {
  params: Promise<{ storeId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { storeId } = await params
  return { title: `당근 인형뽑기 — ${storeId}` }
}

export default async function PlayPage({ params }: Props) {
  const { storeId } = await params
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

  console.log('[play] storeId:', storeId)
  console.log('[play] event:', event)
  console.log('[play] error:', error)

  return (
    <PlayFlow
      storeId={storeId}
      event={event}
      daangnUrl={safeHttpUrl(contract?.daangn_url)}
      kakaoChannelUrl={safeHttpUrl(contract?.kakao_channel_url)}
    />
  )
}
