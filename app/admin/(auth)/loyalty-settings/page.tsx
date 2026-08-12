import { requireAdminAuth } from '@/lib/admin/session'
import LoyaltySettingsClient from './LoyaltySettingsClient'

export default async function LoyaltySettingsPage() {
  const account = await requireAdminAuth()
  return <LoyaltySettingsClient role={account.role} storeId={account.storeId} />
}
