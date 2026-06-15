import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarDays, ClipboardList, UserPen, AlertTriangle } from 'lucide-react'
import DashboardNav from '@/components/layout/DashboardNav'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export const metadata = { title: 'Coach Dashboard — CoachNest' }

const PLACEHOLDER_CARDS = [
  {
    icon: UserPen,
    title: 'Edit Profile',
    description: 'Update your sport, bio, rates, and intro video.',
    href: '/dashboard/coach/edit-profile',
    cta: 'Open editor →',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: CalendarDays,
    title: 'Manage Availability',
    description: 'Set the days and times you are available for sessions.',
    href: '#',
    cta: 'Coming soon →',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: ClipboardList,
    title: 'View Bookings',
    description: 'See upcoming and past client bookings.',
    href: '#',
    cta: 'Coming soon →',
    color: 'text-purple-600 bg-purple-50',
  },
]

export default async function CoachDashboard() {
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
    .select('intro_video_url')
    .eq('id', user.id)
    .single()

  const needsVideo = !coach?.intro_video_url

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        fullName={profile?.full_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        profileHref="/dashboard/coach/profile"
      />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600">Coach Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Coach'} 👋
          </h1>
          <p className="mt-2 text-gray-500">Here&apos;s an overview of your coaching hub.</p>
        </div>

        {needsVideo && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm">
                <span className="font-semibold">Complete your profile</span> — add an intro video so clients can find you.
              </p>
            </div>
            <Link
              href="/dashboard/coach/edit-profile"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              Add Now →
            </Link>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDER_CARDS.map((card) => {
            const inner = (
              <Card className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{card.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{card.description}</p>
                <div className="mt-4">
                  <span className="text-sm font-medium text-blue-600 group-hover:underline">
                    {card.cta}
                  </span>
                </div>
              </Card>
            )
            return card.href === '#' ? (
              <div key={card.title}>{inner}</div>
            ) : (
              <Link key={card.title} href={card.href}>
                {inner}
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
