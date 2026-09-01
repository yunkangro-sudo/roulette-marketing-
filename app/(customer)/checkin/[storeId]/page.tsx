import CheckinClient from './CheckinClient'

export default async function CheckinPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params
  return <CheckinClient storeId={storeId} />
}
