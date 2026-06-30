'use client'

import { useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LocationAutocomplete from '@/components/coach/LocationAutocomplete'

const SPORTS = ['All', 'Tennis', 'Basketball', 'Yoga', 'Golf', 'Soccer', 'Swimming', 'Boxing'] as const
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

interface FiltersSidebarProps {
  defaults: {
    sport: string
    location: string
    lat: number | null
    lng: number | null
    experience: string[]
    minPrice: string
    maxPrice: string
  }
}

export default function FiltersSidebar({ defaults }: FiltersSidebarProps) {
  const [loc, setLoc] = useState({
    address: defaults.location,
    lat: defaults.lat,
    lng: defaults.lng,
  })

  return (
    <form id="coach-filters" method="get" className="lg:sticky lg:top-24">
      <Card padding="md">
        <h2 className="text-sm font-semibold text-gray-900">Filter</h2>

        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="sport" className="text-xs font-medium text-gray-700">
              Sport
            </label>
            <select
              id="sport"
              name="sport"
              defaultValue={defaults.sport}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All sports' : s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-location" className="text-xs font-medium text-gray-700">
              Location
            </label>
            <div className="mt-1">
              <LocationAutocomplete
                id="filter-location"
                placeholder="City or area"
                value={loc}
                onChange={setLoc}
              />
            </div>
            <input type="hidden" name="location" value={loc.address} />
            <input type="hidden" name="lat" value={loc.lat ?? ''} />
            <input type="hidden" name="lng" value={loc.lng ?? ''} />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700">Experience level</p>
            <div className="mt-2 space-y-1.5">
              {EXPERIENCE_LEVELS.map((level) => (
                <label key={level} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="experience"
                    value={level}
                    defaultChecked={defaults.experience.includes(level)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700">Price range (ZAR)</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  R
                </span>
                <input
                  type="number"
                  name="min"
                  min={0}
                  defaultValue={defaults.minPrice}
                  placeholder="Min"
                  className="w-full rounded-lg border border-gray-300 pl-6 pr-2 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <span className="text-xs text-gray-400">–</span>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  R
                </span>
                <input
                  type="number"
                  name="max"
                  min={0}
                  defaultValue={defaults.maxPrice}
                  placeholder="Max"
                  className="w-full rounded-lg border border-gray-300 pl-6 pr-2 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Button type="submit" size="sm" className="w-full">
            Apply Filters
          </Button>
          <Link
            href="/coaches"
            className="block text-center text-xs font-medium text-gray-500 hover:text-blue-600"
          >
            Clear all
          </Link>
        </div>
      </Card>
    </form>
  )
}
