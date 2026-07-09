'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Star, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: string | null
    created_at: string
}

type RecentSession = {
    date: string
    start_time: string
    end_time: string
    coach_name: string | null
    client_name: string | null
}

function getInitials(name: string | null) {
    if (!name) return '?'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(t: string) {
    const [h, m] = t.split(':')
    const h12 = parseInt(h) % 12 || 12
    return `${h12}:${m} ${parseInt(h) < 12 ? 'AM' : 'PM'}`
}

function formatDateLong(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
}

function StarRating({ rating }: { rating: number | null }) {
    const value = rating ?? 0
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={`w-4 h-4 ${i < value ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                />
            ))}
            <span className="text-sm font-medium text-gray-600 ml-1">{value}/5</span>
        </div>
    )
}

export default function UserPopup({
    user,
    onClose,
}: {
    user: Profile | null
    onClose: () => void
}) {
    const supabase = createClient()
    const [rating, setRating] = useState<number | null>(null)
    const [recentSession, setRecentSession] = useState<RecentSession | null>(null)
    const [loading, setLoading] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState('')

    useEffect(() => {
        if (!user) return
        setRating(null)
        setRecentSession(null)
        setConfirmDelete(false)
        setDeleteError('')

        async function load() {
            setLoading(true)

            // Fetch rating from client_profiles
            if (user!.role === 'client') {
                const { data: clientProfile } = await supabase
                    .from('client_profiles')
                    .select('rating')
                    .eq('id', user!.id)
                    .single()

                setRating(clientProfile?.rating ?? null)
            }

            // Fetch most recent session depending on role
            if (user!.role === 'client') {
                const { data } = await supabase
                    .from('bookings')
                    .select(`
            date, start_time, end_time,
            coach_profiles (
              profiles ( full_name )
            )
          `)
                    .eq('student_id', user!.id)
                    .eq('status', 'confirmed')
                    .order('date', { ascending: false })
                    .limit(1)
                    .single()

                if (data) {
                    setRecentSession({
                        date: data.date,
                        start_time: data.start_time,
                        end_time: data.end_time,
                        coach_name: (data.coach_profiles as any)?.profiles?.full_name ?? null,
                        client_name: null,
                    })
                }
            } else if (user!.role === 'coach') {
                const { data } = await supabase
                    .from('bookings')
                    .select(`
            date, start_time, end_time,
            profiles!bookings_student_id_fkey ( full_name )
          `)
                    .eq('coach_id', user!.id)
                    .eq('status', 'confirmed')
                    .order('date', { ascending: false })
                    .limit(1)
                    .single()

                if (data) {
                    setRecentSession({
                        date: data.date,
                        start_time: data.start_time,
                        end_time: data.end_time,
                        coach_name: null,
                        client_name: (data.profiles as any)?.full_name ?? null,
                    })
                }
            }

            setLoading(false)
        }

        load()
    }, [user?.id])

    if (!user) return null

    const handleDelete = async () => {
        if (!user) return
        setDeleting(true)
        setDeleteError('')

        const res = await fetch('/api/admin/delete-user', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
        })

        const data = await res.json()

        if (!res.ok) {
            setDeleteError(data.error ?? 'Failed to delete user.')
            setDeleting(false)
            return
        }

        setDeleting(false)
        onClose()
        window.location.reload()
    }

    const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
        coach: { label: 'Coach', className: 'bg-blue-50 text-blue-600' },
        client: { label: 'Client', className: 'bg-purple-50 text-purple-600' },
        admin: { label: 'Admin', className: 'bg-gray-100 text-gray-600' },
    }

    const role = ROLE_CONFIG[user.role ?? ''] ?? {
        label: user.role ?? 'Unknown',
        className: 'bg-gray-100 text-gray-500',
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-400" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-900">User Profile</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Avatar + name */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 font-bold text-xl flex items-center justify-center border border-blue-100 overflow-hidden shrink-0">
                                {user.avatar_url
                                    ? <img src={user.avatar_url} alt={user.full_name ?? ''} className="w-full h-full object-cover" />
                                    : getInitials(user.full_name)
                                }
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-bold text-gray-900">{user.full_name ?? 'Unnamed'}</p>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${role.className}`}>
                                    {role.label}
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-10 bg-gray-100 rounded-xl" />
                                <div className="h-24 bg-gray-100 rounded-xl" />
                            </div>
                        ) : (
                            <>
                                {/* Rating — clients only */}
                                {user.role === 'client' && (
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-1">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rating</p>
                                        <StarRating rating={rating} />
                                    </div>
                                )}

                                {/* Most recent session */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                        Most Recent Session
                                    </p>
                                    {recentSession ? (
                                        <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
                                            <div className="flex items-center gap-3 px-4 py-3">
                                                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-gray-400">Date</p>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {formatDateLong(recentSession.date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 px-4 py-3">
                                                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-gray-400">Time</p>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {formatTime(recentSession.start_time)} – {formatTime(recentSession.end_time)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 px-4 py-3">
                                                <div className="w-4 h-4 rounded-full bg-blue-100 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        {user.role === 'client' ? 'Coach' : 'Client'}
                                                    </p>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {user.role === 'client'
                                                            ? recentSession.coach_name ?? 'Unknown'
                                                            : recentSession.client_name ?? 'Unknown'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-5 text-center">
                                            <p className="text-sm text-gray-400">No sessions yet</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        {/* Delete user */}
                        <div className="pt-2 border-t border-gray-100">
                            {!confirmDelete ? (
                                <button
                                    onClick={() => setConfirmDelete(true)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete user
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm text-center text-gray-600">
                                        Are you sure? This will permanently delete{' '}
                                        <span className="font-semibold">{user.full_name ?? 'this user'}</span> and all their data.
                                    </p>
                                    {deleteError && (
                                        <p className="text-xs text-red-500 text-center">{deleteError}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setConfirmDelete(false)}
                                            disabled={deleting}
                                            className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                                        >
                                            {deleting ? 'Deleting…' : 'Yes, delete'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}