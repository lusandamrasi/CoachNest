import Link from 'next/link'
import { Star, MapPin, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const SPORTS = ['All', 'Tennis', 'Basketball', 'Yoga', 'Golf', 'Soccer', 'Swimming', 'Boxing'] as const
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

type CoachRow = {
  id: string
  sport: string | null
  hourly_rate: number | null
  location: string | null
  years_experience: number | null
  verification_status: string | null
  experience_levels: string[] | null
  profiles: { full_name: string | null; avatar_url: string | null } | null
  reviews: { rating: number | null }[] | null
}

function initials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function readMulti(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value
  if (!value) return []
  return value.split(',').filter(Boolean)
}

export default async function CoachesListingPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const sport = readParam(searchParams.sport) || 'All'
  const location = readParam(searchParams.location)
  const experience = readMulti(searchParams.experience)
  const minPrice = readParam(searchParams.min)
  const maxPrice = readParam(searchParams.max)

  const supabase = createClient()

  let query = supabase
    .from('coach_profiles')
    .select(`
      id, sport, hourly_rate, location, years_experience,
      verification_status, experience_levels,
      profiles!coach_profiles_id_fkey ( full_name, avatar_url ),
      reviews ( rating )
    `)
    .eq('is_published', true)
    .eq('is_suspended', false)

  if (sport && sport !== 'All') query = query.ilike('sport', sport)
  if (location.trim()) query = query.ilike('location', `%${location.trim()}%`)
  if (experience.length > 0) query = query.overlaps('experience_levels', experience)
  if (minPrice) {
    const min = Number(minPrice)
    if (!Number.isNaN(min)) query = query.gte('hourly_rate', min)
  }
  if (maxPrice) {
    const max = Number(maxPrice)
    if (!Number.isNaN(max)) query = query.lte('hourly_rate', max)
  }

  const { data } = await query.order('hourly_rate', { ascending: true })
  const coaches = (data ?? []) as unknown as CoachRow[]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Find a coach</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse verified coaches near you and book your next session.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filter sidebar */}
          <aside>
            <details open className="lg:hidden mb-3">
              <summary className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                Filters
              </summary>
            </details>

            <form method="get" className="lg:sticky lg:top-24">
              <Card padding="md">
                <h2 className="text-sm font-semibold text-gray-900">Filter</h2>

                <div className="mt-5 space-y-5">
                  <div>
                    <label htmlFor="sport" className="text-xs font-medium text-gray-700">
                      Sport
                    </label>
                    <select
                      id="sport"
                      name="sport"
                      defaultValue={sport}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    >
                      {SPORTS.map((s) => (
                        <option key={s} value={s}>
                          {s === 'All' ? 'All sports' : s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location" className="text-xs font-medium text-gray-700">
                      Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      defaultValue={location}
                      placeholder="City or area"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-1 text-[11px] italic text-gray-400">
                      Google Maps integration coming soon — search by city or area for now
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-700">Experience level</p>
                    <div className="mt-2 space-y-1.5">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <label key={level} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            name="experience"
                            value={level}
                            defaultChecked={experience.includes(level)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          {level}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-700">Price range (ZAR)</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          R
                        </span>
                        <input
                          type="number"
                          name="min"
                          min={0}
                          defaultValue={minPrice}
                          placeholder="Min"
                          className="w-full rounded-lg border border-gray-300 pl-6 pr-2 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <span className="text-xs text-gray-400">–</span>
                      <div className="relative flex-1">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          R
                        </span>
                        <input
                          type="number"
                          name="max"
                          min={0}
                          defaultValue={maxPrice}
                          placeholder="Max"
                          className="w-full rounded-lg border border-gray-300 pl-6 pr-2 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Button type="submit" size="sm" className="w-full">
                    Apply Filters
                  </Button>
                  <Link
                    href="/coaches"
                    className="block text-center text-xs font-medium text-gray-500 hover:text-blue-600"
                  >
                    Clear all
                  </Link>
                </div>
              </Card>
            </form>
          </aside>

          {/* Results */}
          <section>
            <p className="mb-4 text-sm text-gray-500">
              {coaches.length} coach{coaches.length !== 1 ? 'es' : ''} found
            </p>

            {coaches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                <p className="text-base font-medium text-gray-700">No coaches found.</p>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {coaches.map((coach) => {
                  const reviews = coach.reviews ?? []
                  const reviewCount = reviews.length
                  const avgRating =
                    reviewCount === 0
                      ? null
                      : reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviewCount

                  let verificationBadge: { label: string; classes: string } | null = null
                  if (coach.verification_status === 'verified') {
                    verificationBadge = {
                      label: 'Verified ✓',
                      classes: 'bg-green-100 text-green-700',
                    }
                  } else if (
                    coach.verification_status === 'pending' ||
                    coach.verification_status === 'id_verified' ||
                    coach.verification_status === 'qualification_verified'
                  ) {
                    verificationBadge = {
                      label: 'Pending',
                      classes: 'bg-gray-100 text-gray-600',
                    }
                  }

                  const name = coach.profiles?.full_name ?? 'Coach'

                  return (
                    <div
                      key={coach.id}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-blue-600">
                          {coach.profiles?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={coach.profiles.avatar_url}
                              alt={name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-base font-semibold text-white">
                              {initials(name)}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900 truncate">{name}</h3>
                            {verificationBadge && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${verificationBadge.classes}`}
                              >
                                {coach.verification_status === 'verified' && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                {verificationBadge.label}
                              </span>
                            )}
                          </div>
                          {coach.sport && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                              {coach.sport}
                            </span>
                          )}

                          <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500">
                            {coach.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                {coach.location}
                              </span>
                            )}
                            {coach.years_experience != null && (
                              <span>
                                {coach.years_experience} yr{coach.years_experience === 1 ? '' : 's'} experience
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-2 text-sm">
                          {avgRating !== null ? (
                            <>
                              <span className="flex items-center gap-1 text-amber-500 font-medium">
                                <Star className="h-4 w-4 fill-current" />
                                {avgRating.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({reviewCount})
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">New</span>
                          )}
                        </div>
                        <div className="text-sm">
                          {coach.hourly_rate != null ? (
                            <>
                              <span className="font-bold text-gray-900">R{coach.hourly_rate}</span>
                              <span className="text-xs text-gray-400">/hr</span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">Rate on request</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <Link href={`/coaches/${coach.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
