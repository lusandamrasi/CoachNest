import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import {
  MapPin,
  Clock3,
  Star,
  Languages,
  Users,
  BookOpen,
  Globe2,
  CalendarPlus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import ReviewForm from '@/components/coach/ReviewForm'
import ReportCoachButton from '@/components/coach/ReportCoachButton'

type SessionPackage = { name: string; price: number }

type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'id_verified'
  | 'qualification_verified'
  | 'verified'

function initials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function CoachProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: coach } = await supabase
    .from('coach_profiles')
    .select(`
      id, sport, bio, hourly_rate, location, years_experience, intro_video_url,
      age_groups_coached, experience_levels, coaching_types, languages_spoken,
      session_packages, travel_radius_km, coaching_photos, verification_status,
      is_suspended, is_published,
      profiles!coach_profiles_id_fkey ( full_name, avatar_url )
    `)
    .eq('id', params.id)
    .single()

  if (!coach || coach.is_suspended || !coach.is_published) notFound()

  const profile = (coach.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null) ?? null
  const name = profile?.full_name ?? 'Coach'
  const avatarUrl = profile?.avatar_url ?? null

  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select(`
      id, rating, review_text, created_at,
      profiles!reviews_client_id_fkey ( full_name, avatar_url )
    `)
    .eq('coach_id', params.id)
    .order('created_at', { ascending: false })

  const reviews = (reviewsRaw ?? []) as unknown as {
    id: string
    rating: number | null
    review_text: string | null
    created_at: string
    profiles: { full_name: string | null; avatar_url: string | null } | null
  }[]

  const reviewCount = reviews.length
  const avgRating =
    reviewCount === 0
      ? null
      : reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviewCount

  const { data: { user } } = await supabase.auth.getUser()
  let viewerIsClient = false
  let viewerIsCoach = false
  if (user) {
    const { data: viewerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    viewerIsClient = viewerProfile?.role === 'client'
    viewerIsCoach = viewerProfile?.role === 'coach'
  }

  const packages = (coach.session_packages as SessionPackage[] | null) ?? []
  const ageGroups: string[] = (coach.age_groups_coached as string[] | null) ?? []
  const experienceLevels: string[] = (coach.experience_levels as string[] | null) ?? []
  const coachingTypes: string[] = (coach.coaching_types as string[] | null) ?? []
  const languages: string[] = (coach.languages_spoken as string[] | null) ?? []
  const photos: string[] = (coach.coaching_photos as string[] | null) ?? []
  const status = (coach.verification_status as VerificationStatus) ?? 'unverified'
  const isVerified = status === 'verified'

  const bookHref = viewerIsClient
    ? `/booking/${coach.id}`
    : `/auth/login?redirect=${encodeURIComponent(`/booking/${coach.id}`)}`

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        {/* Header card */}
        <Card padding="lg">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="h-[120px] w-[120px] flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-blue-600">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={120}
                  height={120}
                  className="h-[120px] w-[120px] object-cover"
                  unoptimized
                />
              ) : (
                <span className="flex h-[120px] w-[120px] items-center justify-center text-4xl font-semibold text-white">
                  {initials(name)}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                {coach.sport && <Badge variant="blue">{coach.sport}</Badge>}
                {isVerified && <Badge variant="green">✓ Verified Coach</Badge>}
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                {coach.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {coach.location}
                  </span>
                )}
                {coach.years_experience != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4 text-gray-400" />
                    {coach.years_experience} {coach.years_experience === 1 ? 'year' : 'years'} experience
                  </span>
                )}
                {avgRating !== null ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-medium">{avgRating.toFixed(1)}</span>
                    <span className="text-gray-400">
                      ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-400">No reviews yet</span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                {coach.hourly_rate != null ? (
                  <>
                    <span className="text-2xl font-bold text-gray-900">R{coach.hourly_rate}</span>
                    <span className="text-sm text-gray-500">/ hr</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">Rate on request</span>
                )}
                {coach.travel_radius_km != null && coach.travel_radius_km > 0 && (
                  <span className="ml-4 inline-flex items-center gap-1.5 text-sm text-gray-500">
                    <Globe2 className="h-4 w-4 text-gray-400" />
                    Available within {coach.travel_radius_km}km
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Book a Session */}
        {!viewerIsCoach && (
          <div className="mt-6">
            <Link
              href={bookHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <CalendarPlus className="h-4 w-4" />
              Book a Session
            </Link>
          </div>
        )}

        {/* About */}
        {coach.bio?.trim() && (
          <Card padding="lg" className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">About</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{coach.bio}</p>
          </Card>
        )}

        {/* Specialty grid */}
        {(coachingTypes.length > 0 ||
          ageGroups.length > 0 ||
          experienceLevels.length > 0 ||
          languages.length > 0) && (
          <Card padding="lg" className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">Coaching specialty</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {coachingTypes.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    Coaching types
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {coachingTypes.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ageGroups.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Users className="h-4 w-4 text-gray-400" />
                    Age groups
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ageGroups.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {experienceLevels.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Star className="h-4 w-4 text-gray-400" />
                    Experience levels
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {experienceLevels.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {languages.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Languages className="h-4 w-4 text-gray-400" />
                    Languages
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {languages.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Packages */}
        {packages.length > 0 && (
          <Card padding="lg" className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">Session packages</h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Package</th>
                    <th className="px-4 py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {packages.map((p, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-gray-700">{p.name}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">R{p.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Intro video */}
        {coach.intro_video_url && (
          <Card padding="lg" className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">Intro Video</h2>
            <video
              key={coach.intro_video_url}
              src={coach.intro_video_url}
              controls
              className="mt-4 aspect-video w-full rounded-xl border border-gray-200 bg-black"
            />
          </Card>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <Card padding="lg" className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">Coaching photos</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {photos.map((url) => (
                <div key={url} className="aspect-square overflow-hidden rounded-xl border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Coaching" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Reviews */}
        <Card padding="lg" className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>

          <div className="mt-4 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet — be the first!</p>
            ) : (
              reviews.map((r) => {
                const reviewerName = r.profiles?.full_name ?? 'Client'
                return (
                  <div
                    key={r.id}
                    className="rounded-xl border border-gray-100 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                        {initials(reviewerName)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{reviewerName}</p>
                        <p className="text-xs text-gray-400">{formatDate(r.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < (r.rating ?? 0) ? 'fill-current' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {r.review_text && (
                      <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{r.review_text}</p>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {viewerIsClient && user && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-900">Leave a review</h3>
              <div className="mt-3">
                <ReviewForm coachId={coach.id} clientId={user.id} />
              </div>
            </div>
          )}
        </Card>

        <div className="mt-8 flex justify-center">
          <ReportCoachButton coachId={coach.id} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
