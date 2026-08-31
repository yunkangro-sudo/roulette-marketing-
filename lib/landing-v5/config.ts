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
    setupFee: 250_000,
    badgeGold: '선착순 100개 한정',
    badgeGreen: '지금 시작하면',
    features: ['게임 이벤트 1개', '기본 쿠폰·포인트', '기본 고객 데이터'],
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
    q: '게임을 꼭 해야 하나요?',
    a: '아닙니다. 게임은 목적이 아니라, 고객이 자연스럽게 참여하도록 만드는 장치입니다.',
  },
  {
    q: '손님이 게임을 하고 실제로 다시 오나요?',
    a: '단골팅은 게임 참여자 수만 보지 않습니다. 쿠폰 사용, 2회 방문, 3회 방문, 30일 재방문율까지 추적하도록 설계되어 있습니다.',
  },
  {
    q: '손님이 게임을 귀찮아하지 않을까요?',
    a: '로그인 없이 바로 시작하는 게임이라, 참여 장벽이 거의 없습니다.',
  },
  {
    q: '매장 직원이 복잡하게 사용해야 하나요?',
    a: '아닙니다. 고객의 쿠폰 사용 가능 여부를 확인하고, 당근 단골 여부를 확인한 뒤 사용 처리하면 끝입니다.',
  },
  {
    q: '설치가 어렵나요?',
    a: 'QR 하나만 매장에 붙이면 됩니다. 별도 장비나 앱 설치가 필요 없습니다.',
  },
  {
    q: '개인정보는 어떻게 관리하나요?',
    a: '필요한 고객 동의 절차를 거쳐 최소한의 정보만 수집하며, 서비스 운영에 필요한 범위에서만 관리합니다.',
  },
  {
    q: '예산이 초과될 위험은 없나요?',
    a: '준비한 혜택 수량이 소진되면 자동으로 멈춥니다. 손님이 오지 않으면 비용도 나가지 않습니다.',
  },
  {
    q: '모든 업종에서 사용할 수 있나요?',
    a: '반복 방문이 매출과 직접 연결되는 업종부터 적합합니다. 카페, 음식점, 미용, 운동, 교육 등에서 특히 효과적입니다.',
  },
] as const

export function formatWon(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

export function formatMonthlyPrice(value: number) {
  return `월 ${value.toLocaleString('ko-KR')}원`
}
