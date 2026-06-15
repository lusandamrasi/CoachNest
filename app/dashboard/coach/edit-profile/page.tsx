import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/layout/DashboardNav'
import ProfileForm from '@/components/coach/ProfileForm'

export const metadata = { title: 'Edit Profile — CoachNest' }

export default async function EditProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'coach') redirect('/dashboard/client')

  const { data: coach } = await supabase
    .from('coach_profiles')
    .select('sport, bio, hourly_rate, location, years_experience, intro_video_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        fullName={profile?.full_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        profileHref="/dashboard/coach/profile"
      />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">Coach</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Edit your profile</h1>
          <p className="mt-2 text-gray-500">
            Keep your details up to date so the right clients can find you.
          </p>
        </div>

        <ProfileForm
          userId={user.id}
          initial={{
            full_name: profile?.full_name ?? null,
            avatar_url: profile?.avatar_url ?? null,
            sport: coach?.sport ?? null,
            bio: coach?.bio ?? null,
            hourly_rate: coach?.hourly_rate ?? null,
            location: coach?.location ?? null,
            years_experience: coach?.years_experience ?? null,
            intro_video_url: coach?.intro_video_url ?? null,
          }}
        />
      </main>
    </div>
  )
}
