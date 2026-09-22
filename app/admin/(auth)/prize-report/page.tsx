import { redirect } from 'next/navigation'

/** 예전 주소로 들어오면 대시보드의 경품 세팅 리포트 탭으로 보낸다 */
export default function PrizeReportPage() {
  redirect('/admin/dashboard?tab=prize')
}
