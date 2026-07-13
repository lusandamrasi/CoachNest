import type { Config } from 'tailwindcss'

// Brand palette (poster): orange accent, navy ink, warm cream surfaces.
// `blue` and `indigo` are remapped so every existing utility class picks up
// the brand colors without touching component markup.
const brandOrange = {
  50: '#FCF3EA',
  100: '#F9E5D0',
  200: '#F3CBA1',
  300: '#EDB072',
  400: '#EE9448',
  500: '#EA7C2E',
  600: '#DD6B1E',
  700: '#BC5918',
  800: '#964716',
  900: '#7A3B15',
}

const brandNavy = {
  50: '#F2F4F8',
  100: '#E2E7F0',
  200: '#C5CEDF',
  300: '#9FACC7',
  400: '#7386AA',
  500: '#52658C',
  600: '#3D4E73',
  700: '#2F3D5C',
  800: '#253048',
  900: '#1E2A44',
}

// Navy-tinted neutrals with a warm cream light end (poster background)
const brandGray = {
  50: '#FAF7F2',
  100: '#F1EDE5',
  200: '#E3DED3',
  300: '#CEC8BB',
  400: '#8E94A5',
  500: '#6C7488',
  600: '#515C74',
  700: '#3B4763',
  800: '#2A3450',
  900: '#1E2A44',
}

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        blue: brandOrange,
        indigo: brandNavy,
        gray: brandGray,
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      animation: {
        'scroll-slow': 'scroll-slow 60s linear infinite',
      },
      keyframes: {
        'scroll-slow': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
