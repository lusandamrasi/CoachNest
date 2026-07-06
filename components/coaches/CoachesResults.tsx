'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, X, Star, MapPin, CheckCircle2, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'

export type CoachCardData = {
  id: string
  sport: string | null
  hourly_rate: number | null
  location: string | null
  years_experience: number | null
  verification_status: string | null
  created_at: string | null
  profiles: { full_name: string | null; avatar_url: string | null } | null
  reviews: { rating: number | null }[] | null
}

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

function isNewCoach(createdAt: string | null): boolean {
  if (!createdAt) return false
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created <= NEW_WINDOW_MS
}

function initials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface CoachesResultsProps {
  coaches: CoachCardData[]
  initialQuery: string
}

export default function CoachesResults({ coaches, initialQuery }: CoachesResultsProps) {
  const [rawQuery, setRawQuery] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery.trim().toLowerCase())

  useEffect(() => {
    const t = setTimeout(() => setQuery(rawQuery.trim().toLowerCase()), 200)
    return () => clearTimeout(t)
  }, [rawQuery])

  const filtered = useMemo(() => {
    if (!query) return coaches
    return coaches.filter((c) => {
      const haystack = [
        c.profiles?.full_name ?? '',
        c.sport ?? '',
        c.location ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [coaches, query])

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Search coaches by name, sport, or location…"
            aria-label="Search coaches"
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          {rawQuery && (
            <button
              type="button"
              onClick={() => setRawQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {filtered.length} coach{filtered.length !== 1 ? 'es' : ''} found
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-base font-medium text-gray-700">No coaches found.</p>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((coach) => {
            const reviews = coach.reviews ?? []
            const reviewCount = reviews.length
            const avgRating =
              reviewCount === 0
                ? null
                : reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviewCount

            let verificationBadge: { label: string; classes: string } | null = null
            if (coach.verification_status === 'verified') {
              verificationBadge = {
                label: 'Verified ✓',
                classes: 'bg-green-100 text-green-700',
              }
            } else if (
              coach.verification_status === 'pending' ||
              coach.verification_status === 'id_verified' ||
              coach.verification_status === 'qualification_verified'
            ) {
              verificationBadge = {
                label: 'Pending',
                classes: 'bg-gray-100 text-gray-600',
              }
            }

            const name = coach.profiles?.full_name ?? 'Coach'
            const showNewBadge = isNewCoach(coach.created_at)

            return (
              <div
                key={coach.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-blue-600">
                    {coach.profiles?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coach.profiles.avatar_url}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-base font-semibold text-white">
                        {initials(name)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{name}</h3>
                      {showNewBadge && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-600">
                          <Sparkles className="h-3 w-3" />
                          New
                        </span>
                      )}
                      {verificationBadge && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${verificationBadge.classes}`}
                        >
                          {coach.verification_status === 'verified' && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {verificationBadge.label}
                        </span>
                      )}
                    </div>
                    {coach.sport && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                        {coach.sport}
                      </span>
                    )}

                    <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500">
                      {coach.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {coach.location}
                        </span>
                      )}
                      {coach.years_experience != null && (
                        <span>
                          {coach.years_experience} yr{coach.years_experience === 1 ? '' : 's'} experience
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 text-sm">
                    {avgRating !== null ? (
                      <>
                        <span className="flex items-center gap-1 text-amber-500 font-medium">
                          <Star className="h-4 w-4 fill-current" />
                          {avgRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400">({reviewCount})</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">New</span>
                    )}
                  </div>
                  <div className="text-sm">
                    {coach.hourly_rate != null ? (
                      <>
                        <span className="font-bold text-gray-900">R{coach.hourly_rate}</span>
                        <span className="text-xs text-gray-400">/hr</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">Rate on request</span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <Link href={`/coaches/${coach.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
