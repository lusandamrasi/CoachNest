import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/layout/DashboardNav'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ProfileOverview from '@/components/coach/ProfileOverview'

export const metadata = { title: 'Your Profile — CoachNest' }

export default async function CoachProfilePage() {
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
    .select('sport, bio, hourly_rate, location, years_experience, intro_video_url, is_published, email, phone_number')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        fullName={profile?.full_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        profileHref="/dashboard/coach/profile"
        dashboardHref="/dashboard/coach"
      />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumb dashboardHref="/dashboard/coach" current="My Profile" />
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">Coach</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Your profile</h1>
          <p className="mt-2 text-gray-500">This is how clients will see you.</p>
        </div>

        <ProfileOverview
          fullName={profile?.full_name ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          sport={coach?.sport ?? null}
          bio={coach?.bio ?? null}
          hourlyRate={coach?.hourly_rate ?? null}
          location={coach?.location ?? null}
          yearsExperience={coach?.years_experience ?? null}
          introVideoUrl={coach?.intro_video_url ?? null}
          isPublished={coach?.is_published ?? false}
          email={coach?.email ?? user.email ?? null}
          phoneNumber={coach?.phone_number ?? null}
        />
      </main>
    </div>
  )
}
