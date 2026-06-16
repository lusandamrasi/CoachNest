'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, MapPin, Check, X, AlertCircle, User } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

type Booking = {
    id: string
    date: string
    start_time: string
    end_time: string
    status: 'pending' | 'confirmed' | 'cancelled'
    profiles: {
        full_name: string | null
        avatar_url: string | null
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
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
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

function PendingCard({
    booking,
    onAccept,
    onReject,
    acting,
}: {
    booking: Booking
    onAccept: (id: string) => void
    onReject: (id: string) => void
    acting: string | null
}) {
    const profile = booking.profiles
    const isActing = acting === booking.id

    return (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
            <div className="p-5 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold text-base flex items-center justify-center shrink-0 border border-blue-100">
                    {profile?.avatar_url
                        ? <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-full h-full object-cover rounded-xl" />
                        : getInitials(profile?.full_name ?? null)
                    }
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900">{profile?.full_name ?? 'Client'}</p>
                            <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mt-0.5">
                                <AlertCircle className="w-3 h-3" />
                                Awaiting your response
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
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={() => onAccept(booking.id)}
                            disabled={!!acting}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                        >
                            {isActing ? '…' : <><Check className="w-4 h-4" /> Accept</>}
                        </button>
                        <button
                            onClick={() => onReject(booking.id)}
                            disabled={!!acting}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white hover:bg-red-50 disabled:opacity-50 text-red-500 border border-red-200 text-sm font-semibold transition-colors"
                        >
                            {isActing ? '…' : <><X className="w-4 h-4" /> Decline</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function BookingCard({ booking }: { booking: Booking }) {
    const profile = booking.profiles
    const status = STATUS_CONFIG[booking.status]
    const StatusIcon = status.icon
    const upcoming = isUpcoming(booking.date)

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${booking.status === 'cancelled' ? 'opacity-60 border-gray-100' : 'border-gray-100'
            }`}>
            <div className={`h-1.5 w-full ${booking.status === 'confirmed'
                    ? 'bg-gradient-to-r from-green-400 to-green-500'
                    : 'bg-gray-200'
                }`} />
            <div className="p-5 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold text-base flex items-center justify-center shrink-0 border border-blue-100">
                    {profile?.avatar_url
                        ? <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-full h-full object-cover rounded-xl" />
                        : getInitials(profile?.full_name ?? null)
                    }
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-semibold text-gray-900">{profile?.full_name ?? 'Client'}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                <User className="w-3 h-3" />
                                {upcoming ? 'Upcoming session' : 'Past session'}
                            </div>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${status.className}`}>
                            <StatusIcon className={`w-3 h-3 ${status.iconClass}`} />
                            {status.label}
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
                    </div>
                </div>
            </div>
        </div>
    )
}

type Tab = 'requests' | 'upcoming' | 'past'

export default function CoachBookingsPage() {
    const router = useRouter()
    const supabase = createClient()

    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<Tab>('requests')
    const [acting, setActing] = useState<string | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/auth/login')

            const { data } = await supabase
                .from('bookings')
                .select(`
          id, date, start_time, end_time, status,
          profiles!bookings_student_id_fkey ( full_name, avatar_url )
        `)
                .eq('coach_id', user.id)
                .order('date', { ascending: true })

            if (data) setBookings(data as unknown as Booking[])
            setLoading(false)
        }
        load()
    }, [])

    const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
        setActing(id)
        setError('')

        const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id)

        if (error) {
            setError('Failed to update booking. Please try again.')
        } else {
            setBookings((prev) =>
                prev.map((b) => b.id === id ? { ...b, status } : b)
            )
        }
        setActing(null)
    }

    const pending = bookings.filter((b) => b.status === 'pending')
    const upcoming = bookings.filter((b) => b.status === 'confirmed' && isUpcoming(b.date))
    const past = bookings.filter((b) => b.status === 'confirmed' && !isUpcoming(b.date))

    const TABS: { key: Tab; label: string; count?: number }[] = [
        { key: 'requests', label: 'Requests', count: pending.length },
        { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
        { key: 'past', label: 'Past' },
    ]

    const activeList =
        tab === 'requests' ? pending :
            tab === 'upcoming' ? upcoming :
                past

    return (
        <>
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage your coaching sessions.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    {TABS.map(({ key, label, count }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === key
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                                }`}
                        >
                            {label}
                            {count != null && count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {error && (
                    <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        {error}
                    </p>
                )}

                {/* List */}
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />
                        ))}
                    </div>
                ) : activeList.length === 0 ? (
                    <div className="text-center py-20 space-y-1">
                        <p className="text-gray-500 font-medium">
                            {tab === 'requests' ? 'No pending requests' :
                                tab === 'upcoming' ? 'No upcoming sessions' :
                                    'No past sessions'}
                        </p>
                        <p className="text-sm text-gray-400">
                            {tab === 'requests' ? 'New booking requests will appear here.' :
                                tab === 'upcoming' ? 'Accepted bookings will show up here.' :
                                    'Completed sessions will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tab === 'requests'
                            ? activeList.map((b) => (
                                <PendingCard
                                    key={b.id}
                                    booking={b}
                                    onAccept={(id) => updateStatus(id, 'confirmed')}
                                    onReject={(id) => updateStatus(id, 'cancelled')}
                                    acting={acting}
                                />
                            ))
                            : activeList.map((b) => (
                                <BookingCard key={b.id} booking={b} />
                            ))
                        }
                    </div>
                )}
            </div>
            <Footer />
        </>
    )
}