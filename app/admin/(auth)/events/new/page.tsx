import { requireAdminAuth } from '@/lib/admin/session'
import NewEventForm from './NewEventForm'

export default async function NewEventPage() {
  const account = await requireAdminAuth()

  return (
    <NewEventForm
      role={account.role}
      storeId={account.storeId}
    />
  )
}
