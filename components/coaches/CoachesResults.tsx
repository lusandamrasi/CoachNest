'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import CoachCard, { type CoachCardData } from '@/components/coaches/CoachCard'

export type { CoachCardData } from '@/components/coaches/CoachCard'

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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      )}
    </section>
  )
}
