import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Search, CalendarCheck, CalendarSearch, UserPen} from 'lucide-react'
import Card from '@/components/ui/Card'
import Link from 'next/link'
import ClientBookingCalendar from '@/components/client/ClientBookingCalendar'
import Greeting from '@/components/ui/Greeting'
import CartButton from '@/components/client/CartButton'

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
    icon: CalendarCheck,
    title: 'My Bookings',
    description: 'View your upcoming and past coaching sessions.',
    href: '/booking/my-bookings',
    cta: 'My bookings →',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: CalendarSearch,
    title: 'Find Sessions',
    description: 'Find your next session.',
    href: '/booking/find-session',
    cta: 'Find sessions →',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: UserPen,
    title: 'Change Your Profile',
    description: 'Let coaches know more about you.',
    href: '/client',
    cta: 'Change profile →',
    color: 'text-orange-600 bg-orange-50',
  },
]

export default async function ClientDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [UserEmail, setUserEmail] = useState<string | null>

  if (!user) redirect('/auth/login')


  useEffect(() => {
          async function load() {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return router.push('/auth/login')
              
              setUserEmail(user.email ?? null)

              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, role, avatar_url')
                .eq('id', user.id)
                .single()

              if (profile?.role === 'coach') redirect('/dashboard/coach')

              const { data: bookings } = await supabase
                .from('bookings')
                .select(`
                      id, date, start_time, end_time, status, paid, notes,
                      coach_profiles (
                        sport, hourly_rate, location,
                        profiles ( full_name, avatar_url )
                      )
                    `)
                .eq('student_id', user.id)
                .eq('status', 'confirmed')
                .order('date', { ascending: true })

                }
        load()
    }, [])
              
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-600">Client Dashboard</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              <Greeting fullName={profile?.full_name ?? null} fallback="there" />
            </h1>
            <p className="mt-2 text-gray-500">Find a coach and start training today.</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLACEHOLDER_CARDS.map((card) => (
            <Link key={card.title} href={card.href}>
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
            </Link>
          ))}
        </div>
        <ClientBookingCalendar UserEmail={UserEmail} bookings={(bookings ?? []) as unknown as Parameters<typeof ClientBookingCalendar>[0]['bookings']} />
      </main>
      

    </div>
  )
}
