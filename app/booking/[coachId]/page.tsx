'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Star, Clock, ChevronLeft, Check } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type CoachProfile = {
    id: string
    sport: string
    bio: string | null
    hourly_rate: number | null
    location: string | null
    years_experience: number | null
    intro_video_url: string | null
    profiles: {
        full_name: string | null
        avatar_url: string | null
    }
}

type AvailabilitySlot = {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
}

type GroupedAvailability = Record<number, AvailabilitySlot[]>

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

// Get the next N occurrences of a given day_of_week from today
function getUpcomingDates(dayOfWeek: number, count = 4): Date[] {
    const dates: Date[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let d = new Date(today)
    while (dates.length < count) {
        if (d.getDay() === dayOfWeek) dates.push(new Date(d))
        d.setDate(d.getDate() + 1)
    }
    return dates
}

function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function toDateString(date: Date) {
    return date.toISOString().split('T')[0]
}

export default function CoachBookingPage() {
    const router = useRouter()
    const params = useParams()
    const coachId = params.coachId as string
    const supabase = createClient()

    const [coach, setCoach] = useState<CoachProfile | null>(null)
    const [availability, setAvailability] = useState<GroupedAvailability>({})
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Selection state
    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [upcomingDates, setUpcomingDates] = useState<Date[]>([])

    // Booking state
    const [booking, setBooking] = useState(false)
    const [booked, setBooked] = useState(false)
    const [bookingError, setBookingError] = useState('')

    useEffect(() => {
        async function load() {
            const [{ data: { user } }, { data: coachData }, { data: availData }] = await Promise.all([
                supabase.auth.getUser(),
                supabase
                    .from('coach_profiles')
                    .select(`
            id, sport, bio, hourly_rate, location, years_experience, intro_video_url,
            profiles ( full_name, avatar_url )
          `)
                    .eq('id', coachId)
                    .single(),
                supabase
                    .from('availability')
                    .select('*')
                    .eq('coach_id', coachId)
                    .order('day_of_week')
                    .order('start_time'),
            ])

            setUser(user)
            if (coachData) setCoach(coachData as unknown as CoachProfile)

            if (availData) {
                const grouped: GroupedAvailability = {}
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

    const handleDaySelect = (day: number) => {
        setSelectedDay(day)
        setSelectedSlot(null)
        setSelectedDate(null)
        setUpcomingDates(getUpcomingDates(day))
        setBooked(false)
        setBookingError('')
    }

    const handleSlotSelect = (slot: AvailabilitySlot) => {
        setSelectedSlot(slot)
        setSelectedDate(null)
        setBooked(false)
        setBookingError('')
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
                <div className="h-64 bg-gray-100 rounded-2xl" />
            </div>
        )
    }

    if (!coach) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">
                <p className="text-lg font-medium text-gray-500">Coach not found.</p>
                <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">
                    Go back
                </button>
            </div>
        )
    }

    const profile = coach.profiles
    const availableDays = Object.keys(availability).map(Number).sort()

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

            {/* Coach profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-400" />
                <div className="p-6 flex gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 font-bold text-2xl flex items-center justify-center shrink-0 border border-blue-100">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                            getInitials(profile?.full_name ?? null)
                        )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{profile?.full_name ?? 'Coach'}</h1>
                            <span className="inline-flex text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                {coach.sport}
                            </span>
                        </div>
                        {coach.bio && <p className="text-sm text-gray-500 leading-relaxed">{coach.bio}</p>}
                        <div className="flex flex-wrap gap-4 pt-1">
                            {coach.location && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                    {coach.location}
                                </div>
                            )}
                            {coach.years_experience != null && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                    <Star className="w-3.5 h-3.5 text-gray-400" />
                                    {coach.years_experience} yr{coach.years_experience !== 1 ? 's' : ''} experience
                                </div>
                            )}
                            {coach.hourly_rate != null && (
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    ${coach.hourly_rate} / hr
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Availability booking */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="text-base font-semibold text-gray-900">Book a Session</h2>

                {availableDays.length === 0 ? (
                    <p className="text-sm text-gray-400">This coach hasn't set their availability yet.</p>
                ) : (
                    <>
                        {/* Step 1: Pick a day */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">1. Choose a day</p>
                            <div className="flex flex-wrap gap-2">
                                {availableDays.map((day) => (
                                    <button
                                        key={day}
                                        onClick={() => handleDaySelect(day)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${selectedDay === day
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                                            }`}
                                    >
                                        {DAYS[day]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Pick a time slot */}
                        {selectedDay !== null && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">2. Choose a time</p>
                                <div className="flex flex-wrap gap-2">
                                    {availability[selectedDay].map((slot) => (
                                        <button
                                            key={slot.id}
                                            onClick={() => handleSlotSelect(slot)}
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

                        {/* Step 3: Pick a date */}
                        {selectedSlot && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">3. Choose a date</p>
                                <div className="flex flex-wrap gap-2">
                                    {upcomingDates.map((date) => (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => { setSelectedDate(date); setBooked(false); setBookingError('') }}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${selectedDate && toDateString(selectedDate) === toDateString(date)
                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                    : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                                                }`}
                                        >
                                            {formatDate(date)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confirm */}
                        {selectedSlot && selectedDate && (
                            <div className="pt-2 space-y-3">
                                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
                                    <span className="font-semibold">Summary: </span>
                                    {formatDate(selectedDate)} · {formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)}
                                    {coach.hourly_rate != null && (
                                        <span className="ml-2 text-blue-500">· ${coach.hourly_rate}</span>
                                    )}
                                </div>

                                {bookingError && <p className="text-sm text-red-500">{bookingError}</p>}

                                {booked ? (
                                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                        <Check className="w-4 h-4" />
                                        Booking confirmed! The coach will be in touch.
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