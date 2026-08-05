import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-24 text-center">
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-200 opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-200 opacity-30 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
          About CoachNest
        </span>
        <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl">
          Built for coaches. <span className="text-blue-600">Trusted</span> by athletes.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          CoachNest gives independent sports coaches and personal trainers a professional business
          page to showcase their skills and win more clients — and gives athletes, parents,
          schools, and clubs a simple, trusted way to book them.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/auth/signup">
            <Button size="lg" className="px-8">
              Become a Coach — It&apos;s Free
            </Button>
          </Link>
          <Link href="/coaches">
            <Button variant="outline" size="lg" className="px-8">
              Find a Coach
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-400">Free to get started · No credit card required</p>
      </div>
    </section>
  )
}
