/**
 * 단골팅 랜딩 v5 — 교체 가능한 설정값만 모은다.
 * 요금·카카오 URL·스크린샷 경로·히어로 CTA 좌표는 여기만 바꾸면 된다.
 */

export const NAV_HEIGHT_PX = 64

export const KAKAO_CONSULT_URL = ''

export const SIGNUP_PATH = '/signup'

export const PRICING = {
  basic: {
    id: 'basic',
    name: '베이직',
    regularPrice: 39_000,
    promoPrice: 19_000,
    setupFee: 275_000,
    ribbonLabel: '선착순 100개 업체 한정',
    features: ['게임 이벤트 1개', '기본 쿠폰·포인트', '기본 고객 데이터'],
    qrPrintNote: 'QR 코드 인쇄물 10개까지 무료 제공 (10개 초과 시 추가 요금 발생)',
    reassurance: [
      '언제든 해지 가능 — 위약금 없음',
      '숨겨진 비용 없음 — 표시된 가격이 전부',
      'QR 하나로 시작 — 복잡한 세팅 없음',
    ],
  },
  aeo: {
    id: 'aeo',
    name: 'AEO마케팅',
    price: 270_000,
    subheadline: 'AI 검색에도 우리 매장이 뜨게',
    description:
      '챗GPT, 퍼플렉시티 같은 AI 검색이 "우리 동네 맛집"을 물었을 때 매장이 답변에 등장하도록 만드는 홈페이지 제작 서비스입니다.',
    launchNote: '약 1개월 후 출시 예정',
  },
} as const

/** 정가 대비 프로모션가 할인율(%) — 반올림해서 배지에 그대로 노출 ("51% 할인"). */
export const PRICING_BASIC_DISCOUNT_PERCENT = Math.round(
  (1 - PRICING.basic.promoPrice / PRICING.basic.regularPrice) * 100
)

/** 베이직 신청 시 오늘 결제할 총액 = 초기 세팅비(1회) + 첫 달 구독료(프로모션가). */
export const PRICING_BASIC_TODAY_TOTAL = PRICING.basic.setupFee + PRICING.basic.promoPrice

/** 요금제 섹션 — 요금제 카드와 최종 CTA 사이에 배치하는 런칭 경품 이벤트 블록.
 *  ctaUrl은 단골팅 자체 게임 엔진에 등록된 실제 이벤트 페이지. */
export const LAUNCH_EVENT = {
  headline: '결정하기 전에, 먼저 체험해보세요',
  subcopy: '우리 서비스가 실제로 어떤 경험인지, 사장님이 직접 손님이 되어보세요.',
  cardTitle: '단골팅 런칭 경품 이벤트',
  prizes: [
    '5천원 무료 쿠폰',
    '1만원 무료 쿠폰',
    '구독료 1개월 무료 쿠폰',
    '구독료 3개월 무료 쿠폰',
    'AEO 홈페이지 제작 서비스 무료 쿠폰',
  ],
  note: '참여하신 모든 분께 경품이 있습니다',
  ctaLabel: '이벤트 참여하기',
  ctaUrl: 'https://www.dgting.co.kr/play/dgting',
} as const

/** 베이직 신청 완료 화면에 표시하는 입금 계좌 정보 — 세팅비(1회) 수기 입금용. */
export const BANK_ACCOUNT = {
  bank: '신한은행',
  account: '110-635-375949',
  holder: '양경직(아크웍스)',
} as const

/** 베이직 신청 완료 후 "럭키박스" 웰컴 기프트 리빌에서 항상 보여주는 고정 결과 문구.
 *  DemoModal(다른 CTA들의 랜덤 데모)과는 별개로, 여기서는 랜덤 요소가 없다. */
export const WELCOME_GIFT_LABEL = '포인트 카탈로그 1개 무료 추가'

export const ROI_ASSUMPTIONS = {
  revisitRate: 0.12,
  benefitPerGuest: 2_000,
  spendPerGuest: 19_000,
  sliderMin: 20,
  sliderMax: 300,
  sliderStep: 10,
  sliderDefault: 100,
  exampleGuests: 100,
  /** 하루 단위 입력값을 월간 예상치로 환산할 때 쓰는 기준 일수 */
  daysPerMonth: 30,
} as const

export const DEMO_PRIZES = [10_000, 2_000, 1_000] as const

export type ClientCategory = '카페·디저트' | '버거·패스트푸드' | '분식·스낵'

export type Client = {
  name: string
  logoUrl: string | null
  category: ClientCategory
}

