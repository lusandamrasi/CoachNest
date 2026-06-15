'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Star, Search, Calendar, ChevronRight } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CoachCard, { type Coach } from '@/components/booking/CoachCard' 

const SPORTS = [
  'All Sports', 'Tennis', 'Football', 'Basketball', 'Swimming',
  'Running', 'Cycling', 'Golf', 'Boxing', 'Yoga', 'Pilates', 'Cricket'
]


export default function FindCoachPage() {
  const router = useRouter()
  const supabase = createClient()

  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState('')
  const [sport, setSport] = useState('All Sports')
  const [date, setDate] = useState('')

  const fetchCoaches = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('coach_profiles')
      .select(`
        id,
        sport,
        bio,
        hourly_rate,
        location,
        years_experience,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('is_published', true)

    if (sport && sport !== 'All Sports') {
      query = query.ilike('sport', `%${sport}%`)
    }

    if (location.trim()) {
      query = query.ilike('location', `%${location.trim()}%`)
    }

    // If date selected, filter coaches who have availability on that day_of_week
    if (date) {
      const dayOfWeek = new Date(date + 'T00:00:00').getDay()
      const { data: availableCoachIds } = await supabase
        .from('availability')
        .select('coach_id')
        .eq('day_of_week', dayOfWeek)

      const ids = availableCoachIds?.map((a) => a.coach_id) ?? []
      if (ids.length === 0) {
        setCoaches([])
        setLoading(false)
        return
      }
      query = query.in('id', ids)
    }

    const { data, error } = await query.order('hourly_rate', { ascending: true })

    if (!error && data) setCoaches(data as unknown as Coach[])
    setLoading(false)
  }, [location, sport, date])

  useEffect(() => {
    fetchCoaches()
  }, [fetchCoaches])

  const handleBook = (coachId: string) => {
    router.push(`/booking/${coachId}`)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-gray-50">
      <Navbar />
      {/* Search bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Location */}
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 bg-gray-50"
              />
            </div>

            {/* Sport */}
            <div className="relative sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-blue-400 bg-gray-50 appearance-none"
              >
                {SPORTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="relative sm:w-48">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-blue-400 bg-gray-50"
              />
            </div>

            {(location || sport !== 'All Sports' || date) && (
              <button
                onClick={() => { setLocation(''); setSport('All Sports'); setDate('') }}
                className="text-sm text-gray-400 hover:text-gray-600 whitespace-nowrap px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-gray-900">
            {loading ? 'Finding coaches…' : `${coaches.length} coach${coaches.length !== 1 ? 'es' : ''} available`}
          </h1>
          {date && !loading && (
            <span className="text-sm text-gray-400">
              Available on {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
            ))}
          </div>
        ) : coaches.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium text-gray-500">No coaches found</p>
            <p className="text-sm mt-1">Try adjusting your filters or clearing the date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} onBook={handleBook} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
