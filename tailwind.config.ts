import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,ts,js}',
    './app/components/**/*.{vue,ts,js}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0a',
        paper: '#ffffff',
        parchment: '#fafaf9',
        mute: {
          1: '#525252',
          2: '#737373',
          3: '#a3a3a3',
          4: '#d4d4d4',
          5: '#e5e5e5',
          6: '#f5f5f4',
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Satoshi', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        mega: ['clamp(4rem, 14vw, 14rem)', { lineHeight: '0.88', letterSpacing: '-0.045em' }],
        display: ['clamp(3rem, 8.5vw, 7rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        h1: ['clamp(2rem, 4.5vw, 3.75rem)', { lineHeight: '1.02', letterSpacing: '-0.025em' }],
      },
      letterSpacing: {
        tightest: '-0.05em',
        label: '0.14em',
      },
      maxWidth: {
        grid: '1440px',
      },
    },
  },
  plugins: [],
} satisfies Config
