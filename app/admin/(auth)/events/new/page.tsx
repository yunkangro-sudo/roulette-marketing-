import { Suspense } from 'react'
import { requireAdminAuth } from '@/lib/admin/session'
import NewEventForm from './NewEventForm'

export default async function NewEventPage() {
  const account = await requireAdminAuth()

  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-8 text-gray-400">로딩 중...</div>}>
      <NewEventForm
        role={account.role}
        storeId={account.storeId}
      />
    </Suspense>
  )
}