/** 실제 로고 파일이 준비되면 logoUrl에 경로만 채우면 자동으로 이미지로 렌더링된다. */
export const CLIENTS: Client[] = [
  { name: '설빙', logoUrl: null, category: '카페·디저트' },
  { name: '던킨도너츠', logoUrl: null, category: '카페·디저트' },
  { name: '배스킨라빈스', logoUrl: null, category: '카페·디저트' },
  { name: '맘스터치', logoUrl: null, category: '버거·패스트푸드' },
  { name: '버거킹', logoUrl: null, category: '버거·패스트푸드' },
  { name: 'KFC', logoUrl: null, category: '버거·패스트푸드' },
  { name: '촌놈칩스', logoUrl: null, category: '분식·스낵' },
  { name: '노걸대', logoUrl: null, category: '분식·스낵' },
  { name: '죠스떡볶이', logoUrl: null, category: '분식·스낵' },
  { name: '신전떡볶이', logoUrl: null, category: '분식·스낵' },
]

export const CLIENT_CATEGORIES: ClientCategory[] = ['카페·디저트', '버거·패스트푸드', '분식·스낵']

/** 히어로 롤링 키워드 — 조사 없이 문장이 끝나는 구조만 사용("게임 한 판으로 완성되는 OOO."). */
export const HERO_ROTATOR_WORDS = [
  '재방문',
  '단골',
  '매출',
  '재구매',
  '충성고객',
  '입소문',
  '후기',
  '예약률',
] as const

/** 도입 매장 섹션 노출 여부 — 현재 매장 목록은 실제 로고 없는 플레이스홀더뿐이라
 *  꺼둔다. 실제 도입 매장이 10곳 이상 확보되면 true로 전환. */
export const SHOW_CLIENT_SHOWCASE = false

export const NAV_LINKS = [
  { href: '#service', label: '서비스' },
  { href: '#process', label: '프로세스' },
  { href: '#pricing', label: '요금제' },
  ...(SHOW_CLIENT_SHOWCASE ? [{ href: '#stories', label: '도입사례' }] : []),
] as const

export type ScreenshotId = '01' | '02' | '04' | '05' | '06' | '08' | '09' | '10' | '11' | '12'

export type ScreenshotSlotConfig = {
  id: ScreenshotId
  /** 비어 있으면 플레이스홀더. 나중에 `/landing-v5/screens/01-entry.webp` 만 넣으면 된다. */
  src: string
  label: string
  caption: string
}

export const SCREENSHOTS: Record<ScreenshotId, ScreenshotSlotConfig> = {
  '01': {
    id: '01',
    src: '/landing-v5/screens/01-entry.webp',
    label: '게임 진입 화면',
    caption: 'QR 찍고 바로 시작',
  },
  '02': {
    id: '02',
    src: '/landing-v5/screens/02-progress.webp',
    label: '게임 진행 화면',
    caption: '크레인이 자동으로 상품을 찾아요',
  },
  '04': {
    id: '04',
    src: '/landing-v5/screens/04-result.webp',
    label: '결과 확인 화면',
    caption: '카카오 로그인 후 선물 공개',
  },
  '05': {
    id: '05',
    src: '/landing-v5/screens/05-win.webp',
    label: '당첨 결과 화면',
    caption: '화려하지만 절제된 축하 연출',
  },
  '06': {
    id: '06',
    src: '/landing-v5/screens/06-qr.webp',
    label: '테이블 QR 코드',
    caption: '매장 어디서나, QR 하나로 시작',
  },
  '08': {
    id: '08',
    src: '/landing-v5/screens/08-kakao.webp',
    label: '카카오 알림톡',
    caption: '당첨되면 카톡으로 바로 알려드려요',
  },
  '09': {
    id: '09',
    src: '/landing-v5/screens/09-follow.webp',
    label: '당근마켓 단골 인증',
    caption: '당근마켓에서 단골 추가',
  },
  '10': {
    id: '10',
    src: '/landing-v5/screens/07-wallet.webp',
    label: '당첨 쿠폰함',
    caption: '받은 혜택을 한눈에',
  },
  '11': {
    id: '11',
    src: '/landing-v5/screens/11-admin-dashboard.webp',
    label: '관리자 대시보드',
    caption: '실제 관리자 대시보드 (이번 주 기준)',
  },
  '12': {
    id: '12',
    src: '',
    label: '계산대 검증',
    caption: '매장에서 쿠폰 사용 처리',
  },
}

