import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#3D5AFE',
        success: '#1FC77A',
        ink: '#16181D',
        paper: '#FFFFFF',
        surface: '#F4F6F8',
        border: '#E4E8ED',
        'l-ink': '#14151A',
        'l-paper': '#FAFAF8',
        'kakao': '#FEE500',
        'danggeun': '#FF8A3D',
        dg: {
          green: '#00C7A7',
          'green-deep': '#019C87',
          'green-tint': '#E3FBF6',
          carrot: '#FF8A00',
          kakao: '#FEE500',
          ink: '#222222',
          'ink-soft': '#6B7280',
          bg: '#FAF7F0',
          cream: '#FFF3DE',
          gold: '#D9A94F',
          'gold-deep': '#B8862F',
          danger: '#E24C4C',
          line: '#E7E3D8',
        },
      },
      fontFamily: {
        han: ['"Black Han Sans"', 'sans-serif'],
        suit: ['SUIT Variable', 'Pretendard Variable', 'sans-serif'],
        pretendard: ['Pretendard Variable', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
