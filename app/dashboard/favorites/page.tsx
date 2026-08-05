import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CoachCard, { type CoachCardData } from '@/components/coaches/CoachCard'

export const metadata = { title: 'Your Favorites — CoachNest' }
export const dynamic = 'force-dynamic'

type FavoriteRow = {
  coach_id: string
  coach_profiles: (CoachCardData & { is_published: boolean; is_suspended: boolean }) | null
}

export default async function FavoritesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/dashboard/favorites')

  const { data } = await supabase
    .from('favorites')
    .select(`
      coach_id,
      coach_profiles!favorites_coach_id_fkey (
        id, sport, hourly_rate, location, years_experience, verification_status, created_at,
        is_published, is_suspended,
        profiles!coach_profiles_id_fkey ( full_name, avatar_url ),
        reviews ( rating )
      )
    `)
    .eq('user_id', user.id)

  const rows = (data ?? []) as unknown as FavoriteRow[]
  const coaches = rows
    .map((row) => row.coach_profiles)
    .filter((coach): coach is NonNullable<FavoriteRow['coach_profiles']> =>
      Boolean(coach && coach.is_published && !coach.is_suspended),
    )

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your favorites</h1>
          <p className="mt-1 text-sm text-gray-500">Coaches you&apos;ve saved for later.</p>
        </div>

        {coaches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-base font-medium text-gray-700">No favorites yet.</p>
            <p className="mt-1 text-sm text-gray-500">
              Browse coaches and tap the heart to save your favorites.
            </p>
            <Link
              href="/coaches"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Find coaches →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
