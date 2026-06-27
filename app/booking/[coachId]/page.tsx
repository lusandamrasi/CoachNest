'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Star, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type CoachProfile = {
    id: string
    sport: string
    bio: string | null
    hourly_rate: number | null
    location: string | null
    years_experience: number | null
    intro_video_url: string | null
    profiles: { full_name: string | null; avatar_url: string | null }
}

type AvailabilitySlot = {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
}

function getInitials(name: string | null) {
    if (!name) return '?'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(time: string) {
    const [h, m] = time.split(':')
    const hour12 = parseInt(h) % 12 || 12
    const ampm = parseInt(h) < 12 ? 'AM' : 'PM'
    return `${hour12}:${m} ${ampm}`
}

function toDateString(date: Date) {
    return date.toISOString().split('T')[0]
}

function formatDateLong(date: Date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function CoachBookingPage() {
    const router = useRouter()
    const params = useParams()
    const coachId = params.coachId as string
    const supabase = createClient()

    const [coach, setCoach] = useState<CoachProfile | null>(null)
    const [availability, setAvailability] = useState<Record<number, AvailabilitySlot[]>>({})
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)

    const [booking, setBooking] = useState(false)
    const [booked, setBooked] = useState(false)
    const [bookingError, setBookingError] = useState('')

    useEffect(() => {
        async function load() {
            const [{ data: { user } }, { data: coachData }, { data: availData }] = await Promise.all([
                supabase.auth.getUser(),
                supabase
                    .from('coach_profiles')
                    .select(`id, sport, bio, hourly_rate, location, years_experience, intro_video_url, profiles ( full_name, avatar_url )`)
                    .eq('id', coachId)
                    .single(),
                supabase
                    .from('availability')
                    .select('*')
                    .eq('coach_id', coachId)
                    .order('start_time'),
            ])

            setUser(user)
            if (coachData) setCoach(coachData as unknown as CoachProfile)
            if (availData) {
                const grouped: Record<number, AvailabilitySlot[]> = {}
                availData.forEach((slot) => {
                    if (!grouped[slot.day_of_week]) grouped[slot.day_of_week] = []
                    grouped[slot.day_of_week].push(slot)
                })
                setAvailability(grouped)
            }
            setLoading(false)
        }
        load()
    }, [coachId])

    // Calendar helpers
    const availableDays = new Set(Object.keys(availability).map(Number))

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

    const isAvailable = (date: Date) => {
        if (date < today) return false
        return availableDays.has(date.getDay())
    }

    const handleDateClick = (date: Date) => {
        if (!isAvailable(date)) return
        setSelectedDate(date)
        setSelectedSlot(null)
        setBooked(false)
        setBookingError('')
    }

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
        else setViewMonth(m => m - 1)
    }

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
        else setViewMonth(m => m + 1)
    }

    const handleBook = async () => {
        if (!user) return router.push('/auth/login')
        if (!selectedSlot || !selectedDate) return
        setBooking(true)
        setBookingError('')

        const { error } = await supabase.from('bookings').insert({
            coach_id: coachId,
            student_id: user.id,
            date: toDateString(selectedDate),
            start_time: selectedSlot.start_time,
            end_time: selectedSlot.end_time,
            status: 'pending',
            paid: false,
        })

        if (error) {
            setBookingError('This slot may already be booked. Please choose another.')
            setBooking(false)
            return
        }

        setBooked(true)
        setBooking(false)
    }

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-gray-100 rounded-xl" />
                <div className="h-40 bg-gray-100 rounded-2xl" />
                <div className="h-80 bg-gray-100 rounded-2xl" />
            </div>
        )
    }

    if (!coach) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">
                <p className="text-lg font-medium text-gray-500">Coach not found.</p>
                <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">Go back</button>
            </div>
        )
    }

    const profile = coach.profiles
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
    const calendarCells = Array.from({ length: firstDay }, () => null).concat(
        Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1))
    )
    const slotsForSelectedDay = selectedDate ? (availability[selectedDate.getDay()] ?? []) : []

    // Prevent navigating to months before today
    const isPrevDisabled = viewYear === today.getFullYear() && viewMonth === today.getMonth()

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {/* Back */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to coaches
            </button>

            {/* Coach card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-400" />
                <div className="p-6 flex gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 font-bold text-2xl flex items-center justify-center shrink-0 border border-blue-100">
                        {profile?.avatar_url
                            ? <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-full h-full object-cover rounded-2xl" />
                            : getInitials(profile?.full_name ?? null)
                        }
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{profile?.full_name ?? 'Coach'}</h1>
                            <span className="inline-flex text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{coach.sport}</span>
                        </div>
                        {coach.bio && <p className="text-sm text-gray-500 leading-relaxed">{coach.bio}</p>}
                        <div className="flex flex-wrap gap-4 pt-1">
                            {coach.location && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />{coach.location}
                                </div>
                            )}
                            {coach.years_experience != null && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                    <Star className="w-3.5 h-3.5 text-gray-400" />{coach.years_experience} yr{coach.years_experience !== 1 ? 's' : ''} experience
                                </div>
                            )}
                            {coach.hourly_rate != null && (
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />R{coach.hourly_rate} / hr
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar + booking */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <h2 className="text-base font-semibold text-gray-900">Book a Session</h2>

                {availableDays.size === 0 ? (
                    <p className="text-sm text-gray-400">This coach hasn't set their availability yet.</p>
                ) : (
                    <>
                        {/* Calendar */}
                        <div className="space-y-3">
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
                                {DAYS.map((d) => (
                                    <div key={d} className="text-xs font-semibold text-gray-400 py-1">{d}</div>
                                ))}
                            </div>

                            {/* Date cells */}
                            <div className="grid grid-cols-7 gap-y-1">
                                {calendarCells.map((date, i) => {
                                    if (!date) return <div key={`empty-${i}`} />

                                    const available = isAvailable(date)
                                    const isPast = date < today
                                    const isSelected = selectedDate && toDateString(date) === toDateString(selectedDate)
                                    const isToday = toDateString(date) === toDateString(today)

                                    return (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => handleDateClick(date)}
                                            disabled={!available}
                                            className={`
                        relative mx-auto w-9 h-9 rounded-full text-sm font-medium flex items-center justify-center transition-all
                        ${isSelected
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : available
                                                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                                                        : isPast
                                                            ? 'text-gray-200 cursor-default'
                                                            : 'text-gray-300 cursor-default'
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
                            <div className="flex items-center gap-4 pt-1">
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <div className="w-3 h-3 rounded-full bg-blue-50 border border-blue-200" />
                                    Available
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                                    Selected
                                </div>
                            </div>
                        </div>

                        {/* Time slots */}
                        {selectedDate && (
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <p className="text-sm font-semibold text-gray-700">
                                    Available times for {formatDateLong(selectedDate)}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {slotsForSelectedDay.map((slot) => (
                                        <button
                                            key={slot.id}
                                            onClick={() => { setSelectedSlot(slot); setBooked(false); setBookingError('') }}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${selectedSlot?.id === slot.id
                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                    : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                                                }`}
                                        >
                                            {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confirm */}
                        {selectedSlot && selectedDate && (
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
                                    <span className="font-semibold">Summary: </span>
                                    {formatDateLong(selectedDate)} · {formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)}
                                    {coach.hourly_rate != null && <span className="ml-2 text-blue-500">· R{coach.hourly_rate}</span>}
                                </div>

                                {bookingError && <p className="text-sm text-red-500">{bookingError}</p>}

                                {booked ? (
                                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                                        <Check className="w-4 h-4 shrink-0" />
                                        Booking confirmed! The coach will be in touch soon.
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleBook}
                                        disabled={booking}
                                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                                    >
                                        {booking ? 'Confirming…' : user ? 'Confirm Booking' : 'Sign in to Book'}
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}