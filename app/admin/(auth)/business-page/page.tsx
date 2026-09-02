import { requireAdminAuth } from '@/lib/admin/session'
import BusinessPageClient from './BusinessPageClient'

export default async function BusinessPageAdminPage() {
  const account = await requireAdminAuth()
  return <BusinessPageClient role={account.role} storeId={account.storeId} />
}
