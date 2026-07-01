import { redirect } from 'next/navigation'
import {
  MapPin,
  Globe2,
  Languages,
  Star,
  BookOpen,
  Users,
  Mail,
  Phone,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Card from '@/components/ui/Card'
import DashboardNav from '@/components/layout/DashboardNav'
import ProfileHeaderCard from '@/components/ui/ProfileHeaderCard'

export const metadata = { title: 'Your Profile — CoachNest' }

export default async function ClientProfilePreviewPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'coach') redirect('/dashboard/coach')

  const { data: client } = await supabase
    .from('client_profiles')
    .select(`
      bio, location, travel_radius_km, is_parent, age,
      preferred_sports, languages_spoken, experience_levels, coaching_types,
      email, phone_number
    `)
    .eq('id', user.id)
    .single()

  const name = profile?.full_name ?? 'You'
  const avatarUrl = profile?.avatar_url ?? null

  const preferredSports: string[] = (client?.preferred_sports as string[] | null) ?? []
  const languages: string[] = (client?.languages_spoken as string[] | null) ?? []
  const experienceLevels: string[] = (client?.experience_levels as string[] | null) ?? []
  const coachingTypes: string[] = (client?.coaching_types as string[] | null) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        fullName={profile?.full_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        profileHref="/dashboard/client/profile"
        dashboardHref="/dashboard/client"
      />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">Client</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Your profile</h1>
          <p className="mt-2 text-gray-500">This is how coaches will see you.</p>
        </div>

        <div className="space-y-6">
          <ProfileHeaderCard
            fullName={name}
            avatarUrl={avatarUrl}
            badges={client?.is_parent ? [{ label: 'Booking for a child', variant: 'blue' }] : []}
            infoRows={[
              ...(client?.location ? [{ icon: <MapPin className="h-4 w-4 text-gray-400" />, text: client.location }] : []),
              ...(client?.age != null ? [{ icon: <Users className="h-4 w-4 text-gray-400" />, text: `${client.age} yrs` }] : []),
              ...(client?.email ? [{ icon: <Mail className="h-4 w-4 text-gray-400" />, text: client.email }] : []),
              ...(client?.phone_number ? [{ icon: <Phone className="h-4 w-4 text-gray-400" />, text: client.phone_number }] : []),
              ...(client?.travel_radius_km != null && client.travel_radius_km > 0
                ? [{ icon: <Globe2 className="h-4 w-4 text-gray-400" />, text: `Within ${client.travel_radius_km}km` }]
                : []),
            ]}
            editHref="/client"
          />

          <Card padding="lg">
            <h2 className="text-lg font-semibold text-gray-900">About</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
              {client?.bio?.trim() ? client.bio : 'No bio added yet.'}
            </p>
          </Card>

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
                      <Star className="h-4 w-4 text-gray-400" />
                      Preferred sports
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {preferredSports.map((t) => (
                        <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
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
                        <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
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
                        <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
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
                        <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
