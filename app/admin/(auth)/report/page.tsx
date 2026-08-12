import { requireAdminAuth } from '@/lib/admin/session'
import ReportClient from './ReportClient'

export default async function AdminReportPage() {
  const account = await requireAdminAuth()
  return <ReportClient role={account.role} />
}
