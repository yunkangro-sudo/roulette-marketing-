'use client'

import ResultScreen from './ResultScreen'
import type { PrizeResult } from './types'

const PREVIEWS: Record<'big' | 'small' | 'miss', PrizeResult> = {
  big: {
    tier: 'big',
    label: '10,000원 쿠폰',
    amount: 10000,
    requiresVerification: true,
    coupon: {
      id: 'PREVIEW',
      shortCode: 'AB12CD',
      status: 'issued',
      issuedAt: '2026-08-15',
      validUntil: '2026-09-15',
    },
  },
  small: {
    tier: 'small',
    label: '1,000원 쿠폰',
    amount: 1000,
    requiresVerification: false,
    coupon: {
      id: 'PREVIEW',
      shortCode: 'EF34GH',
      status: 'issued',
      issuedAt: '2026-08-15',
      validUntil: '2026-09-15',
    },
  },
  miss: {
    tier: 'miss',
    label: '꽝!',
    amount: 0,
    requiresVerification: false,
  },
}

export default function ResultPreview({ tier }: { tier: 'big' | 'small' | 'miss' }) {
  return (
    <div className="h-screen">
      <ResultScreen
        result={PREVIEWS[tier]}
        onReplay={() => {}}
        onContinue={() => {}}
        continueLabel="다음"
      />
    </div>
  )
}
