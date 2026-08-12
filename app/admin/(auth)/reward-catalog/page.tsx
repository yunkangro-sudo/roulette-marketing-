import { requireAdminAuth } from '@/lib/admin/session'
import RewardCatalogClient from './RewardCatalogClient'

export default async function RewardCatalogPage() {
  const account = await requireAdminAuth()
  return <RewardCatalogClient role={account.role} storeId={account.storeId} />
}
