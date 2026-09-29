const ITEMS = [
  { href: '/sales-manual', label: '상품 설명', id: 'product' },
  { href: '/sales-manual/pricing', label: '요금제 안내', id: 'pricing' },
  { href: '/setup-request', label: '세팅 접수', id: 'setup' },
  { href: '/sales-manual/commission', label: '수수료', id: 'commission' },
] as const

export default function ManualNav({ current }: { current: (typeof ITEMS)[number]['id'] }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#222222]/10 bg-[#FAF7F0]/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-5">
        <div className="flex h-14 items-center">
          <p className="text-[15px] font-extrabold tracking-tight">단골팅 영업 메뉴얼</p>
        </div>
        <nav className="grid grid-cols-2 gap-2 pb-3 sm:grid-cols-4" aria-label="영업 메뉴얼 메뉴">
          {ITEMS.map((item) => {
            const active = item.id === current
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-12 items-center justify-center px-1 text-center text-[14px] font-extrabold sm:text-[16px] ${
                  active ? 'bg-[#00C7A7] text-[#222222]' : 'bg-white text-[#222222]/70'
                }`}
                style={{ borderRadius: 12 }}
              >
                {item.label}
              </a>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
