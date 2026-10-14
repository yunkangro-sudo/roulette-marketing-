import type { Metadata } from 'next'
import FranchiseClient from './FranchiseClient'

const TITLE = '당근 프랜차이즈 마케팅 | 당근 광고 × 단골팅'
const DESC =
  '본사 광고는 통합하고, 지점 홍보는 지역에 맞게. 브랜드 홍보·지점 홍보·매출 확대·가맹점 모집을 당근 광고와 단골팅 QR 게임 이벤트로 한 번에 운영하세요.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC },
}

export default function FranchisePage() {
  return <FranchiseClient />
}
