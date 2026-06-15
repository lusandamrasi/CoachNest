import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Search, CalendarDays } from 'lucide-react'
import DashboardNav from '@/components/layout/DashboardNav'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export const metadata = { title: 'Client Dashboard — CoachNest' }

const PLACEHOLDER_CARDS = [
  {
    icon: Search,
    title: 'Find a Coach',
    description: 'Browse verified coaches by sport, location, and price.',
    href: '/coaches',
    cta: 'Browse Coaches →',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: CalendarDays,
    title: 'My Bookings',
    description: 'View your upcoming and past coaching sessions.',
    href: '/booking/my-booking',
    cta: 'My bookings →',
    color: 'text-green-600 bg-green-50',
  },
]

export default async function ClientDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'coach') redirect('/dashboard/coach')

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        fullName={profile?.full_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        profileHref="/dashboard/client"
      />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-medium text-blue-600">Client Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="mt-2 text-gray-500">Find a coach and start training today.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {PLACEHOLDER_CARDS.map((card) => (
            <Card key={card.title} className="group transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{card.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{card.description}</p>
              <div className="mt-4">
                <Link href={card.href} className="text-sm font-medium text-blue-600 group-hover:underline">
                  {card.cta}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
