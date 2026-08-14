/**
 * /review-guide — 카카오 API 심사관용 서비스 테스트 가이드
 *
 * 카카오 개발자센터 심사 제출 시 이 URL을 첨부:
 * https://roulette-marketing.vercel.app/review-guide
 */

export default function ReviewGuidePage() {
  const BASE = 'https://roulette-marketing.vercel.app'
  const STORE_ID = 'chj-001'  // 심사용 테스트 매장

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* 헤더 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-2xl">🎮</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">당근 인형뽑기 — 카카오 API 심사 가이드</h1>
              <p className="text-xs text-gray-400">아크웍스 (ARKWORKS) · 사업자 628-33-01601</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            본 서비스는 <strong>오프라인 매장 방문 고객</strong>을 위한 모바일 인형뽑기 게임 마케팅 플랫폼입니다.
            매장 QR코드를 스캔한 손님이 카카오 로그인 후 게임에 참여하며,
            당첨 쿠폰을 <strong>카카오톡 나에게 보내기</strong>로 받고,
            친구에게 서비스를 소개할 수 있습니다.
          </p>
        </div>

        {/* 서비스 흐름 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">📱 전체 서비스 흐름</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: '매장 QR 스캔 / 링크 접속', desc: '손님이 매장 QR코드를 스캔하거나 카카오 채널 링크로 접속' },
              { step: '2', title: '카카오 로그인', desc: '카카오 계정으로 로그인 — 닉네임, 전화번호, 나에게 보내기 동의 요청' },
              { step: '3', title: '인형뽑기 게임', desc: '화면에서 손가락으로 크레인을 조작해 당근 인형 뽑기 시도' },
              { step: '4', title: '쿠폰 발급 + 카카오톡 발송', desc: '당첨 시 쿠폰 코드 발급 → 카카오톡 나에게 보내기로 쿠폰 정보 즉시 발송' },
              { step: '5', title: '매장 계산대 처리', desc: '직원이 6자리 코드 확인 후 쿠폰/포인트 리워드 처리' },
              { step: '6', title: '포인트 적립', desc: '매 방문마다 포인트 적립. 친구 초대(/me/invite)는 심사 반려로 당분간 준비중' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 테스트 링크 */}
        <div className="bg-white rounded-2xl border border-orange-200 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">🔗 심사관 직접 테스트 링크</h2>
          <p className="text-xs text-gray-500 mb-4">아래 링크를 순서대로 클릭해서 전체 흐름을 확인하실 수 있습니다.</p>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg shrink-0">STEP 1</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 mb-1">카카오 로그인 시작</p>
                  <p className="text-xs text-gray-500 mb-2">
                    아래 링크 접속 → 카카오 로그인 버튼 클릭 → 동의항목 화면 확인<br />
                    <span className="text-orange-600 font-medium">요청 동의항목: 닉네임 / 전화번호 / 나에게 보내기 / 친구목록</span>
                  </p>
                  <a href={`${BASE}/play/${STORE_ID}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                    🎮 게임 페이지 열기 → {BASE}/play/{STORE_ID}
                  </a>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg shrink-0">STEP 2</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 mb-1">게임 플레이 후 쿠폰 당첨 확인</p>
                  <p className="text-xs text-gray-500 mb-2">
                    로그인 완료 후 게임 시작 → 결과 화면에서 6자리 쿠폰 코드 확인<br />
                    당첨 시 <span className="text-orange-600 font-medium">카카오톡 나에게 보내기로 쿠폰 정보 메시지 수신</span>
                  </p>
                  <p className="text-xs text-gray-400">※ 꽝인 경우 다시 시도하시면 됩니다 (확률 설정에 따라 당첨)</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg shrink-0">STEP 3</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 mb-1">MESSAGE API — 나에게 보내기 확인</p>
                  <p className="text-xs text-gray-500 mb-2">
                    게임 당첨 후 본인 카카오톡에서 아래 형태의 메시지 수신 확인:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono leading-relaxed">
                    🎁 [매장명] 쿠폰 발급 안내<br /><br />
                    {'{'}쿠폰금액{'}'}원 쿠폰이 발급되었습니다.<br /><br />
                    📌 쿠폰 코드: AB3K7P<br />
                    📅 사용 기간: ~2026년 9월 13일<br /><br />
                    매장에서 직원에게 이 코드를 보여주세요.<br /><br />
                    [매장에서 사용하기]
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg shrink-0">STEP 4</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 mb-1">FRIEND API — 친구 초대 (보류)</p>
                  <p className="text-xs text-gray-500 mb-2">
                    FRIEND API 심사 반려로 당분간 비활성화. 화면은 준비중만 표시합니다. 로그인 scope에서 friends를 요청하지 않습니다.
                  </p>
                  <a href={`${BASE}/me/invite?store_id=${STORE_ID}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                    👥 친구 목록 화면 열기 → {BASE}/me/invite
                  </a>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg shrink-0">STEP 5</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 mb-1">개인정보 동의항목 — 회원가입 화면</p>
                  <p className="text-xs text-gray-500 mb-2">
                    카카오 로그인이 이 서비스의 회원가입에 해당합니다.<br />
                    STEP 1 링크에서 로그인 전 동의항목 화면을 확인하실 수 있습니다.<br />
                    <span className="text-orange-600 font-medium">
                      수집 항목: 카카오계정(닉네임, 전화번호) / 나에게 보내기
                    </span>
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                    수집 목적: 게임 참여 식별, 쿠폰 발급 알림(나에게 보내기)<br />
                    보유 기간: 서비스 이용 종료 시까지 (동의 철회 시 즉시 삭제)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 개인정보 수집 명세 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">📋 개인정보 수집 명세</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-gray-600 border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left border border-gray-200 px-3 py-2 font-semibold text-gray-700">항목</th>
                  <th className="text-left border border-gray-200 px-3 py-2 font-semibold text-gray-700">수집 목적</th>
                  <th className="text-left border border-gray-200 px-3 py-2 font-semibold text-gray-700">보유 기간</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { item: '카카오 고유 ID', purpose: '회원 식별, 게임 참여 기록', period: '서비스 탈퇴 시' },
                  { item: '닉네임', purpose: '게임 화면 표시', period: '서비스 탈퇴 시' },
                  { item: '전화번호 (암호화 저장)', purpose: '쿠폰 발급 알림 발송', period: '서비스 탈퇴 시' },
                  { item: '나에게 보내기 권한', purpose: '쿠폰코드 카카오톡 발송', period: '동의 철회 시' },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="border border-gray-200 px-3 py-2 font-medium">{row.item}</td>
                    <td className="border border-gray-200 px-3 py-2">{row.purpose}</td>
                    <td className="border border-gray-200 px-3 py-2">{row.period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="bg-gray-100 rounded-xl px-5 py-4 text-xs text-gray-500 text-center">
          아크웍스(ARKWORKS) · 대표 양경직 · 사업자등록번호 628-33-01601<br />
          천안시 서북구 2공단5로52 룩소르비즈타워 863호 · 1688-3893 · cola1won@naver.com
        </div>

      </div>
    </div>
  )
}