export const FAQ_ITEMS = [
  {
    q: '이거 한 달에 얼마예요? 추가로 더 드는 돈은 없어요?',
    a: `월 구독료 ${formatWon(PRICING.basic.promoPrice)}(정상 구독료는 ${formatWon(
      PRICING.basic.regularPrice
    )} / 선착순 100개 업체 프로모션가격, VAT 포함)이 전부입니다. 초기 세팅비 ${formatWon(
      PRICING.basic.setupFee
    )}은 처음 한 번만 내시면 되고, 그 외 숨겨진 비용은 없습니다. 다만 손님에게 드리는 경품·쿠폰 비용은 매장에서 직접 정하시는 부분이라 별도입니다.`,
  },
  {
    q: '경품/쿠폰 값은 누가 부담해요? 제가 손해 보는 구조 아니에요?',
    a: '손님이 실제로 매장에 재방문해서 혜택을 써야만 비용이 나갑니다. 게임 참여 100명 중 실제로 재방문한 손님이 12명이라면, 그 12명에게 나간 비용보다 그 손님들이 매장에서 쓴 돈이 더 큽니다. 손님이 안 오면 매장은 한 푼도 쓰지 않습니다.',
  },
  {
    q: '계약 기간이 있나요? 마음에 안 들면 언제든 그만둘 수 있어요?',
    a: '네, 언제든 해지 가능하고 위약금도 없습니다.',
  },
  {
    q: '손님들이 귀찮아하지 않을까요? 오히려 불편해하는 거 아니에요?',
    a: '로그인 없이 QR만 찍으면 바로 게임이 시작돼서, 참여 장벽이 거의 없습니다. 결과를 확인할 때만 카카오 로그인 한 번 하면 됩니다.',
  },
  {
    q: '게임이 뭔지 손님들이 이해 못 하면 어떡해요? 설명해줘야 하나요?',
    a: '인형뽑기 게임은 남녀노소 누구나 직관적으로 아는 방식이라 별도 설명이 필요 없습니다. 화면 안내만 따라가면 됩니다.',
  },
  {
    q: '손님이 스마트폰 없거나 나이 드신 분들은 어떻게 해요?',
    a: '스마트폰이 없는 손님은 참여가 어려운 게 사실입니다. 다만 QR 게임과 별개로 매장 자체 프로모션(스탬프 카드 등)을 병행하시는 것도 방법입니다.',
  },
  {
    q: '한 사람이 여러 번 게임해서 계속 공짜로 받아가는 거 아니에요?',
    a: '하루 1회 참여로 제한되어 있고, 쿠폰 사용 기간을 재방문시 사용 가능하게 합니다. 쿠폰이 많다는 건 우리 매장에 많이 방문한 단골 고객이며 재방문 매출 발생은 업장에 무조건 매출 상승효과를 발생시킵니다.',
  },
  {
    q: '직원이 실수로 잘못 눌러서 손해 보면 어떡해요?',
    a: '계산대 검증 화면에서 쿠폰 코드를 조회해 확인 후 사용 처리하는 구조라, 실수로 중복 사용되거나 잘못 지급되는 걸 방지합니다.',
  },
  {
    q: '세팅하는 데 얼마나 걸려요? 저 혼자 할 수 있어요?',
    a: '신청 후 입금 확인되면 24시간 내로 세팅을 도와드립니다. 복잡한 앱 설치나 어려운 세팅 없이, QR 하나로 시작하는 구조입니다.',
  },
  {
    q: 'QR 코드는 어떻게 받아요? 프린트해서 붙이면 되는 건가요?',
    a: '세팅 완료 시 매장 전용 QR 인쇄물을 택배로 보내드립니다. 택배 받은 후 테이블에 붙여두시면 바로 사용 가능합니다.',
  },
  {
    q: '직원들이 새로 배워야 할 게 많나요? 계산대에서 뭘 해야 해요?',
    a: '손님이 보여주는 쿠폰 화면의 코드 밑에 "사장님 확인" 버튼을 누른 후 쿠폰 내용에 대한 할인이나 상품을 제공해주시면 됩니다.',
  },
  {
    q: '진짜 재방문율이 오르는지 어떻게 확인해요? 그냥 하는 말 아니에요?',
    a: '관리자 대시보드에서 게임 참여, 쿠폰 사용, 재방문 횟수, 재방문율까지 실제 데이터로 직접 확인하실 수 있습니다.',
  },
  {
    q: '저희 업종(예: 미용실/병원)에도 잘 맞아요? 식당용 아니에요?',
    a: '네, 손님이 다시 찾아올 수 있는 업종이라면 어디든 적용 가능합니다. 카페, 음식점은 물론이고 미용실, 병원·한의원, 운동·필라테스, 학원·교습소, 세탁소, 정육점, 반려동물샵까지 — QR 하나로 시작하는 구조라 업종을 가리지 않습니다. "우리 업종엔 안 맞을 것 같다"고 생각하신다면, 오히려 그 업종일수록 재방문 유도 장치가 없어서 더 큰 효과를 보시는 경우가 많습니다.',
  },
  {
    q: '지금 신청하면 바로 상담되나요?',
    a: '신청 폼 제출 즉시 입금 안내를 받으실 수 있어 별도 상담을 기다릴 필요가 없습니다. 세팅 중 궁금하신 점은 카카오톡으로 편하게 문의해 주세요.',
  },
] as const

export function formatWon(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

export function formatMonthlyPrice(value: number) {
  return `월 ${value.toLocaleString('ko-KR')}원`
}
