import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Search, CalendarDays } from 'lucide-react'
import AuthButton from '@/components/auth/AuthButton'
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
    href: '#',
    cta: 'Coming soon →',
    color: 'text-green-600 bg-green-50',
  },
]

export default async function ClientDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'coach') redirect('/dashboard/coach')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">C</span>
            <span className="font-bold text-gray-900">CoachNest</span>
          </Link>
          <AuthButton />
        </div>
      </header>

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
