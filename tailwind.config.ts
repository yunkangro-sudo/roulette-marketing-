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
      },
      fontFamily: {
        suit: ['SUIT Variable', 'Pretendard Variable', 'sans-serif'],
        pretendard: ['Pretendard Variable', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
