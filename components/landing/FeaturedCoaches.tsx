import { Star, Users } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Link from 'next/link'

const MOCK_COACHES = [
  {
    name: 'Sarah Mitchell',
    sport: 'Tennis',
    location: 'New York, NY',
    rating: 4.9,
    sessions: 312,
    hourly_rate: 85,
    avatar_bg: 'from-orange-400 to-pink-500',
    initials: 'SM',
    badge: 'Top Rated',
  },
  {
    name: 'Marcus Johnson',
    sport: 'Basketball',
    location: 'Los Angeles, CA',
    rating: 4.8,
    sessions: 228,
    hourly_rate: 70,
    avatar_bg: 'from-blue-500 to-indigo-600',
    initials: 'MJ',
    badge: 'Pro Coach',
  },
  {
    name: 'Priya Sharma',
    sport: 'Yoga',
    location: 'Austin, TX',
    rating: 5.0,
    sessions: 445,
    hourly_rate: 60,
    avatar_bg: 'from-purple-400 to-indigo-500',
    initials: 'PS',
    badge: 'New',
  },
]

export default function FeaturedCoaches() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-blue-600">Hand-picked</span>
            <h2 className="mt-2 text-4xl font-bold text-gray-900">Featured Coaches</h2>
          </div>
          <Link href="/coaches" className="hidden text-sm font-medium text-blue-600 hover:underline md:block">
            View all coaches →
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_COACHES.map((coach) => (
            <div
              key={coach.name}
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              {/* Avatar + badge */}
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${coach.avatar_bg} text-xl font-bold text-white`}
                >
                  {coach.initials}
                </div>
                <Badge variant={coach.badge === 'Top Rated' ? 'blue' : coach.badge === 'Pro Coach' ? 'green' : 'gray'}>
                  {coach.badge}
                </Badge>
              </div>

              {/* Info */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900">{coach.name}</h3>
                <p className="text-sm text-gray-500">{coach.sport} · {coach.location}</p>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-amber-500 font-medium">
                  <Star className="h-4 w-4 fill-current" />
                  {coach.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <Users className="h-4 w-4" />
                  {coach.sessions} sessions
                </span>
              </div>

              {/* Footer */}
              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-sm text-gray-500">
                  From <span className="text-base font-bold text-gray-900">${coach.hourly_rate}</span>/hr
                </span>
                <Button variant="outline" size="sm">View Profile</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/coaches">
            <Button variant="outline">View All Coaches</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
