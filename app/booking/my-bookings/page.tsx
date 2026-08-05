'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, MapPin, ChevronRight, Check, X, AlertCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

type Booking = {
    id: string
    date: string
    start_time: string
    end_time: string
    status: 'pending' | 'confirmed' | 'cancelled'
    paid?: boolean | null
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

function formatDate(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function isUpcoming(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
}

const STATUS_CONFIG = {
    pending: {
        label: 'Pending Confirmation',
        icon: AlertCircle,
        className: 'bg-amber-50 text-amber-600 border-amber-100',
        iconClass: 'text-amber-400',
    },
    confirmed: {
        label: 'Confirmed',
        icon: Check,
        className: 'bg-green-50 text-green-600 border-green-100',
        iconClass: 'text-green-400',
    },
    cancelled: {
        label: 'Cancelled',
        icon: X,
        className: 'bg-red-50 text-red-600 border-red-100',
        iconClass: 'text-red-400',
    },
    review: {
        label: 'Completed',
        icon: Check,
        className: 'bg-gray-100 text-gray-500 border-gray-200',
        iconClass: 'text-gray-400',
    },
    'completed-unpaid': {
        label: 'Completed',
        icon: Check,
        className: 'bg-gray-100 text-gray-500 border-gray-200',
        iconClass: 'text-gray-400',
    },
    completed: {
        label: 'Completed',
        icon: Check,
        className: 'bg-gray-100 text-gray-500 border-gray-200',
        iconClass: 'text-gray-400',
    },
}

function BookingCard({
    booking,
    onCancel,
    canceling,
}: {
    booking: Booking
    onCancel: (booking: Booking) => void
    canceling: boolean
}) {
    const coach = booking.coach_profiles
    const profile = coach?.profiles
    const isPendingPayment = booking.status === 'confirmed' && !booking.paid
    const isPaidConfirmed = booking.status === 'confirmed' && booking.paid === true
    const status = isPendingPayment
        ? {
            label: 'Payment Pending',
            icon: AlertCircle,
            className: 'bg-amber-50 text-amber-600 border-amber-100',
            iconClass: 'text-amber-400',
        }
        : isPaidConfirmed
            ? {
                label: 'Paid',
                icon: Check,
                className: 'bg-green-50 text-green-600 border-green-100',
                iconClass: 'text-green-400',
            }
            : STATUS_CONFIG[booking.status]
    const StatusIcon = status.icon
    const upcoming = isUpcoming(booking.date)

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${booking.status === 'cancelled' ? 'opacity-60 border-gray-100' : 'border-gray-100'
            }`}>

            <div className={`h-1.5 w-full ${isPendingPayment
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : isPaidConfirmed
                        ? 'bg-gradient-to-r from-green-400 to-green-500'
                        : booking.status === 'cancelled'
                            ? 'bg-gray-200'
                            : 'bg-gradient-to-r from-amber-400 to-amber-500'
                }`} />

            <div className="p-5 flex gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold text-base flex items-center justify-center shrink-0 border border-blue-100">
                    {profile?.avatar_url
                        ? <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-full h-full object-cover rounded-xl" />
                        : getInitials(profile?.full_name ?? null)
                    }
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-semibold text-gray-900">{profile?.full_name ?? 'Coach'}</p>
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                {coach?.sport}
                            </span>
                        </div>

                        {/* Status badge */}
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${status.className}`}>
                                <StatusIcon className={`w-3 h-3 ${status.iconClass}`} />
                                {status.label}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(booking.date)}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                        </div>
                        {coach?.location && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                {coach.location}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-sm font-semibold text-gray-700">
                            {coach?.hourly_rate != null
                                ? `R${coach.hourly_rate}`
                                : 'Rate on request'
                            }
                        </span>

                        {booking.status === 'confirmed' && upcoming && !booking.paid && (
                            <button
                                onClick={() => onCancel(booking)}
                                disabled={canceling}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-red-50 disabled:opacity-50 text-red-500 border border-red-200 text-sm font-semibold rounded-xl transition-colors"
                            >
                                {canceling ? '…' : 'Cancel'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

type Filter = 'all' | 'upcoming' | 'pending' | 'confirmed' | 'cancelled'

export default function MyBookingsPage() {
    const router = useRouter()
    const supabase = createClient()

    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<Filter>('upcoming')
    const [cancelingId, setCancelingId] = useState<string | null>(null)


    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/auth/login')

            const { data } = await supabase
                .from('bookings')
                .select(`
          id, date, start_time, end_time, status, paid,
          coach_profiles (
            sport, hourly_rate, location,
            profiles ( full_name, avatar_url )
          )
        `)
                .eq('student_id', user.id)
                .order('date', { ascending: false })

            if (data) setBookings(data as unknown as Booking[])
            setLoading(false)
        }
        load()
    }, [])

    const handleCancelBooking = async (booking: Booking) => {
        if (!window.confirm('Cancel this session? This cannot be undone.')) return

        setCancelingId(booking.id)
        try {
            const res = await fetch('/api/bookings/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: booking.id }),
            })

            if (res.ok) {
                setBookings((prev) =>
                    prev.map((b) => b.id === booking.id ? { ...b, status: 'cancelled' } : b)
                )
            }
        } finally {
            setCancelingId(null)
        }
    }

    // Mirrors useCart.ts's definition of "in the cart": confirmed, unpaid, upcoming.
    const cartMatchingCount = bookings.filter(
        (b) => b.status === 'confirmed' && !b.paid && isUpcoming(b.date)
    ).length

    const FILTERS: { key: Filter; label: string; count?: number }[] = [
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'pending', label: 'Pending Confirmation' },
        { key: 'confirmed', label: 'Confirmed', count: cartMatchingCount },
        { key: 'cancelled', label: 'Cancelled' },
        { key: 'all', label: 'All' },
    ]

    const filtered = bookings
        .filter((b) => {
            if (filter === 'upcoming') return isUpcoming(b.date) && b.status === 'confirmed' && b.paid === true
            if (filter === 'pending') return b.status === 'pending' && isUpcoming(b.date)
            if (filter === 'confirmed') return b.status === 'confirmed' && isUpcoming(b.date)
            if (filter === 'cancelled') return b.status === 'cancelled'
            return true
        })
        .sort((a, b) => {
            // Within "Confirmed", unpaid (payment pending) sessions surface first.
            if (filter === 'confirmed') {
                const aPending = a.paid ? 0 : 1
                const bPending = b.paid ? 0 : 1
                if (aPending !== bPending) return bPending - aPending
            }
            return 0
        })

    const pendingCount = bookings.filter((b) => b.status === 'pending' && isUpcoming(b.date)).length

    return (
        <>
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                    <p className="text-sm text-gray-400 mt-1">Track and manage your coaching sessions.</p>
                </div>
                {pendingCount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {pendingCount} awaiting confirmation
                    </div>
                )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {FILTERS.map(({ key, label, count }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === key
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                            }`}
                    >
                        {label}
                        {count != null && count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 space-y-2">
                    <p className="text-gray-500 font-medium">No bookings found</p>
                    <p className="text-sm text-gray-400">
                        {filter === 'upcoming'
                            ? "You don't have any upcoming sessions."
                            : `No ${filter} bookings yet.`}
                    </p>
                    <button
                        onClick={() => router.push('/coaches')}
                        className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                        Find a coach <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((booking) => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            onCancel={handleCancelBooking}
                            canceling={cancelingId === booking.id}
                        />
                    ))}
                </div>
            )}
                <Link
                    href="/dashboard/client"
                    className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to dashboard
                </Link>
        </div>
            
        </>
    )
}