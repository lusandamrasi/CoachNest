import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarDays, ClipboardList, UserPen, ShieldCheck } from 'lucide-react'
import DashboardNav from '@/components/layout/DashboardNav'
import Card from '@/components/ui/Card'
import Link from 'next/link'
import BookingCalendar from '@/components/coach/BookingCalender'
import Greeting from '@/components/ui/Greeting'

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
    href: '/dashboard/coach/manage-availability',
    cta: 'Manage availability →',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: ClipboardList,
    title: 'View Bookings',
    description: 'See upcoming and past client bookings.',
    href: '/dashboard/coach/manage-booking',
    cta: 'View bookings →',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: ShieldCheck,
    title: 'Verification',
    description: 'Upload your ID and qualifications to become a verified coach.',
    href: '/dashboard/coach/verification',
    cta: 'Verify account →',
    color: 'text-amber-600 bg-amber-50',
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

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, date, start_time, end_time, status,
      profiles!bookings_student_id_fkey ( full_name, avatar_url )
    `)
    .eq('coach_id', user.id)
    .eq('status', 'confirmed')
    .order('date', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        fullName={profile?.full_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        profileHref="/dashboard/coach/profile"
      />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600">Coach Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            <Greeting fullName={profile?.full_name ?? null} fallback="Coach" />
          </h1>
          <p className="mt-2 text-gray-500">Here&apos;s an overview of your coaching hub.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Booking Calendar */}
        <BookingCalendar bookings={bookings ?? []} />

      </main>
    </div>
  )
}
