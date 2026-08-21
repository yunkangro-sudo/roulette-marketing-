import type { ReactNode } from 'react'

/**
 * 손님용 게임 화면(뽑기, 결과, 쿠폰 화면 등)은 모바일 전용으로 만들어져 있어서
 * PC처럼 넓은 화면에서 그냥 열면 이미지·버튼이 화면 전체로 늘어나 보인다.
 *
 * 640px(sm) 이상에서는 실제 손님이 보게 될 모바일 크기(430px)로 프레임을 씌워
 * 화면 중앙에 배치하고, 그보다 좁은 실제 모바일 화면에서는 프레임 없이
 * 원래처럼 화면 전체를 그대로 채운다 (실제 손님 경험은 전혀 바뀌지 않음).
 *
 * 내부 화면들은 모두 h-full 기준으로 그려지므로, 여기서 프레임 높이만
 * 고정해주면 내부 컴포넌트를 하나도 건드리지 않고 자동으로 맞춰진다.
 */
export default function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-full bg-[#0B0B0E] sm:flex sm:items-center sm:justify-center sm:p-6">
      <div
        className="relative mx-auto h-full w-full overflow-hidden bg-white
                   sm:h-[min(900px,92vh)] sm:w-[430px] sm:rounded-[40px] sm:p-[10px]
                   sm:shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)]"
      >
        {/* 상단 노치 — 640px 이상(데스크톱 프레임)에서만 표시 */}
        <div className="pointer-events-none absolute left-1/2 top-[10px] z-30 hidden h-[22px] w-[120px] -translate-x-1/2 rounded-full bg-[#0B0B0E] sm:block" />

        <div className="relative h-full w-full overflow-hidden bg-white sm:rounded-[32px]">
          {children}
        </div>
      </div>
    </div>
  )
}
