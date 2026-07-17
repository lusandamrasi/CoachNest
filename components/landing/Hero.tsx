import Link from 'next/link'
import Button from '@/components/ui/Button'

const SPORTS_GRID = [
  '🎾', '🏀', '🧘', '⛳', '⚽', '🏊', '🥊', '🏋️',
  '🏐', '🏒', '🎿', '🤸', '🏄', '🚴', '🎯', '🏇',
  '🤺', '🏸', '🏓', '🥋',
]

export default function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Animated emoji grid background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-10">
        <div className="animate-scroll-slow flex flex-wrap gap-8 p-8 text-4xl">
          {[...SPORTS_GRID, ...SPORTS_GRID, ...SPORTS_GRID].map((emoji, i) => (
            <span key={i} className="select-none">{emoji}</span>
          ))}
        </div>
      </div>

      {/* Blue blob */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-200 opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-200 opacity-30 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
          Better Coaches.
          <br />
          Stronger Athletes.
          <br />
          One{' '}
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            Nest.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
          Connect with certified coaches in tennis, basketball, yoga, golf and more.
          Book 1-on-1 sessions tailored to your goals.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/coaches">
            <Button size="lg" className="px-8 shadow-lg shadow-blue-200">
              Find a Coach
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline" size="lg" className="px-8">
              Become a Coach
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-400">Free to get started · No credit card required</p>
      </div>
    </section>
  )
}
