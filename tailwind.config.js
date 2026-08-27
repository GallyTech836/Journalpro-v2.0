/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0A0D12',
        surface: '#12151C',
        'surface-hi': '#171B24',
        border: '#232833',
        ink: '#EDEFF2',
        muted: '#7C8492',
        faint: '#4B525E',
        brand: {
          DEFAULT: '#6C6FF0',
          hover: '#7D80FF',
          dim: 'rgba(108,111,240,0.12)',
        },
        pos: '#22C55E',
        'pos-dim': 'rgba(34,197,94,0.12)',
        neg: '#F04747',
        'neg-dim': 'rgba(240,71,71,0.12)',
        warn: '#F5A524',
        'warn-dim': 'rgba(245,165,36,0.12)',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px -12px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
