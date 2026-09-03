import { requireAdminAuth } from '@/lib/admin/session'
import { redirect } from 'next/navigation'
import ReportClient from './ReportClient'

/**
 * 성과 리포트 — super_admin / agency 접근 가능
 * advertiser(대리접속 포함)는 대시보드 "성과 리포트" 탭으로 통합됐으므로
 * 옛 북마크/링크 보호를 위해 대시보드 탭 경로로 리다이렉트한다.
 */
export default async function AdminReportPage() {
  const account = await requireAdminAuth()
  if (account.role === 'advertiser') {
    redirect('/admin/dashboard?tab=report')
  }
  return <ReportClient role={account.role} storeId={account.storeId} />
}
