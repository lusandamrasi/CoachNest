'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X, Users } from 'lucide-react'
import CoachCard, { type Coach } from '@/components/booking/CoachCard'
import Navbar from '@/components/layout/Navbar'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const SPORTS = [
    'All Sports', 'Tennis', 'Football', 'Basketball', 'Swimming',
    'Running', 'Cycling', 'Golf', 'Boxing', 'Yoga', 'Pilates', 'Cricket',
]

type Filters = {
    sport: string
    location: string
    maxRate: string
    minExperience: string
}

const DEFAULT_FILTERS: Filters = {
    sport: 'All Sports',
    location: '',
    maxRate: '',
    minExperience: '',
}

function toDateString(date: Date) {
    return date.toISOString().split('T')[0]
}

function FilterPanel({
    filters,
    onChange,
    onClear,
}: {
    filters: Filters
    onChange: (f: Filters) => void
    onClear: () => void
}) {
    const hasActive =
        filters.sport !== 'All Sports' ||
        filters.location ||
        filters.maxRate ||
        filters.minExperience

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">Filters</span>
                </div>
                {hasActive && (
                    <button
                        onClick={onClear}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
                    >
                        <X className="w-3 h-3" /> Clear all
                    </button>
                )}
            </div>

            {/* Sport */}
            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sport</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <select
                        value={filters.sport}
                        onChange={(e) => onChange({ ...filters, sport: e.target.value })}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-blue-400 bg-gray-50 appearance-none"
                    >
                        {SPORTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Location */}
            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</label>
                <input
                    type="text"
                    placeholder="e.g. Cape Town"
                    value={filters.location}
                    onChange={(e) => onChange({ ...filters, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 bg-gray-50"
                />
            </div>

            {/* Max rate */}
            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Max rate (R/hr)</label>
                <input
                    type="number"
                    min={0}
                    placeholder="e.g. 100"
                    value={filters.maxRate}
                    onChange={(e) => onChange({ ...filters, maxRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 bg-gray-50"
                />
            </div>

            {/* Min experience */}
            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Min experience (yrs)</label>
                <input
                    type="number"
                    min={0}
                    placeholder="e.g. 3"
                    value={filters.minExperience}
                    onChange={(e) => onChange({ ...filters, minExperience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 bg-gray-50"
                />
            </div>
        </div>
    )
}

export default function BrowseByDatePage() {
    const router = useRouter()
    const supabase = createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [coaches, setCoaches] = useState<Coach[]>([])
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
    const [showFilters, setShowFilters] = useState(false)
    const [availableDates, setAvailableDates] = useState<Set<number>>(new Set())

    // Load which days of week have any coach available this month
    useEffect(() => {
        async function loadAvailableDays() {
            const { data } = await supabase
                .from('availability')
                .select('day_of_week')
            if (data) {
                setAvailableDates(new Set(data.map((d) => d.day_of_week)))
            }
        }
        loadAvailableDays()
    }, [])

    const fetchCoaches = useCallback(async (date: Date) => {
        setLoading(true)
        const dayOfWeek = date.getDay()

        // Get coach IDs available on this day
        const { data: availData } = await supabase
            .from('availability')
            .select('coach_id')
            .eq('day_of_week', dayOfWeek)

        const coachIds = [...new Set(availData?.map((a) => a.coach_id) ?? [])]

        if (coachIds.length === 0) {
            setCoaches([])
            setLoading(false)
            return
        }

        let query = supabase
            .from('coach_profiles')
            .select(`
        id, sport, bio, hourly_rate, location, years_experience, intro_video_url,
        profiles ( full_name, avatar_url )
      `)
            .eq('is_published', true)
            .in('id', coachIds)

        if (filters.sport !== 'All Sports') {
            query = query.ilike('sport', `%${filters.sport}%`)
        }
        if (filters.location.trim()) {
            query = query.ilike('location', `%${filters.location.trim()}%`)
        }
        if (filters.maxRate) {
            query = query.lte('hourly_rate', parseFloat(filters.maxRate))
        }
        if (filters.minExperience) {
            query = query.gte('years_experience', parseInt(filters.minExperience))
        }

        const { data } = await query.order('hourly_rate', { ascending: true })
        setCoaches((data as unknown as Coach[]) ?? [])
        setLoading(false)
    }, [filters])

    useEffect(() => {
        if (selectedDate) fetchCoaches(selectedDate)
    }, [selectedDate, filters, fetchCoaches])

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
        else setViewMonth(m => m - 1)
    }

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
        else setViewMonth(m => m + 1)
    }

    const isPrevDisabled = viewYear === today.getFullYear() && viewMonth === today.getMonth()

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const calendarCells = [
        ...Array.from({ length: firstDay }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
    ]

    const activeFilterCount = [
        filters.sport !== 'All Sports',
        !!filters.location,
        !!filters.maxRate,
        !!filters.minExperience,
    ].filter(Boolean).length

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <Navbar />
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Find a Coach</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Pick a date to see which coaches are available.
                </p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Left column: calendar + filters */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Calendar */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                        {/* Month nav */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={prevMonth}
                                disabled={isPrevDisabled}
                                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="text-sm font-semibold text-gray-800">
                                {MONTHS[viewMonth]} {viewYear}
                            </span>
                            <button
                                onClick={nextMonth}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 text-center">
                            {DAY_HEADERS.map((d) => (
                                <div key={d} className="text-xs font-semibold text-gray-400 py-1">{d}</div>
                            ))}
                        </div>

                        {/* Cells */}
                        <div className="grid grid-cols-7 gap-y-1">
                            {calendarCells.map((date, i) => {
                                if (!date) return <div key={`empty-${i}`} />

                                const isPast = date < today
                                const isToday = toDateString(date) === toDateString(today)
                                const isSelected = selectedDate && toDateString(date) === toDateString(selectedDate)
                                const hasCoaches = availableDates.has(date.getDay()) && !isPast

                                return (
                                    <button
                                        key={toDateString(date)}
                                        onClick={() => !isPast && setSelectedDate(date)}
                                        disabled={isPast}
                                        className={`
                      relative mx-auto w-8 h-8 rounded-xl text-xs font-medium flex items-center justify-center transition-all
                      ${isSelected
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : hasCoaches
                                                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                                                    : isPast
                                                        ? 'text-gray-200 cursor-default'
                                                        : 'text-gray-400 hover:bg-gray-50 cursor-pointer'
                                            }
                      ${isToday && !isSelected ? 'ring-2 ring-blue-300' : ''}
                    `}
                                    >
                                        {date.getDate()}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Legend */}
                        <div className="space-y-1.5 pt-1 border-t border-gray-50">
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <div className="w-3 h-3 rounded-md bg-blue-50 border border-blue-200" />
                                Coaches available
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <div className="w-3 h-3 rounded-full ring-2 ring-blue-300 bg-white" />
                                Today
                            </div>
                        </div>
                    </div>

                    {/* Filter toggle (mobile) / always visible (desktop) */}
                    <div className="lg:hidden">
                        <button
                            onClick={() => setShowFilters((v) => !v)}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600"
                        >
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
                        </button>
                        {showFilters && (
                            <div className="mt-2">
                                <FilterPanel
                                    filters={filters}
                                    onChange={setFilters}
                                    onClear={() => setFilters(DEFAULT_FILTERS)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:block">
                        <FilterPanel
                            filters={filters}
                            onChange={setFilters}
                            onClear={() => setFilters(DEFAULT_FILTERS)}
                        />
                    </div>
                </div>

                {/* Right column: results */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Results header */}
                    <div className="flex items-center justify-between">
                        {selectedDate ? (
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">
                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {loading ? 'Finding coaches…' : `${coaches.length} coach${coaches.length !== 1 ? 'es' : ''} available`}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">Select a date to see available coaches.</p>
                        )}

                        {activeFilterCount > 0 && (
                            <button
                                onClick={() => setFilters(DEFAULT_FILTERS)}
                                className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                            >
                                <X className="w-3 h-3" /> Clear filters
                            </button>
                        )}
                    </div>

                    {/* Coach grid */}
                    {!selectedDate ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <ChevronLeft className="w-5 h-5 text-blue-300 -rotate-90" />
                            </div>
                            <p className="text-gray-500 font-medium">Pick a date</p>
                            <p className="text-sm text-gray-400">
                                Highlighted dates have coaches available.
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
                            ))}
                        </div>
                    ) : coaches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center space-y-2">
                            <p className="text-gray-500 font-medium">No coaches found</p>
                            <p className="text-sm text-gray-400">
                                Try a different date or adjust your filters.
                            </p>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={() => setFilters(DEFAULT_FILTERS)}
                                    className="mt-2 text-sm text-blue-600 hover:underline"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {coaches.map((coach) => (
                                <CoachCard
                                    key={coach.id}
                                    coach={coach}
                                    onBook={(id) => router.push(`/booking/${id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}