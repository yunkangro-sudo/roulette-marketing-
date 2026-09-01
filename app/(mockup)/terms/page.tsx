import Link from 'next/link'

export const metadata = {
  title: '이용약관 · 단골마케팅',
  description: '아크웍스(ARK WORKS) 서비스 이용약관',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* 헤더 */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-gradient-to-br from-yellow-400 to-orange-500">
              🥕
            </div>
            <span className="font-bold text-white">단골마케팅</span>
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← 홈으로
          </Link>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">이용약관</h1>
        <p className="text-sm text-gray-500 mb-10">시행일: 2026년 5월 22일</p>

        {/* 사업자 정보 박스 */}
        <div className="bg-white/5 rounded-xl p-5 mb-10 space-y-1">
          <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">사업자 정보</p>
          <Row label="상호">아크웍스(ARK WORKS)</Row>
          <Row label="대표자">양경직</Row>
          <Row label="사업자등록번호">628-33-01601</Row>
          <Row label="통신판매업신고번호">제 2026-충남천안-1482호</Row>
          <Row label="주소">천안시 서북구 2공단5로52, 룩소르비즈타워 863호</Row>
          <Row label="대표전화">
            <a href="tel:16883893" className="text-orange-400 hover:underline">1688-3893</a>
          </Row>
          <Row label="이메일">
            <a href="mailto:yangpro03@gmail.com" className="text-orange-400 hover:underline">yangpro03@gmail.com</a>
          </Row>
        </div>

        <div className="space-y-10 text-gray-300 text-sm leading-relaxed">

          <Section title="제1조 (목적)">
            <p>
              본 이용약관은 회사가 제공하는 서비스의 이용 조건 및 절차,
              회사와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
            </p>
          </Section>

          <Section title="제2조 (서비스 범위)">
            <p>회사는 아래 서비스를 제공합니다.</p>
            <ul>
              <li>숏폼 영상 기획 및 편집</li>
              <li>콘텐츠 전략 제안</li>
              <li>SNS 운영 보조</li>
              <li>AI 기반 마케팅 시스템 제공</li>
              <li>채널 세팅 및 운영 지원</li>
              <li>기타 계약 범위 내 부가 서비스</li>
            </ul>
            <p className="text-gray-500 text-xs mt-2">
              ※ 서비스 범위는 계약 플랜에 따라 상이할 수 있습니다.
            </p>
          </Section>

          <Section title="제3조 (성과 보장에 대한 고지)">
            <p>회사는 콘텐츠 제작 및 운영 서비스를 제공하나, 아래 사항은 보장하지 않습니다.</p>
            <ul>
              <li>조회수 증가, 매출 상승, 검색 노출 순위</li>
              <li>팔로워 증가, 광고 성과, 플랫폼 알고리즘 결과</li>
            </ul>
            <p>
              콘텐츠 성과는 업종, 지역, 경쟁 환경, 플랫폼 정책, 광고 집행 여부, 계정 상태 등
              다양한 외부 요인에 의해 달라질 수 있으며, 회사는 특정 성과를 보장하지 않습니다.
            </p>
          </Section>

          <Section title="제4조 (자료 제공 및 책임)">
            <p>
              고객은 제작에 필요한 영상, 이미지, 로고, 텍스트, 사업 정보 등을 제공해야 합니다.
              고객이 제공한 자료로 인해 발생하는 저작권·초상권·상표권 분쟁 및 법적 책임은
              고객에게 있으며, 회사는 이에 대한 책임을 지지 않습니다.
            </p>
          </Section>

          <Section title="제5조 (작업 일정)">
            <p>
              작업 기간은 자료 전달 시점, 피드백 속도, 수정 범위, 프로젝트 상황에 따라
              달라질 수 있습니다. 고객의 피드백 지연 또는 자료 미전달로 인한 일정 지연에
              대해 회사는 책임지지 않습니다.
            </p>
          </Section>

          <Section title="제6조 (수정 정책)">
            <p>기본 수정은 계약 범위 내에서 제공됩니다. 아래는 추가 비용이 발생할 수 있습니다.</p>
            <ul>
              <li>전체 기획 변경, 촬영 재진행, 방향성 변경</li>
              <li>최초 요청 범위를 초과한 수정, 반복적인 디자인 변경</li>
              <li>과도한 수정 요청</li>
            </ul>
            <p>회사는 합리적 범위를 초과하는 수정 요청에 대해 작업을 제한할 수 있습니다.</p>
          </Section>

          <Section title="제7조 (환불 규정)">
            <p>
              서비스 특성상 기획 및 제작 착수 이후에는 인력과 시간이 투입되므로
              단순 변심에 의한 환불은 제한됩니다. 환불 기준은 다음과 같습니다.
            </p>
            <div className="bg-white/5 rounded-xl p-4 space-y-2 my-3">
              <RefundRow stage="작업 시작 전"      rate="100% 환불" color="text-green-400" />
              <RefundRow stage="기획 완료 후"      rate="결제 금액의 50% 환불" color="text-yellow-400" />
              <RefundRow stage="편집 및 제작 착수 후" rate="환불 불가" color="text-red-400" />
            </div>
            <p>
              이미 제공된 기획안, 전략 자료, 대본, 디자인 작업 등은 환불 여부와 관계없이
              회수되지 않습니다.
            </p>
          </Section>

          <Section title="제8조 (AI 시스템 제공 정책)">
            <p>
              AI 시스템은 계약 기간 동안 제공됩니다. 회사는 시스템 유지보수, 정책 변경,
              기능 개선 등을 위해 일부 기능을 변경하거나 제한할 수 있습니다.
              외부 API 정책, 플랫폼 정책, 기술 환경 변화에 따라 일부 기능이 중단될 수 있으며,
              이에 대한 책임은 회사에 없습니다.
            </p>
          </Section>

          <Section title="제9조 (계정 운영 관련)">
            <p>
              SNS 및 플랫폼 계정의 최종 관리 책임은 고객에게 있습니다.
              플랫폼 정책 위반, 계정 정지, 노출 제한 등은 플랫폼 정책에 따라 발생할 수 있으며,
              회사는 이에 대한 책임을 지지 않습니다.
            </p>
          </Section>

          <Section title="제10조 (포트폴리오 활용)">
            <p>
              회사는 제작된 결과물을 포트폴리오, 마케팅 자료, SNS 홍보, 사례 소개 등의
              목적으로 활용할 수 있습니다. 비공개 요청이 필요한 경우 계약 전 별도 협의가 필요합니다.
            </p>
          </Section>

          <Section title="제11조 (책임 제한)">
            <p>회사는 아래 사항에 대해 책임지지 않습니다.</p>
            <ul>
              <li>플랫폼 알고리즘 변화, 광고 성과 미달, 계정 제재</li>
              <li>고객 매출 변화, 시장 상황 변화, 경쟁 업체 활동</li>
              <li>고객 내부 운영 문제</li>
            </ul>
            <p>
              회사의 책임 범위는 고객이 실제 지급한 계약 금액 범위를 초과하지 않습니다.
            </p>
          </Section>

          <Section title="제12조 (계약 해지)">
            <p>
              고객이 반복적인 업무 방해, 폭언 및 비정상 요구, 계약 범위 초과 요청,
              작업 지연 유발 등을 하는 경우 회사는 계약을 중단할 수 있습니다.
            </p>
          </Section>

          <Section title="제13조 (결제 및 계약 성립)">
            <p>
              이용자는 회사가 정한 요금을 결제함으로써 서비스 이용 계약이 성립합니다.
              결제 수단, 금액, 제공 기간은 결제 직전 화면과 상품 상세에 표시된 내용을 따릅니다.
            </p>
          </Section>

          <Section title="제14조 (최종 동의)">
            <p>
              서비스 진행 및 결제 시 고객은 본 이용약관 및 개인정보처리방침에 동의한 것으로
              간주합니다.
            </p>
          </Section>

          <section className="pt-4 border-t border-white/10">
            <p className="text-gray-500 text-xs">부칙: 본 약관은 2026년 5월 22일부터 시행합니다.</p>
          </section>

        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-white/10 px-6 py-8 mt-16">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
            <Link href="/terms"   className="text-orange-400">이용약관</Link>
            <a href="mailto:cola1won@naver.com" className="hover:text-white transition-colors">문의하기</a>
          </div>
          <p className="text-xs text-gray-600">© 2026 아크웍스(ARK WORKS). All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-white mb-3 pb-2 border-b border-white/10">{title}</h2>
      <div className="space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-gray-500 w-44 shrink-0">{label}</span>
      <span className="text-gray-300">{children}</span>
    </div>
  )
}

function RefundRow({ stage, rate, color }: { stage: string; rate: string; color: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{stage}</span>
      <span className={`font-semibold ${color}`}>{rate}</span>
    </div>
  )
}
