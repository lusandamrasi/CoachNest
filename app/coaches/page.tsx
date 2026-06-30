import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FiltersSidebar from '@/components/coaches/FiltersSidebar'
import CoachesResults, { type CoachCardData } from '@/components/coaches/CoachesResults'

type CoachRow = {
  id: string
  sport: string | null
  hourly_rate: number | null
  location: string | null
  location_lat: number | string | null
  location_lng: number | string | null
  travel_radius_km: number | null
  years_experience: number | null
  verification_status: string | null
  experience_levels: string[] | null
  profiles: { full_name: string | null; avatar_url: string | null } | null
  reviews: { rating: number | null }[] | null
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function readMulti(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value
  if (!value) return []
  return value.split(',').filter(Boolean)
}

export default async function CoachesListingPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const sport = readParam(searchParams.sport) || 'All'
  const location = readParam(searchParams.location)
  const latParam = readParam(searchParams.lat)
  const lngParam = readParam(searchParams.lng)
  const name = readParam(searchParams.name)
  const experience = readMulti(searchParams.experience)
  const minPrice = readParam(searchParams.min)
  const maxPrice = readParam(searchParams.max)

  const searchLat = latParam ? Number(latParam) : NaN
  const searchLng = lngParam ? Number(lngParam) : NaN
  const hasCoords = Number.isFinite(searchLat) && Number.isFinite(searchLng)

  const supabase = createClient()

  let query = supabase
    .from('coach_profiles')
    .select(`
      id, sport, hourly_rate, location, location_lat, location_lng, travel_radius_km,
      years_experience, verification_status, experience_levels,
      profiles!coach_profiles_id_fkey ( full_name, avatar_url ),
      reviews ( rating )
    `)
    .eq('is_published', true)
    .eq('is_suspended', false)

  if (sport && sport !== 'All') query = query.ilike('sport', sport)
  if (experience.length > 0) query = query.overlaps('experience_levels', experience)
  if (minPrice) {
    const min = Number(minPrice)
    if (!Number.isNaN(min)) query = query.gte('hourly_rate', min)
  }
  if (maxPrice) {
    const max = Number(maxPrice)
    if (!Number.isNaN(max)) query = query.lte('hourly_rate', max)
  }

  const { data } = await query.order('hourly_rate', { ascending: true })
  let coaches = (data ?? []) as unknown as CoachRow[]

  const locationText = location.trim().toLowerCase()
  if (locationText || hasCoords) {
    coaches = coaches.filter((c) => {
      const textHit = locationText
        ? (c.location ?? '').toLowerCase().includes(locationText)
        : false
      let radiusHit = false
      if (hasCoords) {
        const coachLat =
          c.location_lat != null ? Number(c.location_lat) : NaN
        const coachLng =
          c.location_lng != null ? Number(c.location_lng) : NaN
        const radius = c.travel_radius_km ?? 0
        if (Number.isFinite(coachLat) && Number.isFinite(coachLng) && radius > 0) {
          const dist = haversineKm(coachLat, coachLng, searchLat, searchLng)
          radiusHit = dist <= radius
        }
      }
      return textHit || radiusHit
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Find a coach</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse verified coaches near you and book your next session.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filter sidebar */}
          <aside>
            <FiltersSidebar
              defaults={{
                sport,
                location,
                lat: hasCoords ? searchLat : null,
                lng: hasCoords ? searchLng : null,
                experience,
                minPrice,
                maxPrice,
              }}
            />
          </aside>

          <CoachesResults
            coaches={coaches as CoachCardData[]}
            initialQuery={name}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
