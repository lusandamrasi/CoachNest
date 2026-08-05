import { type CoachCardData } from '@/components/coaches/CoachCard'
import FounderSignatureCard from '@/components/about/FounderSignatureCard'
import { createClient } from '@/lib/supabase/server'

export default async function OurStory() {
  const supabase = createClient()

  const { data: founder } = await supabase
    .from('coach_profiles')
    .select(`
      id,
      sport,
      hourly_rate,
      location,
      years_experience,
      verification_status,
      created_at,
      profiles!inner ( full_name, avatar_url ),
      reviews ( rating )
    `)
    .eq('profiles.full_name', 'David Passman')
    .eq('is_published', true)
    .limit(1)
    .maybeSingle()

  const founderCoach = founder as unknown as CoachCardData | null

  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Every coach deserves a professional page
          </h2>
          <p className="mt-5 text-gray-600">
            CoachNest was built on a simple belief: finding a qualified coach should be
            straightforward, and coaches who pour their time and expertise into their craft
            deserve a professional presence that helps them win more work — not just a listing
            buried in a directory.
          </p>
          <p className="mt-4 text-gray-600">
            That&apos;s why every coach on CoachNest gets their own profile page — a place to
            showcase qualifications, experience, and reputation the way a real business would,
            without needing to build a website or manage their own marketing. It&apos;s the
            credibility of a personal business page, combined with the visibility of a
            marketplace.
          </p>
          <p className="mt-4 text-gray-600">
            On the other side, clients get a secure, easy way to find a coach who&apos;s the right
            fit, without the friction and guesswork that usually comes with booking coaching
            services.
          </p>
        </div>

        {founderCoach && (
          <div className="mx-auto w-full max-w-sm lg:mx-0">
            <FounderSignatureCard coach={founderCoach} />
          </div>
        )}
      </div>
    </section>
  )
}
