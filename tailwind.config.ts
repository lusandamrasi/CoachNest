import type { Config } from 'tailwindcss'

const config: Config = {
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
