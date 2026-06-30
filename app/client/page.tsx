import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/layout/DashboardNav'
import ClientProfileForm from '@/components/client/ClientProfileForm'

export const metadata = { title: 'Edit Profile — CoachNest' }

export default async function EditClientProfilePage() {
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
      bio, location, location_lat, location_lng, travel_radius_km, is_parent,
      age, preferred_sports, languages_spoken, experience_levels, coaching_types,
      email, phone_number
    `)
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        fullName={profile?.full_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        profileHref="/dashboard/client"
        dashboardHref="/dashboard/client"
      />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">Client</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Edit your profile</h1>
          <p className="mt-2 text-gray-500">
            Keep this up to date so coaches understand who they&apos;re training.
          </p>
        </div>

        <ClientProfileForm
          userId={user.id}
          authEmail={user.email ?? null}
          initial={{
            full_name: profile?.full_name ?? null,
            avatar_url: profile?.avatar_url ?? null,
            bio: client?.bio ?? null,
            location: client?.location ?? null,
            location_lat: client?.location_lat != null ? Number(client.location_lat) : null,
            location_lng: client?.location_lng != null ? Number(client.location_lng) : null,
            travel_radius_km: client?.travel_radius_km ?? 0,
            is_parent: client?.is_parent ?? false,
            age: client?.age ?? null,
            preferred_sports: client?.preferred_sports ?? [],
            languages_spoken: client?.languages_spoken ?? [],
            experience_levels: client?.experience_levels ?? [],
            coaching_types: client?.coaching_types ?? [],
            email: client?.email ?? null,
            phone_number: client?.phone_number ?? null,
          }}
        />
      </main>
    </div>
  )
}
