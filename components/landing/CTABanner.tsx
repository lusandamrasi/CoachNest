import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function CTABanner() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
          Are you a coach?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
          Join CoachNest for free. Build your profile, set your availability, and start earning today.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/auth/signup">
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8"
            >
              Join as a Coach — It&apos;s Free
            </Button>
          </Link>
          <Link href="/coaches">
            <Button
              size="lg"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8"
            >
              Find a Coach
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-blue-200">
         Join now · No setup fees
        </p>
      </div>
    </section>
  )
}
