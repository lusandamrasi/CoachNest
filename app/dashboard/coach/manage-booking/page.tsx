'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, Check, X, AlertCircle, User, Star } from 'lucide-react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import DashboardNav from '@/components/layout/DashboardNav'

type Booking = {
    id: string
    student_id: string
    date: string
    start_time: string
    end_time: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'review' | 'completed-unpaid' | 'completed'
    notes: string | null
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
    review: {
        label: 'Awaiting Review',
        icon: Star,
        className: 'bg-blue-50 text-blue-600 border-blue-100',
        iconClass: 'text-blue-400',
    },
    'completed-unpaid': {
        label: 'Completed — Unpaid',
        icon: Clock,
        className: 'bg-orange-50 text-orange-600 border-orange-100',
        iconClass: 'text-orange-400',
    },
    completed: {
        label: 'Completed',
        icon: Check,
        className: 'bg-gray-100 text-gray-500 border-gray-200',
        iconClass: 'text-gray-400',
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
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="font-semibold text-gray-900">{profile?.full_name ?? 'Client'}</p>
                            <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mt-0.5">
                                <AlertCircle className="w-3 h-3" />
                                Awaiting your response
                            </div>
                        </div>
                        <Link
                            href={`/clients/${booking.student_id}`}
                            className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
                        >
                            View profile →
                        </Link>
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

                    {booking.notes && (
                        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                            <span className="font-semibold">Client note:</span> <span className="whitespace-pre-line">{booking.notes}</span>
                        </div>
                    )}

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

function ReviewCard({ booking }: { booking: Booking }) {
    const supabase = createClient()
    const [expanded, setExpanded] = useState(false)
    const [rating, setRating] = useState(0)
    const [hovered, setHovered] = useState(0)
    const [review, setReview] = useState('')
    const [attended, setAttended] = useState<boolean | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const profile = booking.profiles

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please give a star rating.')
            return
        }
        if (attended === null) {
            setError('Please confirm whether the student attended.')
            return
        }

        setSaving(true)
        setError('')

        // Save review to booking and update status
        const { error: bookingError } = await supabase
            .from('bookings')
            .update({
                status: 'completed-unpaid',
                coaches_report: review || null,
                rating: rating,
                student_attended: attended,
            })
            .eq('id', booking.id)

        if (bookingError) {
            setError('Failed to save review. Please try again.')
            setSaving(false)
            return
        }

        const { data: allRatings } = await supabase
            .from('bookings')
            .select('rating')
            .eq('student_id', booking.student_id)
            .not('rating', 'is', null)

        if (allRatings && allRatings.length > 0) {
            const average = Math.round(
                allRatings.reduce((sum, b) => sum + (b.rating ?? 0), 0) / allRatings.length
            )

            await supabase
                .from('client_profiles')
                .update({ rating: average })
                .eq('id', booking.student_id)
        }

        setSaving(false)
        setExpanded(false)
        window.location.reload()
    }

    return (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-blue-500" />
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
                            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-0.5">
                                <Star className="w-3 h-3" />
                                Ready to review
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-blue-50 text-blue-600 border-blue-100">
                            <Star className="w-3 h-3 text-blue-400" />
                            Awaiting Review
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

                    {/* Review form toggle */}
                    <div className="pt-1">
                        {!expanded ? (
                            <button
                                onClick={() => setExpanded(true)}
                                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                            >
                                Write Review
                            </button>
                        ) : (
                            <div className="space-y-4 pt-1 border-t border-gray-100">

                                {/* Star rating */}
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Rate this client <span className="text-red-400">*</span>
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: 5 }).map((_, i) => {
                                            const val = i + 1
                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setRating(val)}
                                                    onMouseEnter={() => setHovered(val)}
                                                    onMouseLeave={() => setHovered(0)}
                                                    className="transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        className={`w-7 h-7 transition-colors ${val <= (hovered || rating)
                                                                ? 'text-amber-400 fill-amber-400'
                                                                : 'text-gray-200 fill-gray-200'
                                                            }`}
                                                    />
                                                </button>
                                            )
                                        })}
                                        {rating > 0 && (
                                            <span className="ml-2 text-sm text-gray-500">
                                                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Attendance confirmation */}
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Did the student attend? <span className="text-red-400">*</span>
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setAttended(true)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${attended === true
                                                    ? 'bg-green-600 border-green-600 text-white'
                                                    : 'border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600'
                                                }`}
                                        >
                                            ✓ Yes, attended
                                        </button>
                                        <button
                                            onClick={() => setAttended(false)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${attended === false
                                                    ? 'bg-red-500 border-red-500 text-white'
                                                    : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500'
                                                }`}
                                        >
                                            ✗ No-show
                                        </button>
                                    </div>
                                </div>

                                {/* Optional review */}
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Notes <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                    </p>
                                    <textarea
                                        value={review}
                                        onChange={(e) => setReview(e.target.value)}
                                        placeholder="Any notes about this client or session..."
                                        rows={3}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none resize-none"
                                    />
                                </div>

                                {error && <p className="text-xs text-red-500">{error}</p>}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setExpanded(false); setError('') }}
                                        disabled={saving}
                                        className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Saving…' : 'Submit Review'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

type Tab = 'requests' | 'upcoming' | 'review' | 'past'

export default function CoachBookingsPage() {
    const router = useRouter()
    const supabase = createClient()

    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<Tab>('requests')
    const [acting, setActing] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [fullName, setFullName] = useState<string | null>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    useEffect(() => {
        // Check for confirmed sessions that have now passed and move them to 'review'
        async function updateCompletedSessions(coachId: string) {
            const now = new Date()
            const todayStr = now.toISOString().split('T')[0]
            const currentTime = now.toTimeString().slice(0, 5) // 'HH:MM'

            const { data: confirmedBookings } = await supabase
                .from('bookings')
                .select('id, date, end_time')
                .eq('coach_id', coachId)
                .eq('status', 'confirmed')

            if (!confirmedBookings) return

            const expiredIds = confirmedBookings
                .filter((b) => {
                    if (b.date < todayStr) return true
                    if (b.date === todayStr && b.end_time <= currentTime) return true
                    return false
                })
                .map((b) => b.id)

            if (expiredIds.length === 0) return

            await supabase
                .from('bookings')
                .update({ status: 'review' })
                .in('id', expiredIds)
        }

        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/auth/login')

            await updateCompletedSessions(user.id)

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', user.id)
                .single()
            setFullName(profile?.full_name ?? null)
            setAvatarUrl(profile?.avatar_url ?? null)

            const { data } = await supabase
                .from('bookings')
                .select(`
                    id, student_id, date, start_time, end_time, status,
                    profiles!bookings_student_id_fkey ( full_name, avatar_url )
                `)
                .eq('coach_id', user.id)
                .order('date', { ascending: true })

            if (data) {
                console.log('all statuses:', data.map((b) => b.status))
                setBookings(data as unknown as Booking[])
            }
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
    const review_bookings = bookings.filter((b) => b.status === 'review')
    const upcoming = bookings.filter((b) =>
        b.status === 'confirmed' && isUpcoming(b.date)
    )
    const past = bookings.filter((b) =>
        b.status === 'completed-unpaid' ||
        b.status === 'completed' ||
        (b.status === 'confirmed' && !isUpcoming(b.date))
    )


    const TABS: { key: Tab; label: string; count?: number }[] = [
        { key: 'requests', label: 'Requests', count: pending.length },
        { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
        { key: 'review' as Tab, label: 'To Review', count: review_bookings.length },
        { key: 'past', label: 'Past' },
        
    ]

    const activeList =
        tab === 'requests' ? pending :
            tab === 'review' ? review_bookings :
                tab === 'upcoming' ? upcoming :
                    past

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav
                fullName={fullName}
                avatarUrl={avatarUrl}
                profileHref="/dashboard/coach/profile"
                dashboardHref="/dashboard/coach"
            />
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
                                    tab === 'review' ? 'No sessions to review' :
                                        'No past sessions'}
                        </p>
                        <p className="text-sm text-gray-400">
                            {tab === 'requests' ? 'New booking requests will appear here.' :
                                tab === 'upcoming' ? 'Accepted bookings will show up here.' :
                                    tab === 'review' ? 'Sessions ready for review will appear here.' :
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
                            : tab === 'review'
                                ? activeList.map((b) => (
                                    <ReviewCard key={b.id} booking={b} />
                                ))
                                : activeList.map((b) => (
                                    <BookingCard key={b.id} booking={b} />
                                ))
                        }
                    </div>
                )}
                <Link
                    href="/dashboard/coach"
                    className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to dashboard
                </Link>
            </div>
        </div>
    )
}