'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Check, MapPin, StickyNote } from 'lucide-react'
import Link from 'next/link'

type Booking = {
    id: string
    date: string
    start_time: string
    end_time: string
    status: string
    paid: boolean
    notes: string | null
    coach_profiles: {
        sport: string
        hourly_rate: number | null
        location: string | null
        profiles: {
            full_name: string | null
            avatar_url: string | null
        }
    }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

function formatDateLong(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    })
}

function toDateString(date: Date) {
    return date.toISOString().split('T')[0]
}

export default function ClientBookingCalendar({ bookings }: { bookings: Booking[] }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
        else setViewMonth(m => m - 1)
        setSelectedDate(null)
    }

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
        else setViewMonth(m => m + 1)
        setSelectedDate(null)
    }

    const bookingsByDate = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
        if (!acc[b.date]) acc[b.date] = []
        acc[b.date].push(b)
        return acc
    }, {})

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const calendarCells = [
        ...Array.from({ length: firstDay }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
    ]

    const selectedBookings = selectedDate ? (bookingsByDate[selectedDate] ?? []) : []

    const monthBookings = bookings.filter((b) => {
        const d = new Date(b.date + 'T00:00:00')
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth
    })

    const unpaidUpcoming = bookings.filter(
        (b) => !b.paid && new Date(b.date + 'T00:00:00') >= today
    )

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">My Bookings</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Your confirmed coaching sessions.</p>
                </div>
                {unpaidUpcoming.length > 0 && (
                    <Link
                        href="/dashboard/client/bookings"
                        className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
                    >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {unpaidUpcoming.length} unpaid session{unpaidUpcoming.length !== 1 ? 's' : ''}
                    </Link>
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                            <p className="text-xs font-medium text-blue-400 uppercase tracking-wide">This month</p>
                            <p className="text-2xl font-bold text-blue-700 mt-0.5">{monthBookings.length}</p>
                            <p className="text-xs text-blue-500">session{monthBookings.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3">
                            <p className="text-xs font-medium text-green-400 uppercase tracking-wide">Paid</p>
                            <p className="text-2xl font-bold text-green-700 mt-0.5">
                                {monthBookings.filter((b) => b.paid).length}
                            </p>
                            <p className="text-xs text-green-500">confirmed</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                            <p className="text-xs font-medium text-amber-400 uppercase tracking-wide">Unpaid</p>
                            <p className="text-2xl font-bold text-amber-700 mt-0.5">
                                {monthBookings.filter((b) => !b.paid).length}
                            </p>
                            <p className="text-xs text-amber-500">outstanding</p>
                        </div>
                    </div>

                    {/* Month nav */}
                    <div className="flex items-center justify-between">
                        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-sm font-semibold text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
                        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
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

                            const dateStr = toDateString(date)
                            const dayBookings = bookingsByDate[dateStr] ?? []
                            const hasBookings = dayBookings.length > 0
                            const hasUnpaid = dayBookings.some((b) => !b.paid)
                            const allPaid = hasBookings && dayBookings.every((b) => b.paid)
                            const isPast = date < today
                            const isToday = dateStr === toDateString(today)
                            const isSelected = selectedDate === dateStr

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => hasBookings && setSelectedDate(isSelected ? null : dateStr)}
                                    disabled={!hasBookings}
                                    className={`
                    relative mx-auto flex flex-col items-center justify-center w-10 h-10 rounded-xl text-sm font-medium transition-all
                    ${isSelected
                                            ? hasUnpaid
                                                ? 'bg-amber-500 text-white shadow-md'
                                                : 'bg-blue-600 text-white shadow-md'
                                            : hasUnpaid && !isPast
                                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer'
                                                : allPaid
                                                    ? isPast
                                                        ? 'bg-gray-100 text-gray-400 hover:bg-gray-200 cursor-pointer'
                                                        : 'bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer'
                                                    : isPast
                                                        ? 'text-gray-300 cursor-default'
                                                        : 'text-gray-500 hover:bg-gray-50 cursor-default'
                                        }
                    ${isToday && !isSelected ? 'ring-2 ring-blue-300' : ''}
                  `}
                                >
                                    {date.getDate()}
                                    {hasBookings && (
                                        <span className="absolute bottom-1 flex gap-0.5">
                                            {Array.from({ length: Math.min(dayBookings.length, 3) }).map((_, i) => (
                                                <span
                                                    key={i}
                                                    className={`w-1 h-1 rounded-full ${isSelected
                                                            ? 'bg-white/70'
                                                            : hasUnpaid && !isPast
                                                                ? 'bg-amber-400'
                                                                : 'bg-green-400'
                                                        }`}
                                                />
                                            ))}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <div className="w-3 h-3 rounded-md bg-amber-50 border border-amber-200" />
                            Unpaid
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <div className="w-3 h-3 rounded-md bg-green-50 border border-green-200" />
                            Paid
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <div className="w-3 h-3 rounded-full ring-2 ring-blue-300 bg-white" />
                            Today
                        </div>
                    </div>
                </div>

                {/* Side panel */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    {selectedDate ? (
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Selected</p>
                                <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDateLong(selectedDate)}</p>
                            </div>

                            <div className="space-y-3">
                                {selectedBookings
                                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                    .map((booking) => {
                                        const coach = booking.coach_profiles
                                        const profile = coach?.profiles
                                        const isPast = new Date(booking.date + 'T00:00:00') < today

                                        return (
                                            <div
                                                key={booking.id}
                                                className={`rounded-xl border p-3 space-y-2 ${!booking.paid && !isPast
                                                        ? 'border-amber-100 bg-amber-50'
                                                        : 'border-gray-100 bg-gray-50'
                                                    }`}
                                            >
                                                {/* Coach */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-100 shrink-0">
                                                            {profile?.avatar_url
                                                                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-lg" />
                                                                : getInitials(profile?.full_name ?? null)
                                                            }
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">
                                                                {profile?.full_name ?? 'Coach'}
                                                            </p>
                                                            <p className="text-xs text-gray-400">{coach?.sport}</p>
                                                        </div>
                                                    </div>

                                                    {/* Paid badge */}
                                                    {booking.paid ? (
                                                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                                                            <Check className="w-3 h-3" /> Paid
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                                                            <AlertCircle className="w-3 h-3" /> Unpaid
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Time */}
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                                                </div>

                                                {/* Location */}
                                                {coach?.location && (
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                        {coach.location}
                                                    </div>
                                                )}

                                                {/* Duration + rate */}
                                                <div className="flex items-center justify-between text-xs text-gray-400">
                                                    <span>
                                                        {(() => {
                                                            const [sh, sm] = booking.start_time.split(':').map(Number)
                                                            const [eh, em] = booking.end_time.split(':').map(Number)
                                                            const mins = (eh * 60 + em) - (sh * 60 + sm)
                                                            return `${mins} min session`
                                                        })()}
                                                    </span>
                                                    {coach?.hourly_rate && (
                                                        <span className="font-medium text-gray-500">R{coach.hourly_rate}/hr</span>
                                                    )}
                                                </div>

                                                {/* Note */}
                                                {booking.notes && (
                                                    <div className="flex items-start gap-1.5 rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
                                                        <StickyNote className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                                        <span className="whitespace-pre-line">{booking.notes}</span>
                                                    </div>
                                                )}

                                                {/* Pay button */}
                                                {!booking.paid && !isPast && (
                                                    <Link
                                                        href={`/payment/${booking.id}`}
                                                        className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
                                                    >
                                                        Pay now
                                                    </Link>
                                                )}
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                <ChevronLeft className="w-4 h-4 text-gray-300 -rotate-90" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">Select a date</p>
                            <p className="text-xs text-gray-400">Click a highlighted date to see your session details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}