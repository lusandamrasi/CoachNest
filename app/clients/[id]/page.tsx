import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronLeft, MapPin, Mail, Phone, Globe2,
  Star, Users, BookOpen, Languages, Calendar, Clock,
} from 'lucide-react'
import Card from '@/components/ui/Card'

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(t: string) {
  const [h, m] = t.split(':')
  const h12 = parseInt(h) % 12 || 12
  return `${h12}:${m} ${parseInt(h) < 12 ? 'AM' : 'PM'}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-ZA', {
    weekday: 'short', month: 'short', day: 'numeric',
    timeZone: 'Africa/Johannesburg',
  })
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-600' },
  confirmed: { label: 'Confirmed', className: 'bg-green-50 text-green-600' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-500' },
  review: { label: 'Completed', className: 'bg-gray-100 text-gray-500' },
  'completed-unpaid': { label: 'Completed — Unpaid', className: 'bg-orange-50 text-orange-600' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-500' },
}

export default async function ClientProfileView({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: viewerProfile },
    { data: profile },
    { data: client },
    { data: bookings },
    { data: clientStats },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, full_name, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('profiles')
      .select('full_name, avatar_url, role, created_at')
      .eq('id', params.id)
      .single(),
    supabase
      .from('client_profiles')
      .select(`
        bio, location, travel_radius_km, is_parent, age,
        preferred_sports, languages_spoken, experience_levels, coaching_types,
        email, phone_number, rating
      `)
      .eq('id', params.id)
      .single(),
    supabase
      .from('bookings')
      .select(`
        id, date, start_time, end_time, status, paid,
        rating, coaches_report, student_attended,
        coach_profiles (
          sport,
          profiles ( full_name )
        )
      `)
      .eq('student_id', params.id)
      .in('status', ['completed', 'completed-unpaid', 'cancelled']) // Filter by specific statuses
      .order('date', { ascending: false })
      .limit(5),
    supabase
      .from('bookings')
      .select('id, status, paid')
      .eq('student_id', params.id),
  ])

  if (!profile || profile.role !== 'client') notFound()

  const isAdmin = viewerProfile?.role === 'admin'

  const dashboardHref =
    viewerProfile?.role === 'coach' ? '/dashboard/coach' :
      viewerProfile?.role === 'admin' ? '/dashboard/admin' :
        '/dashboard/client'

  const name = profile.full_name ?? 'Client'
  const avatarUrl = profile.avatar_url ?? null

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-ZA', {
      month: 'long', year: 'numeric',
    })
    : null

  const preferredSports: string[] = (client?.preferred_sports as string[] | null) ?? []
  const languages: string[] = (client?.languages_spoken as string[] | null) ?? []
  const experienceLevels: string[] = (client?.experience_levels as string[] | null) ?? []
  const coachingTypes: string[] = (client?.coaching_types as string[] | null) ?? []

  const totalSessions = clientStats?.length ?? 0
  const completedSessions = clientStats?.filter((b) =>
    ['completed', 'completed-unpaid', 'review'].includes(b.status)
  ).length ?? 0
  const unpaidSessions = isAdmin
    ? clientStats?.filter((b) =>
      !b.paid && b.status !== 'cancelled' && b.status !== 'pending'
    ).length ?? 0
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 space-y-6">

        {/* Back */}
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {/* Profile header */}
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

            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                {memberSince && (
                  <p className="text-xs text-gray-400 mt-0.5">Member since {memberSince}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                {client?.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {client.location}
                  </span>
                )}
                {client?.age != null && (
                  <span>{client.age} yrs</span>
                )}
                {client?.is_parent && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Booking for a child
                  </span>
                )}
                {client?.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {client.email}
                  </span>
                )}
                {client?.phone_number && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {client.phone_number}
                  </span>
                )}
                {client?.travel_radius_km != null && client.travel_radius_km > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe2 className="h-4 w-4 text-gray-400" />
                    Within {client.travel_radius_km}km
                  </span>
                )}
              </div>

              {/* Star rating */}
              {client?.rating != null && (
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < (client.rating ?? 0)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-gray-200 text-gray-200'
                        }`}
                    />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">{client.rating}/5</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className={`grid gap-4 ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <Card padding="lg">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Sessions</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalSessions}</p>
          </Card>
          <Card padding="lg">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{completedSessions}</p>
          </Card>
          {isAdmin && (
            <Card padding="lg">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Unpaid</p>
              <p className={`text-3xl font-bold mt-1 ${(unpaidSessions ?? 0) > 0 ? 'text-orange-500' : 'text-gray-900'}`}>
                {unpaidSessions}
              </p>
            </Card>
          )}
        </div>

        {/* Bio */}
        {client?.bio?.trim() && (
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-gray-900">About</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{client.bio}</p>
          </Card>
        )}

        {/* Preferences */}
        {(preferredSports.length > 0 ||
          experienceLevels.length > 0 ||
          coachingTypes.length > 0 ||
          languages.length > 0) && (
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                {preferredSports.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      <Star className="h-4 w-4 text-gray-400" /> Preferred sports
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {preferredSports.map((t) => (
                        <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {experienceLevels.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      <Users className="h-4 w-4 text-gray-400" /> Experience levels
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {experienceLevels.map((t) => (
                        <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {coachingTypes.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      <BookOpen className="h-4 w-4 text-gray-400" /> Coaching types
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {coachingTypes.map((t) => (
                        <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {languages.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      <Languages className="h-4 w-4 text-gray-400" /> Languages
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {languages.map((t) => (
                        <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

        {/* Recent sessions */}
        {bookings && bookings.length > 0 && (
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
            <div className="mt-4 divide-y divide-gray-100">
              {bookings.map((booking) => {
                const statusConfig = STATUS_LABELS[booking.status] ?? {
                  label: booking.status,
                  className: 'bg-gray-100 text-gray-500',
                }
                const coachProfile = booking.coach_profiles as unknown as {
                  sport: string | null
                  profiles: { full_name: string | null } | null
                } | null
                const coachName = coachProfile?.profiles?.full_name ?? 'Coach'
                const sport = coachProfile?.sport ?? null

                return (
                  <div key={booking.id} className="py-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-800">{coachName}</p>
                        {sport && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {sport}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {isAdmin && (
                          booking.paid ? (
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              Paid
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                              Unpaid
                            </span>
                          )
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(booking.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                      </span>
                      {booking.student_attended !== null && (
                        <span className={`flex items-center gap-1 ${booking.student_attended ? 'text-green-600' : 'text-red-500'}`}>
                          {booking.student_attended ? '✓ Attended' : '✗ No-show'}
                        </span>
                      )}
                    </div>

                    {booking.rating != null && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < booking.rating!
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200'
                              }`}
                          />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">Coach&apos;s rating</span>
                      </div>
                    )}

                    {booking.coaches_report && (
                      <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2">
                        &quot;{booking.coaches_report}&quot;
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

      </main>
    </div>
  )
}