const ITEMS = [
  { href: '/sales-manual', label: '상품 설명', id: 'product' },
  { href: '/sales-manual/pricing', label: '요금제 안내', id: 'pricing' },
  { href: '/setup-request', label: '세팅 접수', id: 'setup' },
  { href: '/sales-manual/pitch', label: '현장 화법', id: 'pitch' },
] as const

export default function ManualNav({ current }: { current: (typeof ITEMS)[number]['id'] }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#222222]/10 bg-[#FAF7F0]/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-5">
        <div className="flex h-14 items-center">
          <p className="text-[15px] font-extrabold tracking-tight">단골팅 영업 메뉴얼</p>
        </div>
        <nav className="grid grid-cols-2 gap-2 pb-3 sm:grid-cols-4" aria-label="영업 메뉴얼 메뉴">
          {ITEMS.map((item, index) => {
            const active = item.id === current
            const lastOdd = index === ITEMS.length - 1 && ITEMS.length % 2 === 1
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-12 items-center justify-center px-1 text-center text-[14px] font-extrabold sm:text-[15px] ${
                  lastOdd ? 'col-span-2 sm:col-span-1' : ''
                } ${active ? 'bg-[#00C7A7] text-[#222222]' : 'bg-white text-[#222222]/70'}`}
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
