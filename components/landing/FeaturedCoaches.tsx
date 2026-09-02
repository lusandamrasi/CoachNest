import Link from 'next/link'
import Button from '@/components/ui/Button'
import CoachCard, { type CoachCardData } from '@/components/coaches/CoachCard'
import { createClient } from '@/lib/supabase/server'

export default async function FeaturedCoaches() {
  const supabase = createClient()

  const { data } = await supabase
    .from('coach_profiles')
    .select(`
      id,
      sport,
      hourly_rate,
      location,
      years_experience,
      verification_status,
      id_document_url,
      created_at,
      profiles!coach_profiles_id_fkey ( full_name, avatar_url ),
      reviews ( rating )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(3)

  const coaches = (data ?? []) as unknown as CoachCardData[]

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-blue-600">Hand-picked</span>
            <h2 className="mt-2 text-4xl font-bold text-gray-900">Featured Coaches</h2>
          </div>
          {coaches.length > 0 && (
            <Link href="/coaches" className="hidden text-sm font-medium text-blue-600 hover:underline md:block">
              View all coaches →
            </Link>
          )}
        </div>

        {coaches.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
            <p className="text-base font-medium text-gray-600">
              Our coaches are coming soon. Check back shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((coach) => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link href="/coaches">
                <Button variant="outline">View All Coaches</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
