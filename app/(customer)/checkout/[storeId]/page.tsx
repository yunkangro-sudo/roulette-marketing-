import CheckoutClient from './CheckoutClient'

export default async function CheckoutPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params
  return <CheckoutClient storeId={storeId} />
}
