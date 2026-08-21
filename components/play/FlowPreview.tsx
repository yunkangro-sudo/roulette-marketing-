'use client'

import AlreadyParticipatedScreen from './AlreadyParticipatedScreen'
import ChannelCtaScreen from './ChannelCtaScreen'
import VerificationCtaScreen from '../game/VerificationCtaScreen'

const PREVIEW_COUPON = {
  id: 'PREVIEW',
  shortCode: 'AB12CD',
  status: 'issued' as const,
  issuedAt: '2026-08-15',
  validUntil: '2026-09-15',
}

interface Props {
  screen: 'already_participated' | 'channel_cta' | 'verification'
  storeId: string
}

/** QA용 — DB 연동 없이 손님 여정 화면을 바로 확인하기 위한 프리뷰 래퍼 (`?preview_result=...`) */
export default function FlowPreview({ screen, storeId }: Props) {
  if (screen === 'already_participated') {
    return (
      <div className="h-full">
        <AlreadyParticipatedScreen onSwitchAccount={() => {}} />
      </div>
    )
  }

  if (screen === 'channel_cta') {
    return <ChannelCtaScreen kakaoChannelUrl="https://pf.kakao.com/_preview" onContinue={() => {}} />
  }

  return (
    <div className="h-full">
      <VerificationCtaScreen
        result={{
          tier: 'big',
          label: '10,000원 쿠폰',
          amount: 10000,
          requiresVerification: true,
          coupon: PREVIEW_COUPON,
        }}
        onDone={() => {}}
        daangnUrl="https://www.daangn.com/_preview"
        storeId={storeId}
        storeName="명동찜닭"
      />
    </div>
  )
}
