'use client'

import type { ReactNode } from 'react'

interface CouponTicketProps {
  /** 박스 안 최상단에 크게 표시할 당첨 금액/상품명 (예: "10,000원 쿠폰") */
  amountLabel: string
  code: string
  /** 이미 "~2026.09.01" 형태로 포맷된 문자열 */
  validUntilLabel: string
  noteText?: string
  /** 점선 아래(코드/유효기간)와 별도로, 박스 맨 아래 실선 구분 후 들어가는 부가 콘텐츠 (배너, 사용완료 뱃지 등) */
  footer?: ReactNode
  className?: string
  /** 상단 금액/상품명 텍스트 색상 — 화면별로 다르게 강조할 때 사용 (기본: 무채색) */
  amountLabelClassName?: string
}

/** 결과화면/쿠폰함/당근인증 화면에서 공통으로 쓰는 "완결된 종이 티켓" 스타일 쿠폰 박스.
 *  금액을 코드보다 크게 배치하고, 영수증 절취선(점선)으로 금액-코드 영역을 나눈다. */
export default function CouponTicket({
  amountLabel,
  code,
  validUntilLabel,
  noteText = '직원에게 보여주세요',
  footer,
  className = '',
  amountLabelClassName = 'text-[#222222]',
}: CouponTicketProps) {
  return (
    <div
      className={`relative rounded-[26px] bg-[#FFFBF2] px-5 py-6 text-center shadow-[0_12px_28px_-10px_rgba(120,90,40,0.4)] ${className}`}
    >
      <p className={`text-[28px] font-black leading-tight ${amountLabelClassName}`}>{amountLabel}</p>

      <div
        className="my-4 border-t-2 border-dashed"
        style={{ borderColor: 'rgba(34,34,34,0.16)' }}
      />

      <p className="mb-1.5 text-xs font-semibold text-[#222222]/45">{noteText}</p>
      <p className="mb-2 font-mono text-2xl font-black tracking-[0.3em] text-[#222222]">
        {code}
      </p>
      <p className="text-xs text-[#222222]/40">유효기간 {validUntilLabel}</p>

      {footer && <div className="mt-3.5 border-t border-[#222222]/10 pt-3.5">{footer}</div>}
    </div>
  )
}
