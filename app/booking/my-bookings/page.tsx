'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, MapPin, ChevronRight, Check, X, AlertCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'

type Booking = {
    id: string
    date: string
    start_time: string
    end_time: string
    status: 'pending' | 'confirmed' | 'cancelled'
    payment_status?: 'unpaid' | 'pending' | 'paid' | null
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
        label: 'Pending',
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
}

function BookingCard({ booking, onPay }: { booking: Booking; onPay: (booking: Booking) => void }) {
    const coach = booking.coach_profiles
    const profile = coach?.profiles
    const status = STATUS_CONFIG[booking.status]
    const StatusIcon = status.icon
    const upcoming = isUpcoming(booking.date)

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${booking.status === 'cancelled' ? 'opacity-60 border-gray-100' : 'border-gray-100'
            }`}>
            
            <div className={`h-1.5 w-full ${booking.status === 'confirmed'
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
                            {booking.status === 'confirmed' && booking.payment_status === 'unpaid' && (
                                <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                    <AlertCircle className="w-3 h-3 text-amber-400" />
                                    Unpaid
                                </span>
                            )}
                            {booking.status === 'confirmed' && booking.payment_status === 'paid' && (
                                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3 text-green-400" />
                                    Paid
                                </span>
                            )}
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
                                ? `$${coach.hourly_rate}`
                                : 'Rate on request'
                            }
                        </span>

                        {booking.status === 'confirmed' && upcoming && (
                            <button
                                onClick={() => onPay(booking)}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
                            >
                                Pay now
                                <ChevronRight className="w-3.5 h-3.5" />
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

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/auth/login')

            const { data } = await supabase
                .from('bookings')
                .select(`
          id, date, start_time, end_time, status, payment_status,
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

    const handlePay = (booking: Booking) => {
        // Route to your payment page — replace with your actual payment flow
        router.push(`/payment/${booking.id}`)
    }

    const FILTERS: { key: Filter; label: string }[] = [
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'confirmed', label: 'Confirmed' },
        { key: 'cancelled', label: 'Cancelled' },
    ]

    const filtered = bookings.filter((b) => {
        if (filter === 'upcoming') return isUpcoming(b.date) && b.status !== 'cancelled'
        if (filter === 'pending') return b.status === 'pending'
        if (filter === 'confirmed') return b.status === 'confirmed'
        if (filter === 'cancelled') return b.status === 'cancelled'
        return true
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
                {FILTERS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === key
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                            }`}
                    >
                        {label}
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
                        <BookingCard key={booking.id} booking={booking} onPay={handlePay} />
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
            
        <Footer />
        </>
    )
}