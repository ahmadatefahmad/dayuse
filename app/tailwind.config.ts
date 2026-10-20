import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#0D1B2A',
        coral:   '#E8634A',
        teal:    '#2BBFA4',
        sand:    '#E8D5B0',
        'grey-50':  '#F8F9FA',
        'grey-100': '#F0F2F4',
        'grey-300': '#C8CDD4',
        'grey-500': '#7A8694',
        'grey-700': '#3D4855',
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'serif'],
        inter:    ['var(--font-inter)', 'sans-serif'],
      },
      keyframes: {
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
      },
      animation: {
        'sheet-up': 'sheet-up 220ms ease-out',
      },
    },
  },
  plugins: [],
}
export default config
