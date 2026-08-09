import { createServerClient } from '@/lib/supabase/server'
import PlayFlow from './PlayFlow'

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

  // 해당 매장의 active 이벤트 조회
  const { data: event } = await supabase
    .from('events')
    .select('id, name, status')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .maybeSingle()

  return <PlayFlow storeId={storeId} event={event} />
}
