import Link from 'next/link'

export const metadata = {
  title: '개인정보처리방침 · 단골마케팅',
  description: '아크웍스(ARK WORKS) 개인정보처리방침',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* 헤더 */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-gradient-to-br from-yellow-400 to-orange-500">
              🥕
            </div>
            <span className="font-bold text-white">단골마케팅</span>
          </Link>
          <Link href="/landing" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← 홈으로
          </Link>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">개인정보처리방침</h1>
        <p className="text-sm text-gray-500 mb-10">시행일: 2026년 5월 22일</p>

        <div className="prose prose-invert max-w-none space-y-10 text-gray-300 text-sm leading-relaxed">

          <section>
            <p>
              아크웍스(이하 "회사")는 이용자의 개인정보를 중요하게 생각하며
              「개인정보 보호법」 등 관련 법령을 준수합니다.
            </p>
          </section>

          <Section title="1. 수집하는 개인정보">
            <p>회사는 서비스 이용 및 상담을 위해 다음과 같은 개인정보를 수집할 수 있습니다.</p>
            <ul>
              <li>이름</li>
              <li>연락처(휴대전화번호)</li>
              <li>이메일 주소</li>
              <li>회사명(선택)</li>
              <li>결제 및 거래 정보(결제 수단, 결제 금액, 주문번호 등)</li>
              <li>서비스 이용기록 및 접속 로그</li>
              <li>카카오 계정 고유 ID 및 닉네임 (카카오 로그인 이용 시)</li>
              <li>전화번호 (카카오 비즈앱 심사 완료 후 동의자에 한해 암호화 수집 · 쿠폰 발급 알림 목적)</li>
            </ul>
          </Section>

          <Section title="2. 개인정보 이용 목적">
            <p>수집한 개인정보는 다음 목적으로만 이용됩니다.</p>
            <ul>
              <li>서비스 상담 및 문의 응대</li>
              <li>회원 관리 및 서비스 제공</li>
              <li>결제 및 계약 이행, 환불 처리</li>
              <li>공지사항 및 서비스 안내</li>
              <li>고객 지원 및 품질 개선</li>
              <li>카카오 알림톡을 통한 쿠폰 발급 알림 발송 (전화번호 동의자에 한함)</li>
            </ul>
          </Section>

          <Section title="3. 개인정보 보유 및 이용기간">
            <p>
              회사는 개인정보 수집 목적이 달성되면 지체 없이 파기합니다.
              단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관합니다.
            </p>
            <ul>
              <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
              <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
              <li>웹사이트 방문 기록(접속 로그): 3개월</li>
            </ul>
          </Section>

          <Section title="4. 개인정보 제3자 제공">
            <p>
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
              단, 법령에 따른 경우 또는 이용자의 동의가 있는 경우에 한하여 제공합니다.
            </p>
          </Section>

          <Section title="5. 개인정보 처리 위탁">
            <p>서비스 운영을 위하여 필요한 경우 다음과 같은 업체에 개인정보 처리를 위탁할 수 있습니다.</p>
            <ul>
              <li>Supabase — 데이터 저장 및 회원 관리</li>
              <li>Google — 문의 및 폼 서비스, AI API</li>
              <li>PortOne 및 NHN KCP — 결제 처리</li>
              <li>Vercel — 서비스 호스팅</li>
              <li>알림톡 발송대행사(솔라피 등) — 카카오 알림톡 발송 (도입 시 별도 고지)</li>
            </ul>
          </Section>

          <Section title="6. 이용자의 권리">
            <p>
              이용자는 언제든지 개인정보의 조회, 수정, 삭제 및 처리정지를 요청할 수 있으며,
              회사는 관련 법령에 따라 지체 없이 처리합니다.
            </p>
          </Section>

          <Section title="7. 개인정보 보호">
            <p>
              회사는 개인정보 보호를 위해 합리적인 기술적·관리적 보호조치를 시행하고 있습니다.
              전화번호는 AES-256 방식으로 암호화하여 저장하며, 평문으로 보관하지 않습니다.
            </p>
          </Section>

          <Section title="8. 문의처">
            <div className="bg-white/5 rounded-xl p-5 space-y-1 not-prose">
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
          </Section>

          <Section title="9. 시행일">
            <p>본 개인정보처리방침은 2026년 5월 22일부터 적용됩니다.</p>
          </Section>

        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-white/10 px-6 py-8 mt-16">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="text-orange-400">개인정보처리방침</Link>
            <Link href="/terms"   className="hover:text-white transition-colors">이용약관</Link>
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
      <span className="text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-gray-300">{children}</span>
    </div>
  )
}
