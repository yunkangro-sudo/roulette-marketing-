import type { Metadata } from 'next'
import SetupRequestForm from '@/components/setup-request/SetupRequestForm'

export const metadata: Metadata = {
  title: '단골팅 세팅 접수',
  description: '영업사원과 광고주가 게임·리워드 세팅 내용을 본사에 보내는 접수 화면.',
  robots: { index: false, follow: false },
}

export default function SetupRequestPage() {
  return <SetupRequestForm />
}
