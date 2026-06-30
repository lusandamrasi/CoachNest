import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/layout/DashboardNav'
import VerificationForm from '@/components/coach/VerificationForm'

export const metadata = { title: 'Verification — CoachNest' }

type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'id_verified'
  | 'qualification_verified'
  | 'verified'

export default async function VerificationPage() {
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
    .select('id_document_url, qualifications_url, declaration_accepted, verification_status')
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

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">Coach</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Verification</h1>
          <p className="mt-2 text-gray-500">
            Verified coaches get a trust badge that drives more bookings.
          </p>
        </div>

        <VerificationForm
          userId={user.id}
          initial={{
            id_document_url: coach?.id_document_url ?? null,
            qualifications_url: coach?.qualifications_url ?? [],
            declaration_accepted: coach?.declaration_accepted ?? false,
            verification_status: (coach?.verification_status as VerificationStatus) ?? 'unverified',
          }}
        />
      </main>
    </div>
  )
}
