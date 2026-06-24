import { Star } from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/server'

type CoachRow = {
  id: string
  hourly_rate: number | null
  location: string | null
  sport: string | null
  verification_status: string | null
  profiles: { full_name: string | null; avatar_url: string | null } | null
  reviews: { rating: number | null }[] | null
}

const AVATAR_GRADIENTS = [
  'from-orange-400 to-pink-500',
  'from-blue-500 to-indigo-600',
  'from-purple-400 to-indigo-500',
  'from-teal-400 to-emerald-500',
  'from-amber-400 to-orange-500',
]

function initials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function gradientFor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}

export default async function FeaturedCoaches() {
  const supabase = createClient()

  const { data } = await supabase
    .from('coach_profiles')
    .select(`
      id,
      sport,
      hourly_rate,
      location,
      verification_status,
      profiles!coach_profiles_id_fkey ( full_name, avatar_url ),
      reviews ( rating )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(3)

  const coaches = (data ?? []) as unknown as CoachRow[]

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
              {coaches.map((coach) => {
                const reviews = coach.reviews ?? []
                const reviewCount = reviews.length
                const avgRating =
                  reviewCount === 0
                    ? null
                    : reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviewCount

                let badgeLabel: string | null = null
                let badgeVariant: 'green' | 'blue' | 'gray' = 'gray'
                if (avgRating !== null && avgRating >= 4.8) {
                  badgeLabel = 'Top Rated'
                  badgeVariant = 'green'
                } else if (coach.verification_status === 'verified') {
                  badgeLabel = 'Pro Coach'
                  badgeVariant = 'blue'
                } else if (reviewCount === 0) {
                  badgeLabel = 'New'
                  badgeVariant = 'gray'
                }

                const name = coach.profiles?.full_name ?? 'Coach'

                return (
                  <div
                    key={coach.id}
                    className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientFor(
                          coach.id,
                        )} text-xl font-bold text-white overflow-hidden`}
                      >
                        {coach.profiles?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={coach.profiles.avatar_url}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials(name)
                        )}
                      </div>
                      {badgeLabel && <Badge variant={badgeVariant}>{badgeLabel}</Badge>}
                    </div>

                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                      <p className="text-sm text-gray-500">
                        {coach.sport ?? 'Coach'}
                        {coach.location ? ` · ${coach.location}` : ''}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-sm">
                      {avgRating !== null ? (
                        <>
                          <span className="flex items-center gap-1 text-amber-500 font-medium">
                            <Star className="h-4 w-4 fill-current" />
                            {avgRating.toFixed(1)}
                          </span>
                          <span className="text-gray-400">
                            {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">No reviews yet</span>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-sm text-gray-500">
                        {coach.hourly_rate != null ? (
                          <>
                            From <span className="text-base font-bold text-gray-900">R{coach.hourly_rate}</span>/hr
                          </>
                        ) : (
                          'Rate on request'
                        )}
                      </span>
                      <Link href={`/coaches/${coach.id}`}>
                        <Button variant="outline" size="sm">View Profile</Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
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
