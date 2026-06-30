import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  Globe2,
  Languages,
  Star,
  BookOpen,
  Users,
  Mail,
  Phone,
  ChevronLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Card from '@/components/ui/Card'
import DashboardNav from '@/components/layout/DashboardNav'

export const metadata = { title: 'Client Profile — CoachNest' }

function initials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default async function ClientProfileView({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: viewerProfile }, { data: profile }, { data: client }] = await Promise.all([
    supabase.from('profiles').select('role, full_name, avatar_url').eq('id', user.id).single(),
    supabase
      .from('profiles')
      .select('full_name, avatar_url, role')
      .eq('id', params.id)
      .single(),
    supabase
      .from('client_profiles')
      .select(`
        bio, location, travel_radius_km, is_parent, age,
        preferred_sports, languages_spoken, experience_levels, coaching_types,
        email, phone_number
      `)
      .eq('id', params.id)
      .single(),
  ])

  if (!profile || profile.role !== 'client') notFound()

  const dashboardHref =
    viewerProfile?.role === 'coach' ? '/dashboard/coach' : '/dashboard/client'

  const name = profile.full_name ?? 'Client'
  const avatarUrl = profile.avatar_url ?? null

  const preferredSports: string[] = (client?.preferred_sports as string[] | null) ?? []
  const languages: string[] = (client?.languages_spoken as string[] | null) ?? []
  const experienceLevels: string[] = (client?.experience_levels as string[] | null) ?? []
  const coachingTypes: string[] = (client?.coaching_types as string[] | null) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        fullName={viewerProfile?.full_name ?? null}
        avatarUrl={viewerProfile?.avatar_url ?? null}
        profileHref={dashboardHref}
        dashboardHref={dashboardHref}
      />

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <Link
          href={dashboardHref}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

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
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                {client?.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {client.location}
                  </span>
                )}
                {client?.age != null && <span>{client.age} yrs</span>}
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
                    Available within {client.travel_radius_km}km
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {client?.bio?.trim() && (
          <Card padding="lg" className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">About</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{client.bio}</p>
          </Card>
        )}

        {(preferredSports.length > 0 ||
          experienceLevels.length > 0 ||
          coachingTypes.length > 0 ||
          languages.length > 0) && (
          <Card padding="lg" className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {preferredSports.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Star className="h-4 w-4 text-gray-400" />
                    Preferred sports
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {preferredSports.map((t) => (
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
                    <Users className="h-4 w-4 text-gray-400" />
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
      </main>
    </div>
  )
}
